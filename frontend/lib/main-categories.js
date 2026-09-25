// Main marketplace categories shown on the homepage — Patanjali-style top nav.
// Each maps to a marketplace section (group) or a category slug, plus the
// product-row query used to render that category's scrollable listing row.
import {
  Wheat,
  Milk,
  PawPrint,
  Fish,
  Trees,
  Sprout,
  Leaf,
  Tractor,
  Briefcase,
} from 'lucide-react'

export const MAIN_CATEGORIES = [
  {
    key: 'farm',
    en: 'Farm Products',
    hi: 'कृषि उत्पाद',
    icon: Wheat,
    href: '/marketplace?group=food',
    // Broad produce row — everything edible.
    row: { group: 'food' },
    subs: ['Vegetables', 'Fruits', 'Grains', 'Pulses'],
  },
  {
    key: 'milk',
    en: 'Milk Products',
    hi: 'दुग्ध उत्पाद',
    icon: Milk,
    href: '/marketplace?category=dairy',
    row: { category: 'dairy' },
    subs: ['Milk', 'Ghee', 'Paneer', 'Butter'],
  },
  {
    key: 'animals',
    en: 'Animals for Sale',
    hi: 'पशु बिक्री',
    icon: PawPrint,
    href: '/marketplace?group=animals',
    row: { group: 'animals' },
    subs: ['Cow', 'Buffalo', 'Goat', 'Poultry'],
  },
  {
    key: 'fishes',
    en: 'Fishes',
    hi: 'मछली',
    icon: Fish,
    href: '/marketplace?category=fisheries',
    row: { category: 'fisheries' },
    subs: ['Rohu', 'Catla', 'Tilapia', 'Shrimp'],
  },
  {
    key: 'land',
    en: 'Agriculture Land',
    hi: 'कृषि भूमि',
    icon: Trees,
    href: '/marketplace?group=land',
    row: { group: 'land' },
    subs: ['Farm Land', 'Farmhouse', 'Plots'],
  },
  {
    key: 'seeds',
    en: 'Seeds',
    hi: 'बीज',
    icon: Sprout,
    href: '/marketplace?category=seeds',
    row: { category: 'seeds' },
    subs: ['Wheat', 'Rice', 'Vegetable', 'Hybrid'],
  },
  {
    key: 'pesticides',
    en: 'Pesticides',
    hi: 'कीटनाशक',
    icon: Leaf,
    href: '/marketplace?category=crop-protection',
    row: { category: 'crop-protection' },
    subs: ['Insecticide', 'Fungicide', 'Herbicide'],
  },
  {
    key: 'machines',
    en: 'Agro Machines & Tools',
    hi: 'कृषि मशीन व औज़ार',
    icon: Tractor,
    href: '/marketplace?category=agri-machinery',
    row: { category: 'agri-machinery' },
    subs: ['Tractor', 'Rotavator', 'Harvester', 'Drone'],
  },
  {
    key: 'jobs',
    en: 'Jobs',
    hi: 'नौकरियाँ',
    icon: Briefcase,
    href: '/services',
    // No product row — routes to the services/jobs listing.
    subs: ['Hire Labour', 'Machinery', 'Services'],
  },
]
