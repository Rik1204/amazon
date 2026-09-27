"""Text cleaning, script transliteration, and phonetic skeleton generation."""
import re
import unicodedata

# Common transliteration mappings for Indian scripts
INDIC_MAP = {
    # Devanagari (Hindi / Marathi)
    'यूनिवर्सल': 'universal',
    'इम्पेक्स': 'impex',
    'प्राइवेट': 'private',
    'लिमिटेड': 'limited',
    'शिवम': 'shivam',
    'फूड्स': 'foods',
    'स्पाइसेज': 'spices',
    'एंड': 'and',
    'सदर्न': 'southern',
    'इंफोटेक': 'infotech',
    'फॉर्च्यून': 'fortune',
    'मार्केटिंग': 'marketing',
    'ग्रेट': 'great',
    'प्रोजेक्ट्स': 'projects',
    'भारत': 'bharat',
    'इलेक्ट्रॉनिक्स': 'electronics',
    'इलेक्ट्रिकल': 'electricals',
    'गणेश': 'ganesh',
    'ट्रेडिंग': 'trading',
    'एसोसिएट्स': 'associates',
    'महाराजा': 'maharaja',
    'टेक्सटाइल्स': 'textiles',
    'एक्सपोर्ट्स': 'exports',
    'कृष्णा': 'krishna',
    'इंजीनियरिंग': 'engineering',
    'वर्क्स': 'works',
    'रिलायंस': 'reliance',
    'ग्लोबल': 'global',
    'वेंचर्स': 'ventures',
    'एंटरप्राइजेज': 'enterprises',
    'सोल्यूशंस': 'solutions',
    'इंडस्ट्रीज': 'industries',
    'टेक्नोलॉजीज': 'technologies',
    'इंटरनेशनल': 'international',
    'सर्विसेज': 'services',
    'ट्रेडर्स': 'traders',
    'कॉर्पोरेशन': 'corporation',
    'लॉजिस्टिक्स': 'logistics',
    'फार्मा': 'pharma',
    'केमिकल्स': 'chemicals',
    'हॉस्पिटैलिटी': 'hospitality',

    # Gujarati
    'ટેક': 'tech',
    'માર્કેટિંગ': 'marketing',
    'લિમિટેડ': 'limited',
    'ઇમ્પેક્સ': 'impex',
    'પ્રાઇવેટ': 'private',

    # Punjabi (Gurmukhi)
    'ਫਾਰਚੂਨ': 'fortune',
    'ਫੂਡਜ਼': 'foods',
}

NON_ALNUM = re.compile(r'[^a-z0-9]+')
LETTER_DIGIT = re.compile(r'(?<=[a-z])(?=[0-9])|(?<=[0-9])(?=[a-z])')
ORDINAL = re.compile(r'^[0-9]+(st|nd|rd|th)$')
SKELETON_DROP = re.compile(r'[aeiouyh]')
REPEATS = re.compile(r'(.)\1+')
DOTTED_ACRONYM = re.compile(r'\b(?:[A-Za-z]\.){2,}[A-Za-z]?\.?')
NON_LATIN = re.compile(r'[^\x00-\x7FÀ-ɏ]')
INDIC_WORD = re.compile(r'[\w\u0900-\u0D7F]+')

SOUND_ALIKE = {
    'c': 'k', 'q': 'k', 'g': 'k',
    'z': 's', 'x': 's',
    'd': 't',
    'b': 'p',
    'w': 'v'
}

DIGIT_AS_LETTER = {
    '0': 'o',
    '1': 'l',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
}

def remove_diacritics(text: str) -> str:
    if not text:
        return ""
    nfkd = unicodedata.normalize('NFKD', text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

def clean(text: str) -> str:
    """Normalises string to ASCII, lowercases, replaces symbols."""
    if not text:
        return ""
    # Join dotted acronyms: "S.A.S." -> "SAS", "L.L.C." -> "LLC"
    text = DOTTED_ACRONYM.sub(lambda m: m.group(0).replace('.', ''), text)
    # Remove accents/diacritics
    text = remove_diacritics(text)
    # Lowercase & symbol expansions
    text = text.lower().replace('&', ' and ').replace('+', ' and ').replace("'", '')
    # Non-alphanumeric to spaces
    return NON_ALNUM.sub(' ', text).strip()

def strip_zeros(token: str) -> str:
    if token.isdigit():
        s = token.lstrip('0')
        return s if s else '0'
    return token

INDIC_CONSONANTS = {
    0x0915: 'k', 0x0916: 'kh', 0x0917: 'g', 0x0918: 'gh', 0x0919: 'ng',
    0x091A: 'ch', 0x091B: 'chh', 0x091C: 'j', 0x091D: 'jh', 0x091E: 'ny',
    0x091F: 't', 0x0920: 'th', 0x0921: 'd', 0x0922: 'dh', 0x0923: 'n',
    0x0924: 't', 0x0925: 'th', 0x0926: 'd', 0x0927: 'dh', 0x0928: 'n',
    0x092A: 'p', 0x092B: 'ph', 0x092C: 'b', 0x092D: 'bh', 0x092E: 'm',
    0x092F: 'y', 0x0930: 'r', 0x0932: 'l', 0x0935: 'v', 0x0936: 'sh',
    0x0937: 'sh', 0x0938: 's', 0x0939: 'h',
    0x0958: 'q', 0x0959: 'kh', 0x095A: 'g', 0x095B: 'z', 0x095C: 'r', 0x095D: 'rh', 0x095E: 'f'
}

INDIC_VOWELS = {
    0x0905: 'a', 0x0906: 'a', 0x0907: 'i', 0x0908: 'i', 0x0909: 'u', 0x090A: 'u',
    0x090F: 'e', 0x0910: 'ai', 0x0913: 'o', 0x0914: 'au',
    0x093E: 'a', 0x093F: 'i', 0x0940: 'i', 0x0941: 'u', 0x0942: 'u',
    0x0947: 'e', 0x0948: 'ai', 0x094B: 'o', 0x094C: 'au', 0x094D: ''
}

def transliterate_indic(text: str) -> str:
    if not text:
        return ""
    res = []
    i = 0
    n = len(text)
    while i < n:
        cp = ord(text[i])
        if cp in INDIC_CONSONANTS:
            res.append(INDIC_CONSONANTS[cp])
            if i + 1 < n and ord(text[i+1]) in INDIC_VOWELS:
                res.append(INDIC_VOWELS[ord(text[i+1])])
                i += 1
            elif i + 1 < n and ord(text[i+1]) == 0x094D: # virama
                i += 1
            else:
                res.append('a')
        elif cp in INDIC_VOWELS:
            res.append(INDIC_VOWELS[cp])
        else:
            res.append(text[i])
        i += 1
    return "".join(res)

def name_tokens(name: str) -> list:
    if not name:
        return []
    if NON_LATIN.search(name):
        # 1. First replace known domain words
        name = INDIC_WORD.sub(lambda m: INDIC_MAP.get(m.group(0), m.group(0)), name)
        # 2. Phonetically transliterate any remaining Indic script words
        if NON_LATIN.search(name):
            name = transliterate_indic(name)
    cleaned = clean(name)
    raw = cleaned.split()
    tokens = []
    for t in raw:
        letters = sum(1 for c in t if 'a' <= c <= 'z')
        if not t.isalpha() and letters >= 2 and not ORDINAL.match(t):
            t = "".join(DIGIT_AS_LETTER.get(c, c) for c in t)
        tokens.append(strip_zeros(t))
    return tokens

def address_tokens(address: str) -> list:
    if not address:
        return []
    cleaned = clean(address)
    split_ld = LETTER_DIGIT.sub(' ', cleaned)
    return [strip_zeros(t) for t in split_ld.split()]

def skeleton(token: str) -> str:
    if not token or not token.isalpha():
        return ""
    token = token.replace('ph', 'f')
    k = "".join(SOUND_ALIKE.get(c, c) for c in token)
    k = SKELETON_DROP.sub('', k)
    k = REPEATS.sub(r'\1', k)
    return k if len(k) >= 2 else ""
