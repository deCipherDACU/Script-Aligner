import * as Diff from 'diff';
import { WORD_BANK } from '../utils/wordBank';
import { findPhoneticMatch } from '../utils/phonetics';
import { applyITN } from '../utils/itn';

interface SrtBlock {
    id: string;
    time: string;
    text: string;
    cleanWords: string[];
}

/**
 * Cleaning function to remove non-dialogue content
 * Filters out:
 * 1. URLs
 * 2. Bracketed/Parenthetical instructions e.g. [Shot 1], (Laughs)
 * 3. Scene headers (INT., EXT., CUT TO)
 * 4. Speaker Names (John:, SPEAKER 1:)
 * 5. Specific artifacts like "Unknown" or "Unknow"
 */
const cleanText = (text: string): string => {
    let cleaned = text;

    // 1. Remove URLs (http/https/www)
    cleaned = cleaned.replace(/(https?:\/\/[^\s]+)/g, '');
    cleaned = cleaned.replace(/(www\.[^\s]+)/g, '');

    // 2. Remove bracketed info often used for shots/directions
    // Matches [], (), {}, <>
    // We use a non-greedy match .*? to handle multiple brackets on one line
    cleaned = cleaned.replace(/[\[\(\{<].*?[\]\)\}>]/g, '');

    // 3. Remove common Scene Headings or Camera directions if they appear on their own lines
    // Checks for lines starting with INT., EXT., SCENE, CUT TO, FADE IN
    // Multiline flag 'm' allows ^ to match start of line
    cleaned = cleaned.replace(/^(INT\.|EXT\.|SCENE\s|CUT TO:|FADE IN:|CAMERA|ANGLE).*/gmi, '');

    // 4. Remove Speaker Names / Labels
    // Matches start of line, optional symbols (> or -), Name (alphanumeric/spaces/parens up to 30 chars), followed by Colon OR " - " separator.
    // Requirement: Must have whitespace after the separator to avoid matching timestamps (e.g. 12:30).
    // e.g. "John:", "SARAH:", "Speaker 1:", "Narrator (V.O.):", "> Host:", "Alice - "
    cleaned = cleaned.replace(/^\s*(?:>|-)?\s*([A-Za-z0-9\s\.\(\)\-]{1,30})(?::|\s+-)\s+/gm, '');

    // 5. Remove "Unknown" / "Unknow" artifacts
    // Remove standalone lines containing only "Unknown" or "Unknow"
    cleaned = cleaned.replace(/^\s*unknow[n]?\s*$/gmi, '');
    // Remove the specific typo "unknow" if it appears as a word anywhere (ASR artifact)
    cleaned = cleaned.replace(/\bunknow\b/gi, '');

    // 6. Remove purely numeric lines that might be page numbers or shot numbers
    cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');

    // 7. Normalize whitespace (collapse multiple spaces/newlines)
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
};

/**
 * Parses raw SRT string into structured blocks
 */
const parseSrt = (srt: string): SrtBlock[] => {
    // Normalize line endings
    const normalized = srt.replace(/\r\n/g, '\n');
    const blocks = normalized.split(/\n\n+/);

    return blocks.map(block => {
        const lines = block.split('\n');
        if (lines.length < 3) return null;

        const id = lines[0];
        const time = lines[1];
        // Join remaining lines as text
        const text = lines.slice(2).join(' ');

        // CLEAN THE SRT TEXT AS WELL
        // This removes "Speaker:" labels from the source so they don't confuse the diff
        const cleanedText = cleanText(text);
        const cleanWords = cleanedText.trim().split(/\s+/);

        return { id, time, text: cleanedText, cleanWords };
    }).filter(b => b !== null) as SrtBlock[];
};

/**
 * Reconstructs SRT from blocks
 */
const stringifySrt = (blocks: SrtBlock[]): string => {
    return blocks.map(b => `${b.id}\n${b.time}\n${b.text}`).join('\n\n');
};

/**
 * Applies Word Bank corrections to text.
 * Replaces known slang/typos with correct forms.
 * Uses phonetic matching for accent-tolerant lookups.
 * Prioritizes customBank if provided.
 */
const applyWordBank = (text: string, customBank: Record<string, string> = {}): string => {
    // Merge dictionaries for phonetic lookup (custom overrides default)
    const mergedBank = { ...WORD_BANK, ...customBank };

    // Split into tokens including punctuation
    // We want to replace words but keep punctuation
    return text.split(/\b/).map(token => {
        const lower = token.toLowerCase();

        // 1. Exact match in Custom Bank first (Overrides)
        if (customBank[lower]) {
            return customBank[lower];
        }

        // 2. Exact match in Default Word Bank
        if (WORD_BANK[lower]) {
            return WORD_BANK[lower];
        }

        // 3. Phonetic fuzzy match (fallback)
        // Only for tokens that look like words (not punctuation)
        if (token.length > 2 && /^[a-zA-Z]+$/.test(token)) {
            const phoneticKey = findPhoneticMatch(lower, mergedBank);
            if (phoneticKey) {
                return mergedBank[phoneticKey];
            }
        }

        return token;
    }).join('');
};

/**
 * Offline Alignment Algorithm
 * 1. Clean the Script (remove shots, links).
 * 2. Flatten SRT words.
 * 3. Diff against Script words.
 * 4. Re-bucketize words into SRT timestamps.
 */
export const alignSrtOffline = async (
    srtContent: string,
    scriptContent: string,
    customWordBank: Record<string, string> = {}
): Promise<string> => {
    // Wrap in Promise/setTimeout to prevent blocking the UI thread immediately.
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Validation 1: Empty Inputs
                if (!srtContent || !srtContent.trim()) {
                    throw new Error("Source SRT file content is empty.");
                }
                if (!scriptContent || !scriptContent.trim()) {
                    throw new Error("Correct Script content is empty.");
                }

                // 0. Pre-process SRT with Word Bank to fix obvious typos before diffing
                const correctedSrtContent = applyWordBank(srtContent, customWordBank);

                // 1. Parse SRT (Applying Speaker cleaning during parse)
                const srtBlocks = parseSrt(correctedSrtContent);

                // Validation 2: SRT Parsing
                if (srtBlocks.length === 0) {
                    throw new Error("No valid subtitles found. Please check if the source file is a valid SRT with timestamps.");
                }

                // 2. PRE-PROCESSING: Clean the script to remove non-spoken text
                const cleanScript = cleanText(scriptContent);

                // Validation 3: Script Content
                const scriptWords = cleanScript.match(/\S+/g) || [];
                if (scriptWords.length === 0) {
                    throw new Error("Script contains no usable text after cleaning. It might only contain metadata, scene headers, or timestamps which are automatically removed.");
                }

                // 3. Prepare Lists
                // We keep track of which block every word in the SRT belongs to
                let srtWordMap: { word: string, blockIndex: number }[] = [];
                srtBlocks.forEach((block, idx) => {
                    // The block.text is already cleaned of speaker names inside parseSrt
                    const words = block.text.match(/\S+/g) || [];
                    words.forEach(w => {
                        srtWordMap.push({ word: w, blockIndex: idx });
                    });
                });

                // 4. Run Diff (Word based)
                // We compare the raw text of SRT vs Script
                const srtFullText = srtWordMap.map(m => m.word).join(' ');
                const scriptFullText = scriptWords.join(' ');

                const diffs = Diff.diffWords(srtFullText, scriptFullText);

                // 5. Reconstruction
                const newBlockTexts: string[][] = srtBlocks.map(() => []);

                let currentBlockIndex = 0;
                let srtWordCursor = 0;

                diffs.forEach(part => {
                    const partWords = part.value.match(/\S+/g) || [];

                    if (part.added) {
                        // Words exist in Script but not SRT.
                        partWords.forEach(w => {
                            if (currentBlockIndex < newBlockTexts.length) {
                                newBlockTexts[currentBlockIndex].push(w);
                            }
                        });
                    } else if (part.removed) {
                        // Words exist in SRT but not Script.
                        // Advance cursor, don't write.
                        partWords.forEach(() => {
                            if (srtWordCursor < srtWordMap.length) {
                                currentBlockIndex = srtWordMap[srtWordCursor].blockIndex;
                                srtWordCursor++;
                            }
                        });
                    } else {
                        // Unchanged (Match).
                        partWords.forEach(w => {
                            if (srtWordCursor < srtWordMap.length) {
                                currentBlockIndex = srtWordMap[srtWordCursor].blockIndex;
                                srtWordCursor++;
                            }

                            if (currentBlockIndex < newBlockTexts.length) {
                                newBlockTexts[currentBlockIndex].push(w);
                            }
                        });
                    }
                });

                // 6. Formatting
                srtBlocks.forEach((block, idx) => {
                    const words = newBlockTexts[idx];
                    block.text = words.join(' ');
                });

                // 7. Apply ITN (currency, schwa, etc.)
                const rawResult = stringifySrt(srtBlocks);
                const finalResult = applyITN(rawResult);

                resolve(finalResult);

            } catch (e: any) {
                console.error("Offline Alignment Error", e);
                reject(e);
            }
        }, 100);
    });
};

/**
 * Quick Fix Mode - Word Bank Only Correction
 * Applies Word Bank corrections without requiring a reference script.
 * Useful for fixing common typos, slang, and phonetic errors.
 */
export const correctSrtWithWordBank = async (
    srtContent: string,
    customWordBank: Record<string, string> = {}
): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Validation
                if (!srtContent || !srtContent.trim()) {
                    throw new Error("Source content is empty.");
                }

                // Apply Word Bank corrections
                const correctedContent = applyWordBank(srtContent, customWordBank);

                // Check if it looks like SRT format
                const hasSrtTimestamps = /\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(srtContent);

                if (hasSrtTimestamps) {
                    // Parse and reconstruct to clean up formatting
                    const blocks = parseSrt(correctedContent);
                    if (blocks.length > 0) {
                        resolve(stringifySrt(blocks));
                        return;
                    }
                }

                // If not valid SRT, just return cleaned text with ITN
                resolve(applyITN(correctedContent));

            } catch (e: any) {
                console.error("Word Bank Correction Error", e);
                reject(e);
            }
        }, 50);
    });
};