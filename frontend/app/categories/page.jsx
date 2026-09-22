'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { categoryTree as staticCategoryTree } from '../marketplace/categories'
import { products } from '../marketplace/products'
import { Sprout, ArrowRight } from 'lucide-react'
import { useLang } from '../../lib/lang-context'
import { api } from '../../lib/api'

const DEFAULT_IMAGE =
  'https://www.kisanmandi.com/components/com_rsdirectory/files/cache/200x200/d33578aea68a85e2128d0220aa6699e9.jpg'

const t = {
  en: {
    badge: 'Verified farmer marketplace',
    title: 'Browse Categories',
    sub1: 'verified listings from farmers across India.',
    sub2: 'Click any category to explore fresh farm products.',
    listings: 'listings',
    subcategories: 'subcategories',
  },
  hi: {
    badge: 'सत्यापित किसान मार्केटप्लेस',
    title: 'श्रेणियाँ ब्राउज़ करें',
    sub1: 'भारत भर के किसानों की सत्यापित लिस्टिंग।',
    sub2: 'ताज़े खेती उत्पाद देखने के लिए किसी श्रेणी पर क्लिक करें।',
    listings: 'लिस्टिंग',
    subcategories: 'उप-श्रेणियाँ',
  },
}

function countByName(products) {
  const map = { All: products.length }
  products.forEach((p) => {
    p.categoryPath.forEach((name) => {
      map[name] = (map[name] || 0) + 1
    })
  })
  return map
}

function getCategoryImage(name) {
  const p = products.find(
    (x) => x.categoryPath[0] === name || x.categoryPath.includes(name)
  )
  return p ? p.image : DEFAULT_IMAGE
}

function getSubcategoryCount(node) {
  if (!node.children || node.children.length === 0) return 0
  return node.children.length
}

export default function CategoriesPage() {
  const { lang } = useLang()
  const text = t[lang] || t.en
  const isHindi = lang === 'hi'
  const counts = useMemo(() => countByName(products), [])
  const [tree, setTree] = useState(staticCategoryTree)

  useEffect(() => {
    // Backend tree carries slug + nameHi; fall back to the static tree.
    api.getCategoryTree()
      .then((res) => {
        if (res?.tree?.length) setTree(res.tree)
      })
      .catch(() => {})
  }, [])

  const top = tree.filter((n) => n.name !== 'All' && n.slug !== 'all')
  const catLabel = (cat) => (isHindi ? cat.nameHi || cat.name : cat.name)
  const catKey = (cat) => cat.slug || cat.name

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Hero — FarmerShrine dark-green gradient style */}
      <section className='relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-20 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <div className='mb-6 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
            <Sprout className='mr-2 h-5 w-5 text-emerald-300' />
            <span className='text-sm font-medium text-emerald-50'>
              {text.badge}
            </span>
          </div>
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {text.title}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-emerald-100'>
            {products.length}+ {text.sub1} {text.sub2}
          </p>
        </div>
      </section>

      {/* Category grid */}
      <section className='mx-auto max-w-7xl px-4 py-14 md:px-6'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {top.map((cat) => (
            <Link
              key={catKey(cat)}
              href={`/marketplace?category=${encodeURIComponent(catKey(cat))}`}
              className='group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-xl hover:ring-emerald-200'
            >
              <div className='relative aspect-[4/3] w-full overflow-hidden bg-gray-100'>
                <Image
                  src={getCategoryImage(cat.name)}
                  alt={cat.name}
                  fill
                  className='object-cover transition duration-500 group-hover:scale-110'
                  sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60' />
                <div className='absolute bottom-3 left-3 right-3'>
                  <span className='inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-800 backdrop-blur'>
                    {counts[cat.name] || 0} {text.listings}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between p-4'>
                <div>
                  <h3 className='text-base font-bold text-gray-900'>{catLabel(cat)}</h3>
                  <p className='mt-0.5 text-xs text-gray-500'>
                    {getSubcategoryCount(cat)} {text.subcategories}
                  </p>
                </div>
                <span className='rounded-full bg-emerald-50 p-2 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white'>
                  <ArrowRight className='h-4 w-4' />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
