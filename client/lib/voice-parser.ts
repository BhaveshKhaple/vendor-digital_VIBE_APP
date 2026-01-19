/**
 * Voice Parser - NLP Logic for Voice-to-Record
 * Parses spoken phrases like "Dus rupaye ka chaye" or "Samosa bish taka"
 * into structured transaction data
 */

import type { Product } from '@/lib/repositories/types';

// Number words mapping (Hindi/English)
const NUMBER_WORDS: Record<string, number> = {
    // Hindi numbers
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'panch': 5,
    'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'dus': 10, 'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14,
    'pandrah': 15, 'solah': 16, 'satrah': 17, 'athrah': 18, 'unees': 19,
    'bees': 20, 'bish': 20, 'pachees': 25, 'tees': 30, 'chalis': 40,
    'pachaas': 50, 'saath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90,
    'sau': 100, 'hazaar': 1000, 'hazar': 1000,
    // English numbers
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
    'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40,
    'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
    'ninety': 90, 'hundred': 100, 'thousand': 1000,
};

// Keywords indicating expense vs sale
const EXPENSE_KEYWORDS = [
    'kharcha', 'kharche', 'expense', 'spent', 'paid', 'payment',
    'khareedna', 'liya', 'diya', 'minus', 'cost', 'buy', 'bought'
];

const SALE_KEYWORDS = [
    'becha', 'sale', 'sold', 'income', 'earning', 'kamaya', 'mila',
    'plus', 'received', 'sell', 'bikwaya'
];

// Currency keywords to filter out
const CURRENCY_KEYWORDS = [
    'rupee', 'rupees', 'rupaye', 'rupaya', 'rs', 'taka', 'ka', 'ke', 'ki',
    'for', 'wala', 'wali', 'worth'
];

export interface ParsedVoiceInput {
    amount: number | null;
    productName: string | null;
    matchedProduct: Product | null;
    transactionType: 'IN' | 'OUT';
    confidence: number; // 0 to 1
    rawText: string;
}

/**
 * Extract numeric amount from text
 */
function extractAmount(text: string): { amount: number | null; remainingText: string } {
    const words = text.toLowerCase().split(/\s+/);
    let totalAmount = 0;
    let foundNumber = false;
    const remainingWords: string[] = [];
    let multiplier = 1;

    for (let i = 0; i < words.length; i++) {
        const word = words[i].replace(/[^\w]/g, '');

        // Check for digit numbers
        if (/^\d+(\.\d+)?$/.test(word)) {
            const num = parseFloat(word);
            if (multiplier > 1) {
                totalAmount += num * multiplier;
                multiplier = 1;
            } else {
                totalAmount += num;
            }
            foundNumber = true;
            continue;
        }

        // Check for word numbers
        if (NUMBER_WORDS[word] !== undefined) {
            const num = NUMBER_WORDS[word];
            if (num === 100 || num === 1000) {
                // This is a multiplier
                if (totalAmount > 0) {
                    totalAmount *= num;
                } else {
                    multiplier = num;
                }
            } else {
                if (multiplier > 1) {
                    totalAmount += num * multiplier;
                    multiplier = 1;
                } else {
                    totalAmount += num;
                }
            }
            foundNumber = true;
            continue;
        }

        // Skip currency keywords
        if (CURRENCY_KEYWORDS.includes(word)) {
            continue;
        }

        remainingWords.push(words[i]);
    }

    return {
        amount: foundNumber ? totalAmount : null,
        remainingText: remainingWords.join(' ').trim(),
    };
}

/**
 * Determine if this is a sale or expense
 */
function determineTransactionType(text: string, isExpenseMode: boolean): 'IN' | 'OUT' {
    const lowerText = text.toLowerCase();

    for (const keyword of EXPENSE_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            return 'OUT';
        }
    }

    for (const keyword of SALE_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            return 'IN';
        }
    }

    // Default based on current mode
    return isExpenseMode ? 'OUT' : 'IN';
}

/**
 * Find best matching product from the product list
 */
function findMatchingProduct(
    searchText: string,
    products: Product[]
): { product: Product | null; confidence: number } {
    if (!searchText.trim() || products.length === 0) {
        return { product: null, confidence: 0 };
    }

    const normalizedSearch = searchText.toLowerCase().trim();
    let bestMatch: Product | null = null;
    let bestScore = 0;

    for (const product of products) {
        const productName = product.name.toLowerCase();

        // Exact match
        if (productName === normalizedSearch) {
            return { product, confidence: 1.0 };
        }

        // Contains match
        if (productName.includes(normalizedSearch) || normalizedSearch.includes(productName)) {
            const score = Math.min(productName.length, normalizedSearch.length) /
                Math.max(productName.length, normalizedSearch.length);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = product;
            }
        }

        // Word-by-word matching
        const searchWords = normalizedSearch.split(/\s+/);
        const productWords = productName.split(/\s+/);
        let matchedWords = 0;

        for (const searchWord of searchWords) {
            for (const productWord of productWords) {
                if (productWord.includes(searchWord) || searchWord.includes(productWord)) {
                    matchedWords++;
                    break;
                }
            }
        }

        const wordScore = matchedWords / Math.max(searchWords.length, 1) * 0.8;
        if (wordScore > bestScore) {
            bestScore = wordScore;
            bestMatch = product;
        }
    }

    return {
        product: bestScore >= 0.3 ? bestMatch : null,
        confidence: bestScore,
    };
}

/**
 * Main parser function - parses voice input into transaction data
 */
export function parseVoiceInput(
    text: string,
    products: Product[],
    isExpenseMode: boolean = false
): ParsedVoiceInput {
    // Extract amount
    const { amount, remainingText } = extractAmount(text);

    // Determine transaction type
    const transactionType = determineTransactionType(text, isExpenseMode);

    // Find matching product
    const { product, confidence: productConfidence } = findMatchingProduct(remainingText, products);

    // Calculate overall confidence
    let confidence = 0;
    if (amount !== null && amount > 0) {
        confidence += 0.5;
    }
    if (product !== null) {
        confidence += 0.3 + (productConfidence * 0.2);
    } else if (remainingText.length > 0) {
        confidence += 0.1; // Some text detected even if no product match
    }

    return {
        amount,
        productName: product?.name ?? (remainingText || null),
        matchedProduct: product,
        transactionType,
        confidence: Math.min(confidence, 1),
        rawText: text,
    };
}

/**
 * Generate confirmation text for TTS
 */
export function generateConfirmationText(parsed: ParsedVoiceInput): string {
    const typeText = parsed.transactionType === 'IN' ? 'sale' : 'expense';
    const amountText = parsed.amount ? `₹${parsed.amount}` : 'unknown amount';
    const itemText = parsed.productName || 'unknown item';

    return `Adding ${amountText} ${typeText} for ${itemText}. Confirm?`;
}

/**
 * Generate Hindi confirmation text for TTS
 */
export function generateHindiConfirmationText(parsed: ParsedVoiceInput): string {
    const typeText = parsed.transactionType === 'IN' ? 'bikri' : 'kharcha';
    const amountText = parsed.amount ? `${parsed.amount} rupaye` : 'rashi';
    const itemText = parsed.productName || 'item';

    return `${itemText} ka ${amountText} ${typeText} add kar rahe hain. Confirm?`;
}
