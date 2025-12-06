/**
 * Phonetic normalization for Indian English & Hinglish.
 * Helps the diff algorithm match words despite accent differences.
 * 
 * Based on research: Common phonetic confusions in Indian English ASR
 */

// ============================================================================
// PHONETIC MAPPINGS
// ============================================================================

/**
 * Common Hinglish/Indian accent phonetic equivalences
 * Based on research into ASR failure modes
 */
const PHONETIC_REPLACEMENTS: [RegExp, string][] = [
  // V/W confusion (very common in Indian English)
  [/v/g, 'w'],

  // Aspirated consonants
  [/ph/g, 'f'],
  [/th/g, 'd'],      // "that" -> "dat"
  [/bh/g, 'b'],      // "bharat" matches "barat"
  [/dh/g, 'd'],      // "dhanya" matches "danya"
  [/gh/g, 'g'],      // "ghar" matches "gar"
  [/kh/g, 'k'],      // "khan" matches "kan"

  // Sibilants
  [/sh/g, 's'],      // "shaam" matches "saam"
  [/ch/g, 'c'],      // Normalize

  // Z/J confusion
  [/z/g, 'j'],       // "zaroori" vs "jaroori"

  // Vowel normalizations
  [/ee/g, 'i'],      // "jeeb" -> "jib"
  [/oo/g, 'u'],      // "hoon" -> "hun"
  [/aa/g, 'a'],      // "naam" -> "nam"
  [/ai/g, 'e'],      // "hai" -> "he"
  [/au/g, 'o'],      // "kaun" -> "kon"

  // Silent letters / endings
  [/h$/g, ''],       // Final 'h' often silent: "yeah" -> "yea"
  [/a$/g, ''],       // Schwa deletion: "Rama" -> "Ram"

  // Y/J confusion
  [/y/g, 'j'],       // "yaar" matches "jaar"
];

/**
 * Common word-level phonetic confusions (exact mappings)
 * Words that sound identical but are spelled differently
 */
const PHONETIC_WORD_MAP: Record<string, string> = {
  // Cross-lingual homophones
  'bill': 'bil',
  'school': 'skul',
  'cool': 'kul',
  'fool': 'ful',

  // Common ASR confusions
  'usko': 'usko',    // Often misheard as "school"
  'mujhe': 'mujhe',  // Often becomes "movie"

  // Particles
  'hai': 'he',
  'hain': 'hen',
  'ho': 'ho',
  'hoon': 'hun',

  // Pronouns
  'main': 'men',
  'mein': 'men',
  'mai': 'me',
  'tum': 'tum',
  'aap': 'ap',
  'woh': 'wo',
  'yeh': 'ye',
};

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalizes a word to its phonetic form for comparison
 */
export const normalizeWord = (word: string): string => {
  if (!word) return '';

  // 1. Lowercase and remove punctuation
  let clean = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"'?]/g, '');

  // 2. Check for known word-level mappings first
  if (PHONETIC_WORD_MAP[clean]) {
    return PHONETIC_WORD_MAP[clean];
  }

  // 3. Apply phonetic replacement rules in order
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    clean = clean.replace(pattern, replacement);
  }

  return clean;
};

/**
 * Checks if two words are phonetically similar
 */
export const isFuzzyMatch = (wordA: string, wordB: string): boolean => {
  if (wordA === wordB) return true;
  if (wordA.toLowerCase() === wordB.toLowerCase()) return true;

  // Check phonetic match
  return normalizeWord(wordA) === normalizeWord(wordB);
};

/**
 * Find the best phonetic match for a word in a dictionary
 * Returns the matched key or null if no match
 */
export const findPhoneticMatch = (
  word: string,
  dictionary: Record<string, string>
): string | null => {
  const normalizedInput = normalizeWord(word);

  for (const key of Object.keys(dictionary)) {
    if (normalizeWord(key) === normalizedInput) {
      return key;
    }
  }

  return null;
};

/**
 * Get phonetic similarity score between two words (0-1)
 * Simple Levenshtein-based approach on normalized forms
 */
export const getPhoneticSimilarity = (wordA: string, wordB: string): number => {
  const normA = normalizeWord(wordA);
  const normB = normalizeWord(wordB);

  if (normA === normB) return 1.0;
  if (normA.length === 0 || normB.length === 0) return 0;

  // Simple length-based similarity for quick estimate
  const maxLen = Math.max(normA.length, normB.length);
  const minLen = Math.min(normA.length, normB.length);

  // Check prefix match
  let matchingChars = 0;
  for (let i = 0; i < minLen; i++) {
    if (normA[i] === normB[i]) matchingChars++;
  }

  return matchingChars / maxLen;
};