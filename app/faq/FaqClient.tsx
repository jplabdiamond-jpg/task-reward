'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

type Item = { category: string; q: string; a: string }

export default function FaqClient({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category))
    return ['all', ...Array.from(set)]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchCategory = activeCategory === 'all' || i.category === activeCategory
      const q = query.trim().toLowerCase()
      const matchQuery = !q || i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)
      return matchCategory && matchQuery
    })
  }, [items, query, activeCategory])

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="キーワードで検索..."
          className="input w-full pl-11"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === c
                ? 'bg-green-500 text-black'
                : 'bg-[#171a21] text-[#b8bcc8] hover:bg-[#2a2f3d]'
            }`}
          >
            {c === 'all' ? 'すべて' : c}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-[#6b7280] text-sm">
          該当する質問が見つかりませんでした
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, idx) => (
            <div key={idx} className="card overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-[#171a21] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-green-400 font-semibold mb-1">{item.category}</div>
                  <div className="text-sm font-bold">{item.q}</div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#6b7280] shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {openIdx === idx && (
                <div className="px-4 pb-4 text-sm text-[#b8bcc8] leading-relaxed border-t border-[#2a2f3d] pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
