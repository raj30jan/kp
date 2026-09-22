/**
 * Lightweight product-name -> category matcher.
 *
 * Sellers may type the product title in their own local language
 * (Hindi, Punjabi, etc. transliterated or native script) while the
 * `category` field itself stays one of our fixed English keys. To let
 * buyers search in either language and still find the right listings,
 * we keep a small synonym dictionary mapping common local-language /
 * transliterated product names to our category keys. The search query
 * is checked against this dictionary first; if a category is detected
 * it is OR-ed into the text match so results surface even when the
 * buyer's search term doesn't literally appear in the title.
 */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  crops: ['fasal', 'anaj', 'grain', 'wheat', 'gehu', 'gehun', 'rice', 'chawal', 'dhaan', 'makka', 'maize', 'bajra', 'jowar', 'फसल', 'अनाज', 'गेहूं', 'चावल', 'धान', 'मक्का', 'बाजरा', 'ज्वार'],
  vegetables: ['sabzi', 'sabji', 'vegetable', 'aloo', 'potato', 'pyaz', 'onion', 'tamatar', 'tomato', 'gobi', 'bhindi', 'सब्जी', 'सब्जियाँ', 'आलू', 'प्याज', 'टमाटर', 'गोभी', 'भिंडी', 'गाजर', 'मिर्च'],
  fruits: ['fal', 'phal', 'fruit', 'aam', 'mango', 'kela', 'banana', 'seb', 'apple', 'angoor', 'grape', 'फल', 'आम', 'केला', 'सेब', 'अंगूर'],
  seeds: ['beej', 'bija', 'seed', 'seeds', 'बीज'],
  tools: ['upkaran', 'yantra', 'auzar', 'tool', 'tractor', 'trolley', 'machine', 'उपकरण', 'यंत्र', 'औजार', 'ट्रैक्टर', 'मशीन'],
  fertilizers: ['khad', 'urvarak', 'fertilizer', 'pesticide', 'keetnashak', 'dawai', 'खाद', 'उर्वरक', 'कीटनाशक', 'दवाई'],
  livestock: ['pashu', 'gaay', 'cow', 'bhains', 'buffalo', 'bakri', 'goat', 'murga', 'poultry', 'पशु', 'गाय', 'भैंस', 'बकरी', 'मुर्गा', 'मुर्गी'],
  dairy: ['doodh', 'milk', 'dahi', 'curd', 'ghee', 'paneer', 'दूध', 'दही', 'घी', 'पनीर'],
  land: ['zameen', 'jameen', 'khet', 'plot', 'land', 'zamin', 'भूमि', 'जमीन', 'खेत', 'प्लॉट', 'ज़मीन'],
}

/** Returns the category key detected in a free-text query, if any. */
export function detectCategoryFromQuery(query: string): string | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (category === q) return category
    if (synonyms.some((s) => q.includes(s))) return category
  }
  return null
}

/**
 * Devanagari -> Latin transliteration for Hinglish search.
 *
 * Buyers type Hindi product names in Latin script ("tamatar", "gehu",
 * "aloo") while sellers may store the Hindi title in Devanagari
 * ("टमाटर"). Romanizing the stored Hindi text lets a plain substring
 * match work in both directions. Long/short vowels collapse to single
 * letters (ा/अ both -> 'a') so spelling variants still match.
 */
const DEV_LATIN: Record<string, string> = {
  // consonants (incl. nukta forms)
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'n',
  च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm',
  य: 'y', र: 'r', ल: 'l', व: 'v', ळ: 'l',
  श: 'sh', ष: 'sh', स: 's', ह: 'h',
  क़: 'q', ख़: 'kh', ग़: 'g', ज़: 'z', ड़: 'r', ढ़: 'rh', फ़: 'f',
  // independent vowels
  अ: 'a', आ: 'a', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u',
  ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au', ऋ: 'ri',
  // dependent vowel signs (matras)
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
  // signs
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '़': '',
}

const DEV_CONSONANT = /[क-हक़-य़]/
const DEV_MATRA = /[ा-ौॢ-ॣ]/
const VIRAMA = '्'

export function devanagariToLatin(input: string): string {
  if (!input) return ''
  const chars = [...input]
  let out = ''
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (DEV_CONSONANT.test(c)) {
      out += DEV_LATIN[c] || ''
      const next = chars[i + 1]
      // inherent 'a' unless a matra or virama follows
      if (next !== VIRAMA && !(next && DEV_MATRA.test(next))) out += 'a'
      continue
    }
    if (c === VIRAMA) continue // halant suppresses the inherent vowel
    out += DEV_LATIN[c] ?? c
  }
  return out
}

/**
 * Canonical form for loose Latin-script comparison: collapses common
 * romanization variants (aa/oo/ee/ai/au), drops a trailing schwa, and
 * strips punctuation. Applied to BOTH query and transliterated text so
 * "tamatar" == "tamatara" and "aloo" == "alu".
 */
export function normalizeLatin(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/aa/g, 'a')
    .replace(/oo/g, 'u')
    .replace(/ee/g, 'i')
    .replace(/ai/g, 'e')
    .replace(/au/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/a\b/g, '') // trailing word-final schwa
    .trim()
}
