import { useMemo, useState } from 'react'
import { MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'

function getDayLabel(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dayStart.getTime() === todayStart.getTime()) return 'Today'
  if (dayStart.getTime() === yesterdayStart.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

function groupByDate(expenses) {
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
  const groups = []
  let lastKey = null
  for (const exp of sorted) {
    const d = new Date(exp.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (key !== lastKey) {
      groups.push({ key, label: getDayLabel(exp.date), items: [exp] })
      lastKey = key
    } else {
      groups[groups.length - 1].items.push(exp)
    }
  }
  return groups
}

export default function ExpenseList({ expenses, categories, onEdit, onDelete }) {
  const { theme } = useTheme()
  const iconMap = Object.fromEntries((categories ?? []).map(c => [c.name, c.icon]))
  const groups = useMemo(() => groupByDate(expenses), [expenses])
  const [openMenuId, setOpenMenuId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function handleConfirmDelete(id) {
    onDelete(id)
    setConfirmDeleteId(null)
  }

  function closeAll() {
    setOpenMenuId(null)
    setConfirmDeleteId(null)
  }

  if (expenses.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none empty-state-in">
        <p
          className="font-devanagari font-black"
          style={{
            color: theme.textFaint,
            fontSize: '4rem',
            lineHeight: 1,
            letterSpacing: '0.01em',
          }}
        >
          शून्य
        </p>
        <p
          className="mt-3 text-xs tracking-[0.22em] uppercase"
          style={{ color: theme.textFaint, opacity: 0.45 }}
        >
          zero
        </p>
      </div>
    )
  }

  const hasOverlay = openMenuId !== null || confirmDeleteId !== null

  return (
    <div className="flex flex-col">

      {hasOverlay && (
        <div className="fixed inset-0" style={{ zIndex: 10 }} onClick={closeAll} />
      )}

      {groups.map((group, groupIdx) => (
        <div key={group.key}>
          {groupIdx > 0 && (
            <div style={{ height: '1px', background: theme.border, margin: '12px 0' }} />
          )}
          <p
            className="text-xs font-medium"
            style={{ color: theme.textMuted, margin: '16px 8px 8px' }}
          >
            {group.label}
          </p>

          <div className="flex flex-col gap-3">
            {group.items.map(exp => {
              const isMenuOpen = openMenuId === exp.id
              const isConfirming = confirmDeleteId === exp.id
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{
                    background: theme.cardBg,
                    boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.10)`,
                    position: 'relative',
                    zIndex: isMenuOpen || isConfirming ? 11 : 'auto',
                  }}
                >
                  {/* Left: icon + category name + note */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: theme.surface }}
                    >
                      {getIcon(iconMap[exp.category] ?? 'box', { size: 18, color: theme.primary })}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: theme.heading }}>
                        {exp.category}
                      </p>
                      {exp.note && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: theme.textMuted }}>{exp.note}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + three-dots or confirmation */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className="text-base font-bold" style={{ color: theme.primary }}>
                      ₹{formatAmount(exp.amount)}
                    </p>

                    {isConfirming ? (
                      <div className="confirm-popup flex gap-1.5">
                        <button
                          onClick={() => handleConfirmDelete(exp.id)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ background: '#22c55e', color: '#ffffff' }}
                          aria-label="Confirm delete"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ background: '#ef4444', color: '#ffffff' }}
                          aria-label="Cancel delete"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setOpenMenuId(isMenuOpen ? null : exp.id)}
                          className="dots-btn w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{
                            color: theme.textMuted,
                            background: isMenuOpen ? theme.inputBg : 'transparent',
                          }}
                          aria-label="More options"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 rounded-2xl overflow-hidden"
                            style={{
                              top: 'calc(100% + 6px)',
                              background: theme.cardBg,
                              boxShadow: `0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px ${theme.border}`,
                              zIndex: 20,
                              minWidth: '130px',
                            }}
                          >
                            <button
                              onClick={() => { onEdit(exp); setOpenMenuId(null) }}
                              className="expense-menu-item w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium"
                              style={{ color: theme.text }}
                            >
                              <Pencil size={15} /> Edit
                            </button>
                            <div style={{ height: '1px', background: theme.border }} />
                            <button
                              onClick={() => { setConfirmDeleteId(exp.id); setOpenMenuId(null) }}
                              className="expense-menu-item danger w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
