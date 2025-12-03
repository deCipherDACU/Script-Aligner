/**
 * Phonetic normalization for Indian English & Hinglish.
 * Helps the diff algorithm match words despite accent differences.
 */

// Common Hinglish/Indian accent mappings
const PHONETIC_MAP: Record<string, string> = {
    'v': 'w',
    'w': 'v',
    'z': 'j', // e.g., 'zaroori' vs 'jaroori'
    'ph': 'f',
    'th': 'd', // e.g., 'that' -> 'dat'
    'ee': 'i', // e.g., 'jeeb' -> 'jib'
    'oo': 'u', // e.g., 'hoon' -> 'hun'
    'sh': 's',
    'y': 'j'
  };
  
  export const normalizeWord = (word: string): string => {
    if (!word) return '';
    
    // 1. Lowercase and remove punctuation
    let clean = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
    // 2. Apply phonetic swaps to create a "normalized key"
    // We replace specific chars with a canonical version for comparison
    return clean
      .replace(/v/g, 'w')       // Treat v and w as same
      .replace(/ph/g, 'f')      // Treat ph and f as same
      .replace(/z/g, 'j')       // Treat z and j as same
      .replace(/ee/g, 'i')      // Normalize long vowels
      .replace(/oo/g, 'u')
      .replace(/sh/g, 's')
      .replace(/th/g, 'd');
  };
  
  export const isFuzzyMatch = (wordA: string, wordB: string): boolean => {
    if (wordA === wordB) return true;
    if (wordA.toLowerCase() === wordB.toLowerCase()) return true;
    
    // Check phonetic match
    return normalizeWord(wordA) === normalizeWord(wordB);
  };