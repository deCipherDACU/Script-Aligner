/**
 * Inverse Text Normalization (ITN) for Indian English & Hinglish
 * Converts spoken/casual number formats to formal written formats
 * 
 * Based on research: Indian numbering system (Lakh, Crore), currency formatting
 */

// ============================================================================
// INDIAN NUMBERING SYSTEM
// ============================================================================

/**
 * Converts a number to Indian format with Lakh/Crore notation
 * 1,00,000 = 1 Lakh, 1,00,00,000 = 1 Crore
 */
export const formatIndianNumber = (num: number): string => {
    if (num >= 10000000) {
        const crores = num / 10000000;
        return crores % 1 === 0 ? `${crores} Crore` : `${crores.toFixed(2)} Crore`;
    }
    if (num >= 100000) {
        const lakhs = num / 100000;
        return lakhs % 1 === 0 ? `${lakhs} Lakh` : `${lakhs.toFixed(2)} Lakh`;
    }
    if (num >= 1000) {
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
    }
    return num.toString();
};

/**
 * Formats number with Indian comma placement (XX,XX,XXX)
 */
export const formatWithIndianCommas = (num: number): string => {
    const numStr = Math.floor(num).toString();
    if (numStr.length <= 3) return numStr;

    let result = numStr.slice(-3);
    let remaining = numStr.slice(0, -3);

    while (remaining.length > 0) {
        const chunk = remaining.slice(-2);
        result = chunk + ',' + result;
        remaining = remaining.slice(0, -2);
    }

    return result;
};

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

const CURRENCY_WORDS: Record<string, string> = {
    'rupees': '₹',
    'rupee': '₹',
    'rs': '₹',
    'rs.': '₹',
    'inr': '₹',
    'dollars': '$',
    'dollar': '$',
    'usd': '$',
};

/**
 * Converts written currency to symbol format
 * "100 rupees" -> "₹100"
 */
export const normalizeCurrency = (text: string): string => {
    let result = text;

    // Pattern: "NUMBER CURRENCY_WORD" -> "SYMBOL NUMBER"
    for (const [word, symbol] of Object.entries(CURRENCY_WORDS)) {
        const regex = new RegExp(`(\\d+(?:[\\.\\,]\\d+)?)\\s*${word}`, 'gi');
        result = result.replace(regex, `${symbol}$1`);

        // Also handle "CURRENCY_WORD NUMBER"
        const regex2 = new RegExp(`${word}\\s*(\\d+(?:[\\.\\,]\\d+)?)`, 'gi');
        result = result.replace(regex2, `${symbol}$1`);
    }

    return result;
};

// ============================================================================
// NUMBER WORD TO DIGIT CONVERSION
// ============================================================================

const NUMBER_WORDS: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100, 'thousand': 1000, 'lakh': 100000, 'crore': 10000000,
    // Hindi number words
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
    'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'sau': 100, 'hazaar': 1000, 'hazar': 1000,
};

/**
 * Converts simple number words to digits
 * "twenty" -> "20", "paanch" -> "5"
 */
export const numberWordsToDigits = (text: string): string => {
    let result = text;

    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, num.toString());
    }

    return result;
};

// ============================================================================
// SCHWA DELETION (Sanskrit -> Modern Hindi pronunciation)
// ============================================================================

const SCHWA_DELETIONS: Record<string, string> = {
    // Common words where final 'a' is dropped in speech
    'rama': 'Ram',
    'krishna': 'Krishna', // Exception - kept
    'shiva': 'Shiv',
    'ganga': 'Ganga', // Exception - kept  
    'karna': 'Karan',
    'arjuna': 'Arjun',
    'hanumana': 'Hanuman',
    'ravana': 'Ravan',

    // Common name patterns
    'mohana': 'Mohan',
    'lakshmana': 'Lakshman',
    'bharata': 'Bharat',
    'gopala': 'Gopal',
    'narayana': 'Narayan',

    // Place names
    'mathura': 'Mathura', // Exception
    'ayodhya': 'Ayodhya', // Exception
};

/**
 * Applies schwa deletion rules for more natural Hindi names
 */
export const applySchwaRules = (text: string): string => {
    let result = text;

    for (const [informal, formal] of Object.entries(SCHWA_DELETIONS)) {
        const regex = new RegExp(`\\b${informal}\\b`, 'gi');
        result = result.replace(regex, formal);
    }

    return result;
};

// ============================================================================
// MASTER ITN FUNCTION
// ============================================================================

export interface ITNOptions {
    normalizeCurrency?: boolean;
    convertNumberWords?: boolean;
    applySchwa?: boolean;
}

/**
 * Apply all Inverse Text Normalization rules
 */
export const applyITN = (text: string, options: ITNOptions = {}): string => {
    const {
        normalizeCurrency: doCurrency = true,
        convertNumberWords: doNumbers = false, // Off by default (can change meaning)
        applySchwa: doSchwa = true,
    } = options;

    let result = text;

    if (doCurrency) {
        result = normalizeCurrency(result);
    }

    if (doNumbers) {
        result = numberWordsToDigits(result);
    }

    if (doSchwa) {
        result = applySchwaRules(result);
    }

    return result;
};
