// Which quantity / price units make sense for a given product category.
// The common Sell form covers everything from wheat to JCBs to farmland, so
// the unit dropdowns are narrowed per category family and sensible defaults
// are applied whenever the seller picks a category.
//
// groups: which unit groups (from backend units.ts) to show
// quantityUnit / priceUnit: defaults applied on category change

const PROFILES = [
  // Land: area units, whole-plot price.
  { match: ['land'], groups: ['area'], quantityUnit: 'acre', priceUnit: 'total' },
  // Machines, vehicles, equipment, structures, solar: sold by the piece.
  {
    match: ['agri-machinery', 'tractors', 'irrigation', 'solar', 'farm-structures', 'post-harvest-storage', 'packaging'],
    groups: ['count'],
    quantityUnit: 'piece',
    priceUnit: 'per_piece',
  },
  // Live animals: by head (piece).
  { match: ['livestock', 'poultry'], groups: ['count'], quantityUnit: 'piece', priceUnit: 'per_piece' },
  // Liquids: litres first, weight allowed (ghee, paneer).
  { match: ['dairy', 'edible-oils', 'beverages', 'honey'], groups: ['volume', 'weight', 'count'], quantityUnit: 'litre', priceUnit: 'per_litre' },
  // Nursery / flowers / saplings: count first.
  { match: ['nursery', 'flowers', 'ayurvedic-plants'], groups: ['count', 'weight'], quantityUnit: 'piece', priceUnit: 'per_piece' },
  // Fodder & by-products: bulk weight or bundles.
  { match: ['fodder', 'agri-byproducts'], groups: ['weight', 'count'], quantityUnit: 'quintal', priceUnit: 'per_quintal' },
]

const DEFAULT_PROFILE = { groups: ['weight', 'count', 'volume'], quantityUnit: 'kg', priceUnit: 'per_kg' }

/** Resolve the unit profile for a category slug (matches parent prefix). */
export function getUnitProfile(slug = '') {
  if (!slug) return DEFAULT_PROFILE
  for (const p of PROFILES) {
    if (p.match.some((m) => slug === m || slug.startsWith(`${m}-`))) return p
  }
  return DEFAULT_PROFILE
}

/** Filter the full unit list down to the groups a category allows, ordered by profile. */
export function unitsForCategory(slug, allUnits) {
  const { groups } = getUnitProfile(slug)
  return groups.flatMap((g) => allUnits.filter((u) => u.group === g))
}
