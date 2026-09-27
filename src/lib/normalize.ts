// Text normalization and phonetic skeleton keys matching src/normalize.py

// Pre-compiled Indic word transliteration dictionary learned from training pairs
export const INDIC_TRANSLITERATION: Record<string, string> = {
  'यूनिवर्सल': 'universal',
  'इम्पेक्स': 'impex',
  'प्राइवेट': 'private',
  'लिमिटेड': 'limited',
  'शिवम': 'shivam',
  'फूड्स': 'foods',
  'सदर्न': 'southern',
  'इंफोटेक': 'infotech',
  'ટેક': 'tech',
  'માર્કેટિંગ': 'marketing',
  'લિમિટેડ': 'limited',
  'ग्रेट': 'great',
  'प्रोजेक्ट्स': 'projects',
  'ਫਾਰਚੂਨ': 'fortune',
  'ਫੂਡਜ਼': 'foods',
  'एंटरप्राइजेज': 'enterprises',
  'सोल्यूशंस': 'solutions',
  'इंडस्ट्रीज': 'industries',
  'टेक्नोलॉजीज': 'technologies',
  'ग्लोबल': 'global',
  'इंटरनेशनल': 'international',
  'सर्विसेज': 'services',
  'ट्रेडर्स': 'traders',
  'कॉर्पोरेशन': 'corporation',
  'लॉजिस्टिक्स': 'logistics',
  'फार्मा': 'pharma',
  'केमिकल्स': 'chemicals',
  'इंजीनियरिंग': 'engineering',
  'एसोसिएट्स': 'associates',
  'हॉस्पिटैलिटी': 'hospitality',
  'इलेक्ट्रॉनिक्स': 'electronics',
};

const NON_ALNUM = /[^a-z0-9]+/g;
const LETTER_DIGIT = /(?<=[a-z])(?=[0-9])|(?<=[0-9])(?=[a-z])/g;
const ORDINAL = /^[0-9]+(st|nd|rd|th)$/;
const SKELETON_DROP = /[aeiouyh]/g;
const REPEATS = /(.)\1+/g;
const DOTTED_ACRONYM = /\b(?:[A-Za-z]\.){2,}[A-Za-z]?\.?/g;
const NON_LATIN = /[^\x00-\x7FÀ-ɏ]/;
const INDIC_WORD = /[\w\u0900-\u0D7F]+/g;

// Sound-alike substitution map: c,q,g->k; z,x->s; d->t; b->p; w->v
const SOUND_ALIKE: Record<string, string> = {
  c: 'k',
  q: 'k',
  g: 'k',
  z: 's',
  x: 's',
  d: 't',
  b: 'p',
  w: 'v',
};

// Digits commonly used as letters in typos (e.g. y0ga -> yoga)
const DIGIT_AS_LETTER: Record<string, string> = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
};

/**
 * Remove diacritics / accents (pure JS unidecode equivalent)
 */
export function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * clean(): ASCII normalisation, dotted acronyms joined ("S.A.S." -> "SAS"),
 * lowercase, "&" and "+" -> "and", apostrophes removed, punctuation -> space.
 */
export function clean(text: string): string {
  if (!text) return '';
  // 1. Join dotted acronyms: "S.A.S." -> "SAS", "L.L.C." -> "LLC"
  let res = text.replace(DOTTED_ACRONYM, (m) => m.replace(/\./g, ''));
  // 2. Remove diacritics / accents
  res = removeDiacritics(res);
  // 3. Lowercase & symbol replacements
  res = res.toLowerCase().replace(/&/g, ' and ').replace(/\+/g, ' and ').replace(/'/g, '');
  // 4. Non-alphanumeric to space
  return res.replace(NON_ALNUM, ' ').trim();
}

/**
 * Strip leading zeros from numeric token: "012" -> "12"
 */
function stripZeros(token: string): string {
  if (/^\d+$/.test(token)) {
    const stripped = token.replace(/^0+/, '');
    return stripped === '' ? '0' : stripped;
  }
  return token;
}

/**
 * name_tokens(): clean() + undo digit-for-letter swaps ("y0ga" -> "yoga"),
 * replace Indian script words using dictionary if present.
 */
export function nameTokens(name: string): string[] {
  if (!name) return [];
  let processedName = name;
  if (NON_LATIN.test(processedName)) {
    processedName = processedName.replace(INDIC_WORD, (m) => INDIC_TRANSLITERATION[m] || m);
  }

  const cleaned = clean(processedName);
  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];

  for (let t of rawTokens) {
    // If token has >= 2 letters and some digits, it's usually a typo like "y0ga" -> "yoga"
    const letterCount = (t.match(/[a-z]/g) || []).length;
    const isOnlyAlpha = /^[a-z]+$/.test(t);

    if (!isOnlyAlpha && letterCount >= 2 && !ORDINAL.test(t)) {
      t = t
        .split('')
        .map((c) => DIGIT_AS_LETTER[c] || c)
        .join('');
    }
    tokens.push(stripZeros(t));
  }

  return tokens;
}

/**
 * address_tokens(): clean() + split letters from numbers ("1604b" -> "1604 b") + drop leading zeros.
 */
export function addressTokens(address: string): string[] {
  if (!address) return [];
  const cleaned = clean(address);
  // Split letters from numbers: "1604b" -> "1604 b"
  const splitLettersDigits = cleaned.replace(LETTER_DIGIT, ' ');
  return splitLettersDigits.split(/\s+/).filter(Boolean).map(stripZeros);
}

/**
 * skeleton(): rough phonetic key for an alphabetic token:
 * drop vowels (and h/y), merge letters that sound alike, collapse repeats.
 * E.g.: "private" / "praaivett" -> "prvt", "limited" / "limittedd" -> "lmt".
 */
export function skeleton(token: string): string {
  if (!token || !/^[a-z]+$/.test(token)) {
    return '';
  }
  // Replace ph -> f, map sound-alikes
  let key = token.replace(/ph/g, 'f');
  key = key
    .split('')
    .map((c) => SOUND_ALIKE[c] || c)
    .join('');
  // Drop vowels, h, y
  key = key.replace(SKELETON_DROP, '');
  // Collapse consecutive repeats: "pp" -> "p", "tt" -> "t"
  key = key.replace(REPEATS, '$1');

  return key.length >= 2 ? key : '';
}
