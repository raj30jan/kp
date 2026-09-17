'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CategoryTreeSelect({ tree, value, onChange, placeholder = 'Select category / subcategory' }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())
  const [selectedName, setSelectedName] = useState('')
  const containerRef = useRef(null)

  // Build a map of slug -> name from the tree for displaying the selected label
  const buildNameMap = (nodes, map = {}) => {
    for (const n of nodes || []) {
      map[n.slug || n.name] = n.name
      if (n.children?.length) buildNameMap(n.children, map)
    }
    return map
  }

  const nameMap = buildNameMap(tree)

  useEffect(() => {
    setSelectedName(value ? nameMap[value] || value : '')
  }, [value, nameMap])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleExpand = (id) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  const handleSelect = (node) => {
    onChange(node.slug || node.name)
    setOpen(false)
  }

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded.has(node.id)
    const isSelected = (node.slug || node.name) === value

    return (
      <div key={node.id}>
        <div
          className='flex items-center gap-1.5 py-2 pr-4 text-sm hover:bg-emerald-50'
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            <button
              type='button'
              onClick={() => toggleExpand(node.id)}
              className='flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-700'
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className='h-5 w-5' />
          )}
          <button
            type='button'
            onClick={() => handleSelect(node)}
            className={`flex-1 text-left ${isSelected ? 'font-semibold text-emerald-700' : 'text-gray-700'}`}
          >
            {node.name}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className='relative w-full' ref={containerRef}>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-left text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
      >
        {selectedName || placeholder}
      </button>
      <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />

      {open && (
        <div className='absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg ring-1 ring-gray-100'>
          <div className='py-1 text-xs font-semibold text-gray-400 px-3 uppercase tracking-wide'>
            Categories
          </div>
          {tree.length === 0 ? (
            <div className='px-3 py-2 text-sm text-gray-500'>No categories found</div>
          ) : (
            tree.map((node) => renderNode(node))
          )}
        </div>
      )}
    </div>
  )
}
