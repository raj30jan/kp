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
  crops: ['fasal', 'anaj', 'grain', 'wheat', 'gehu', 'gehun', 'rice', 'chawal', 'dhaan', 'makka', 'maize', 'bajra', 'jowar'],
  vegetables: ['sabzi', 'sabji', 'vegetable', 'aloo', 'potato', 'pyaz', 'onion', 'tamatar', 'tomato', 'gobi', 'bhindi'],
  fruits: ['fal', 'phal', 'fruit', 'aam', 'mango', 'kela', 'banana', 'seb', 'apple', 'angoor', 'grape'],
  seeds: ['beej', 'bija', 'seed', 'seeds'],
  tools: ['upkaran', 'yantra', 'auzar', 'tool', 'tractor', 'trolley', 'machine'],
  fertilizers: ['khad', 'urvarak', 'fertilizer', 'pesticide', 'keetnashak', 'dawai'],
  livestock: ['pashu', 'gaay', 'cow', 'bhains', 'buffalo', 'bakri', 'goat', 'murga', 'poultry'],
  dairy: ['doodh', 'milk', 'dahi', 'curd', 'ghee', 'paneer'],
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
