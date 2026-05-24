import { useState } from 'react'
import { SlidersHorizontal, X, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'

export default function MonthCategoryFilter({ categories, monthExpenses, value, onChange }) {
  const { theme } = useTheme()
  const [sheetOpen, setSheetOpen] = useState(false)

  const catById = Object.fromEntries((categories ?? []).map(c => [c.id, c]))

  const activeCatIds = [...new Set(
    monthExpenses.map(e => e.categoryId ?? e.category).filter(Boolean)
  )]
  const options = activeCatIds
    .map(id => catById[id] ?? { id, name: id, icon: 'box' })
    .sort((a, b) => a.name.localeCompare(b.name))

  if (options.length <= 1) return null

  const selectedCat = value ? (catById[value] ?? { id: value, name: value, icon: 'box' }) : null

  return (
    <>
      <div className="flex justify-end pt-2 pb-0">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 active:scale-95 transition-transform"
          style={{
            padding: '5px 12px 5px 10px',
            borderRadius: '20px',
            border: `1.5px solid ${value ? theme.primary : theme.border}`,
            background: value ? `${theme.primary}18` : 'transparent',
            color: value ? theme.primary : theme.textMuted,
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {value ? (
            <>
              {getIcon(selectedCat.icon, { size: 11, color: theme.primary })}
              <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedCat.name}
              </span>
              <span
                className="flex items-center justify-center ml-0.5"
                style={{ opacity: 0.7 }}
                onClick={e => { e.stopPropagation(); onChange(null) }}
              >
                <X size={11} />
              </span>
            </>
          ) : (
            <>
              <SlidersHorizontal size={11} />
              <span>Filter</span>
            </>
          )}
        </button>
      </div>

      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 fade-in"
            style={{ background: 'rgba(0,0,0,0.45)', zIndex: 50, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="fixed left-0 right-0 bottom-0 sheet-slide-up"
            style={{
              zIndex: 51,
              background: theme.cardBg,
              borderRadius: '24px 24px 0 0',
              maxHeight: '65dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: theme.border }} />
            </div>

            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <p className="font-bold text-base" style={{ color: theme.heading }}>Filter by Category</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full btn-close"
                style={{ color: theme.textMuted, background: theme.surface }}
              >
                <X size={17} />
              </button>
            </div>

            <div style={{ height: '1px', background: theme.border, flexShrink: 0 }} />

            <div className="overflow-y-auto flex-1 pb-8">
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5"
                onClick={() => { onChange(null); setSheetOpen(false) }}
                style={{ background: !value ? theme.surface : 'transparent' }}
              >
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: !value ? `${theme.primary}22` : theme.inputBg }}
                >
                  <SlidersHorizontal size={15} color={!value ? theme.primary : theme.textMuted} />
                </span>
                <span className="font-semibold text-sm flex-1 text-left" style={{ color: theme.heading }}>
                  All Categories
                </span>
                {!value && <Check size={16} style={{ color: theme.primary, flexShrink: 0 }} />}
              </button>

              {options.map(cat => (
                <button
                  key={cat.id}
                  className="w-full flex items-center gap-3 px-5 py-3.5"
                  onClick={() => { onChange(cat.id); setSheetOpen(false) }}
                  style={{ background: value === cat.id ? theme.surface : 'transparent' }}
                >
                  <span
                    className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: value === cat.id ? `${theme.primary}22` : theme.inputBg }}
                  >
                    {getIcon(cat.icon, { size: 15, color: value === cat.id ? theme.primary : theme.textMuted })}
                  </span>
                  <span className="font-semibold text-sm flex-1 text-left" style={{ color: theme.heading }}>
                    {cat.name}
                  </span>
                  {value === cat.id && <Check size={16} style={{ color: theme.primary, flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
