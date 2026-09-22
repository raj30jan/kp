/**
 * Single source of truth for the quantity / price units a seller can pick
 * on the common "Sell" form. Every commodity (crops, seeds, livestock,
 * machinery, land) uses the same form, so the list covers weight, volume,
 * count AND land-area units. The frontend mirrors this list; the backend
 * validates against it so junk never reaches the database.
 */
export interface UnitDef {
  code: string
  en: string
  hi: string
  /** Which family the unit belongs to — used to group the dropdown. */
  group: 'weight' | 'volume' | 'count' | 'area'
}

export const QUANTITY_UNITS: UnitDef[] = [
  { code: 'kg', en: 'Kilogram (kg)', hi: 'किलोग्राम', group: 'weight' },
  { code: 'quintal', en: 'Quintal (100 kg)', hi: 'क्विंटल', group: 'weight' },
  { code: 'ton', en: 'Ton (1000 kg)', hi: 'टन', group: 'weight' },
  { code: 'gram', en: 'Gram (g)', hi: 'ग्राम', group: 'weight' },
  { code: 'litre', en: 'Litre', hi: 'लीटर', group: 'volume' },
  { code: 'ml', en: 'Millilitre', hi: 'मिलीलीटर', group: 'volume' },
  { code: 'piece', en: 'Piece / Unit', hi: 'नग', group: 'count' },
  { code: 'dozen', en: 'Dozen', hi: 'दर्जन', group: 'count' },
  { code: 'bag', en: 'Bag', hi: 'बोरी', group: 'count' },
  { code: 'box', en: 'Box / Crate', hi: 'पेटी', group: 'count' },
  { code: 'bundle', en: 'Bundle', hi: 'बंडल', group: 'count' },
  { code: 'acre', en: 'Acre', hi: 'एकड़', group: 'area' },
  { code: 'bigha', en: 'Bigha', hi: 'बीघा', group: 'area' },
  { code: 'hectare', en: 'Hectare', hi: 'हेक्टेयर', group: 'area' },
  { code: 'kanal', en: 'Kanal', hi: 'कनाल', group: 'area' },
  { code: 'marla', en: 'Marla', hi: 'मरला', group: 'area' },
  { code: 'sqft', en: 'Square feet', hi: 'वर्ग फुट', group: 'area' },
  { code: 'sqyd', en: 'Square yard (gaj)', hi: 'वर्ग गज', group: 'area' },
]

export const QUANTITY_UNIT_CODES = QUANTITY_UNITS.map((u) => u.code)

/**
 * Price units are "per_<quantity unit>" plus "total" (whole lot / whole
 * plot — the default for land). Kept as a regex source so DTOs can use it.
 */
export const PRICE_UNIT_CODES = ['total', ...QUANTITY_UNIT_CODES.map((c) => `per_${c}`)]
export const PRICE_UNIT_REGEX = new RegExp(`^(${PRICE_UNIT_CODES.join('|')})$`)
