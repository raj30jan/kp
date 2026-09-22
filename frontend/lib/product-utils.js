// Shared product display helpers — land detection, per-acre pricing,
// per-language unit labels, and Latin→Devanagari transliteration so every
// product can render in Hindi script even when title_hi isn't stored.

/** True for Land/Property listings (category 'land' or 'land-*'). */
export function isLandProduct(p) {
  const c = p?.category || ''
  return c === 'land' || c.startsWith('land-')
}

/**
 * Per-acre rate for a land listing, or null when it can't be derived
 * (non-land, non-acre unit, or missing/zero quantity).
 */
export function landRatePerAcre(p) {
  if (!isLandProduct(p)) return null
  if (p.quantityUnit !== 'acre') return null
  const qty = Number(p.quantity)
  const price = Number(p.price)
  if (!qty || !Number.isFinite(price)) return null
  return Math.round(price / qty)
}

// Unit labels per language — numeric values stay as-is, only the unit
// text switches between English and Hindi.
const UNIT_LABELS = {
  en: {
    per_kg: 'per kg', per_quintal: 'per quintal', per_piece: 'per piece',
    per_dozen: 'per dozen', per_litre: 'per litre', per_unit: 'per unit', total: 'total',
    kg: 'kg', quintal: 'quintal', ton: 'ton', gram: 'g', litre: 'L',
    piece: 'pc', dozen: 'dozen', acre: 'acres', bigha: 'bigha', hectare: 'hectare',
  },
  hi: {
    per_kg: 'प्रति किग्रा', per_quintal: 'प्रति क्विंटल', per_piece: 'प्रति नग',
    per_dozen: 'प्रति दर्जन', per_litre: 'प्रति लीटर', per_unit: 'प्रति इकाई', total: 'कुल',
    kg: 'किग्रा', quintal: 'क्विंटल', ton: 'टन', gram: 'ग्राम', litre: 'लीटर',
    piece: 'नग', dozen: 'दर्जन', acre: 'एकड़', bigha: 'बीघा', hectare: 'हेक्टेयर',
  },
}

export function unitLabel(unit, lang) {
  if (!unit) return ''
  return UNIT_LABELS[lang]?.[unit] || UNIT_LABELS.en[unit] || unit.replace(/_/g, ' ')
}

/**
 * Latin → Devanagari transliteration (phonetic, longest-match).
 * Used to render English titles in Hindi script when no Hindi title is
 * stored. Consonant clusters are joined with a halant (्) so "fresh" →
 * "फ्रेश", "tamatar" → "टमाटर". Approximate by design — a stored
 * title_hi always wins over this fallback.
 */
const DEV_CONS = {
  chh: 'छ', ksh: 'क्ष', kh: 'ख', gh: 'घ', ch: 'च', jh: 'झ', th: 'ठ',
  dh: 'ढ', ph: 'फ', bh: 'भ', sh: 'श', ng: 'ं',
  k: 'क', q: 'क़', g: 'ग', j: 'ज', z: 'ज़', t: 'ट', d: 'ड', n: 'न',
  p: 'प', f: 'फ', b: 'ब', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व',
  w: 'व', s: 'स', h: 'ह', x: 'क्स', c: 'क',
}
const DEV_VOWEL_IND = { aa: 'आ', ai: 'ऐ', au: 'औ', ee: 'ई', oo: 'ऊ', a: 'अ', e: 'ए', i: 'इ', o: 'ओ', u: 'उ' }
const DEV_VOWEL_MATRA = { aa: 'ा', ai: 'ै', au: 'ौ', ee: 'ी', oo: 'ू', a: '', e: 'े', i: 'ि', o: 'ो', u: 'ु' }

export function toDevanagari(text) {
  if (!text) return ''
  const s = String(text).toLowerCase()
  let out = ''
  let pendingCons = false // last emitted char was a consonant awaiting its vowel
  let i = 0
  while (i < s.length) {
    // consonants — longest match first (3 → 2 → 1)
    let matched = false
    for (const len of [3, 2, 1]) {
      const sub = s.substr(i, len)
      if (DEV_CONS[sub]) {
        out += (pendingCons ? '्' : '') + DEV_CONS[sub]
        pendingCons = true
        i += len
        matched = true
        break
      }
    }
    if (matched) continue
    // vowels — 2-char before 1-char
    for (const len of [2, 1]) {
      const sub = s.substr(i, len)
      if (DEV_VOWEL_IND[sub] !== undefined) {
        out += pendingCons ? DEV_VOWEL_MATRA[sub] : DEV_VOWEL_IND[sub]
        pendingCons = false
        i += len
        matched = true
        break
      }
    }
    if (matched) continue
    // digits / punctuation pass through; a trailing consonant keeps its
    // inherent vowel (no halant appended) for readability.
    out += s[i]
    pendingCons = false
    i++
  }
  return out
}

/**
 * Product title in the selected language. Hindi uses the stored title_hi
 * when present, else transliterates the English title so the listing still
 * renders in Devanagari.
 */
export function displayTitle(p, lang) {
  if (lang === 'hi') return p?.titleHi || toDevanagari(p?.title)
  return p?.title || ''
}
