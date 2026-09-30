'use client'

import Image from 'next/image'
import { ArrowRight, Star } from 'lucide-react'

// Big photo tiles for every buyable farm category — the "what can I get here"
// answer at a glance. Slugs match the backend category tree; group tiles use
// the marketplace section filter. Photos are Unsplash (already used site-wide).
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`

export const PRODUCT_TILES = [
  { key: 'featured', en: 'Featured Products', hi: 'विशेष उत्पाद', href: '/marketplace', featured: true, img: U('photo-1488459716781-31db52582fe9') },
  { key: 'vegetables', en: 'Vegetables', hi: 'सब्जियाँ', href: '/marketplace?category=vegetables', img: U('photo-1540420773420-3366772f4999') },
  { key: 'fruits', en: 'Fruits', hi: 'फल', href: '/marketplace?category=fruits', img: U('photo-1619566636858-adf3ef46400b') },
  { key: 'grains', en: 'Food Grains & Cereals', hi: 'अनाज एवं धान्य', href: '/marketplace?category=grains-cereals', img: U('photo-1574323347407-f5e1ad6d020b') },
  { key: 'pulses', en: 'Pulses & Legumes', hi: 'दालें एवं दलहन', href: '/marketplace?category=pulses', img: U('photo-1515543904379-3d757afe72e4') },
  { key: 'rice', en: 'Rice', hi: 'चावल', href: '/marketplace?category=rice', img: U('photo-1536304993881-ff6e9eefa2a6') },
  { key: 'flowers', en: 'Flowers', hi: 'फूल', href: '/marketplace?category=flowers', img: U('photo-1490750967868-88aa4486c946') },
  { key: 'dryfruits', en: 'Dry Fruits & Nuts', hi: 'सूखे मेवे', href: '/marketplace?category=dry-fruits-nuts', img: U('photo-1508061253366-f7da158b6d46') },
  { key: 'dairy', en: 'Milk Products', hi: 'डेयरी उत्पाद', href: '/marketplace?category=dairy', img: U('photo-1550583724-b2692b85b150') },
  { key: 'spices', en: 'Spices', hi: 'मसाले', href: '/marketplace?category=spices', img: U('photo-1596040033229-a9821ebd058d') },
  { key: 'oilseeds', en: 'Oilseeds & Cash Crops', hi: 'तिलहन एवं नकदी फसलें', href: '/marketplace?category=oilseeds', img: U('photo-1471193945509-9ad0617afabf') },
  { key: 'honey', en: 'Honey & Beekeeping', hi: 'शहद एवं मधुमक्खी पालन', href: '/marketplace?category=honey', img: U('photo-1587049352846-4a222e784d38') },
  { key: 'organic', en: 'Organic Products', hi: 'जैविक उत्पाद', href: '/marketplace?category=organic-products', img: U('photo-1464226184884-fa280b87c399') },
  { key: 'animals', en: 'Animals for Sale', hi: 'पशु बिक्री', href: '/marketplace?group=animals', img: U('photo-1570042225831-d98fa7577f1e') },
  { key: 'fish', en: 'Fisheries', hi: 'मत्स्य पालन', href: '/marketplace?category=fisheries', img: U('photo-1535591273668-578e31182c4f') },
  { key: 'land', en: 'Agriculture Land', hi: 'कृषि भूमि', href: '/marketplace?group=land', img: U('photo-1500382017468-9049fed747ef') },
  { key: 'seeds', en: 'Seeds & Nursery', hi: 'बीज एवं नर्सरी', href: '/marketplace?category=seeds', img: U('photo-1416879595882-3373a0480b5b') },
  { key: 'fertilizers', en: 'Fertilizers & Manure', hi: 'खाद एवं उर्वरक', href: '/marketplace?category=fertilizers', img: U('photo-1530836369250-ef72a3f5cda8') },
  { key: 'protection', en: 'Pesticides & Crop Protection', hi: 'कीटनाशक एवं फसल सुरक्षा', href: '/marketplace?category=crop-protection', img: U('photo-1625246333195-78d9c38ad449') },
  { key: 'machines', en: 'Agri Machinery', hi: 'कृषि मशीनरी', href: '/marketplace?category=agri-machinery', img: U('photo-1592805723127-004b174a1798') },
  { key: 'tractors', en: 'Tractors', hi: 'ट्रैक्टर', href: '/marketplace?category=tractors', img: U('photo-1589923188900-85dae523342b') },
  { key: 'irrigation', en: 'Irrigation & Pumps', hi: 'सिंचाई एवं पंप', href: '/marketplace?category=irrigation', img: U('photo-1563514227147-6d2ff665a6a0') },
  { key: 'ayurvedic', en: 'Medicinal Plants', hi: 'औषधीय पौधे', href: '/marketplace?category=ayurvedic-plants', img: U('photo-1466692476868-aef1dfb1e735') },
  { key: 'solar', en: 'Solar for Farms', hi: 'कृषि सोलर', href: '/marketplace?category=solar', img: U('photo-1509391366360-2e959784a276') },
  { key: 'edibleoils', en: 'Edible Oils', hi: 'खाद्य तेल', href: '/marketplace?category=edible-oils', img: U('photo-1474979266404-7eaacbcd87c5') },
  { key: 'beverages', en: 'Tea, Coffee & Beverages', hi: 'चाय, कॉफी व पेय', href: '/marketplace?category=beverages', img: U('photo-1544787219-7f47ccb76574') },
  { key: 'fiber', en: 'Cotton, Jute & Fibre Crops', hi: 'कपास, जूट व रेशा फसलें', href: '/marketplace?category=fiber-crops', img: U('photo-1500595046743-cd271d694d30') },
  { key: 'nursery', en: 'Nursery Plants & Saplings', hi: 'नर्सरी पौधे', href: '/marketplace?category=nursery', img: U('photo-1516253593875-bd7ba052fbc5') },
  { key: 'forestry', en: 'Forestry, Bamboo & Timber', hi: 'वानिकी, बाँस व इमारती लकड़ी', href: '/marketplace?category=forest-products', img: U('photo-1473773508845-188df298d2d1') },
  { key: 'fodder', en: 'Fodder & Animal Feed', hi: 'चारा व पशु आहार', href: '/marketplace?category=fodder', img: U('photo-1601599561213-832382fd07ba') },
  { key: 'processed', en: 'Flour, Pickles & Processed Foods', hi: 'आटा, अचार व प्रसंस्कृत खाद्य', href: '/marketplace?category=processed-foods', img: U('photo-1544776193-352d25ca82cd') },
  { key: 'structures', en: 'Polyhouse & Shade Nets', hi: 'पॉलीहाउस व शेड नेट', href: '/marketplace?category=farm-structures', img: U('photo-1558818498-28c1e002b655') },
  { key: 'storage', en: 'Cold Storage & Grain Silos', hi: 'कोल्ड स्टोरेज व अनाज भंडारण', href: '/marketplace?category=post-harvest-storage', img: U('photo-1586771107445-d3ca888129ff') },
  { key: 'packaging', en: 'Jute Bags, Crates & Packaging', hi: 'बोरी, क्रेट व पैकेजिंग', href: '/marketplace?category=packaging', img: U('photo-1615485290382-441e4d049cb5') },
  { key: 'byproducts', en: 'Straw, Husk & By-products', hi: 'भूसा, भूसी व उप-उत्पाद', href: '/marketplace?category=agri-byproducts', img: U('photo-1543362906-acfc16c67564') },
]

const t = {
  en: { title: 'Shop by Category', sub: 'Every farm product in one place — tap a category to see live listings.', featured: 'Featured' },
  hi: { title: 'श्रेणी से खरीदें', sub: 'हर कृषि उत्पाद एक ही जगह — लाइव सूचियाँ देखने के लिए श्रेणी चुनें।', featured: 'विशेष' },
}

export default function ProductCategoryTiles({ lang = 'hi', onSelect }) {
  const text = t[lang] || t.en
  return (
    <section className='bg-slate-50 py-12 md:py-16'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='mb-8 text-center'>
          <h2 className='text-3xl font-bold text-gray-900 md:text-4xl'>{text.title}</h2>
          <p className='mx-auto mt-2 max-w-2xl text-gray-600'>{text.sub}</p>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6'>
          {PRODUCT_TILES.map((tile) => {
            const label = lang === 'hi' ? tile.hi : tile.en
            return (
              <button
                key={tile.key}
                onClick={() => onSelect?.(tile)}
                className={`group relative overflow-hidden rounded-2xl bg-gray-200 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl ${
                  tile.featured ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-[4/3]'
                }`}
              >
                <Image
                  src={tile.img}
                  alt={tile.en}
                  fill
                  unoptimized
                  sizes='(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw'
                  className='object-cover transition duration-500 group-hover:scale-110'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent' />
                {tile.featured && (
                  <span className='absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow'>
                    <Star className='h-3.5 w-3.5 fill-current' />
                    {text.featured}
                  </span>
                )}
                <div className='absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 md:p-4'>
                  <span className={`font-extrabold leading-tight text-white drop-shadow ${tile.featured ? 'text-2xl md:text-3xl' : 'text-sm md:text-base'}`}>
                    {label}
                  </span>
                  <span className='shrink-0 rounded-full bg-white/90 p-1.5 text-emerald-700 opacity-0 transition group-hover:opacity-100'>
                    <ArrowRight className='h-4 w-4' />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
