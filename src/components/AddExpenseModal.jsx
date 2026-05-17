import { useState } from 'react'
import { inferCategory } from '../utils/categoryMapper'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'

function todayString() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function fmtDateDisplay(isoDate) {
  if (!isoDate) return ''
  const [yyyy, mm, dd] = isoDate.split('-')
  return `${dd}/${mm}/${yyyy}`
}

function normName(n) {
  return (n || '').toLowerCase().replace(/\s*\/\s*/g, '/').trim()
}

// Resolve a category name string or ID to a stable category ID.
// Accepts both old name strings (from quick actions / localStorage) and new IDs.
function resolveCatId(nameOrId, categories) {
  if (!nameOrId) return null
  const byId = categories.find(c => c.id === nameOrId)
  if (byId) return byId.id
  const byName = categories.find(c => normName(c.name) === normName(nameOrId))
  return byName?.id ?? null
}

export default function AddExpenseModal({ categories, onSave, onClose, editExpense, initialCategory, initialNote }) {
  const { theme, isDark } = useTheme()
  const isEditing = !!editExpense

  const [amount, setAmount] = useState(() =>
    isEditing ? String(editExpense.amount) : ''
  )
  const [categoryId, setCategoryId] = useState(() => {
    if (isEditing) {
      return editExpense.categoryId ?? resolveCatId(editExpense.category ?? '', categories)
    }
    // initialCategory != null covers both null and undefined (loose inequality)
    // Quick actions pass a name string; Custom passes ''; no prefill passes undefined → use localStorage
    if (initialCategory != null) return resolveCatId(initialCategory, categories)
    return resolveCatId(localStorage.getItem('heath_ledger_last_category') || '', categories)
  })
  const [note, setNote] = useState(() => isEditing ? editExpense.note : (initialNote || ''))
  const [date, setDate] = useState(() =>
    isEditing ? editExpense.date.split('T')[0] : todayString()
  )

  function handleNoteChange(e) {
    const val = e.target.value
    setNote(val)
    const inferred = inferCategory(val)
    if (inferred && !categoryId) setCategoryId(resolveCatId(inferred, categories))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || !categoryId) return
    if (!isEditing) localStorage.setItem('heath_ledger_last_category', categoryId)
    onSave({
      id: isEditing ? editExpense.id : crypto.randomUUID(),
      amount: parseFloat(amount),
      categoryId,
      note: note.trim(),
      date: new Date(date).toISOString(),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-end z-[60]"
      style={{ background: theme.modalBg }}
      onClick={onClose}
    >
      {/* max-height uses dvh so it shrinks correctly when the mobile keyboard opens */}
      <div
        className="w-full rounded-t-2xl max-w-[480px] mx-auto flex flex-col"
        style={{ background: theme.cardBg, maxHeight: 'min(92dvh, 92vh)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header is flex-shrink-0 so it always stays visible above the scrollable form */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full text-xl leading-none active:scale-90 transition-transform"
            style={{ background: theme.inputBg, color: theme.textMuted }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content so form never clips the close button off-screen */}
        <div className="flex-1 overflow-y-auto px-6 pb-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Amount + Date on same row — date floats to the right of the ₹ input */}
            <div className="flex items-end gap-3 py-1">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-4xl font-bold flex-shrink-0" style={{ color: theme.gradEnd }}>₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="text-4xl font-bold outline-none w-full bg-transparent min-w-0"
                  style={{ color: theme.text }}
                  autoFocus
                  required
                  min="0"
                  step="any"
                />
              </div>
              <div className="flex flex-col items-end flex-shrink-0 pb-0.5">
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textFaint }}>Date</p>
                <div className="relative">
                  <div className="flex items-center gap-1 text-sm select-none" style={{ color: theme.textMuted }}>
                    <span>{fmtDateDisplay(date)}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="px-3 py-2 rounded-full text-sm font-medium border transition-colors active:scale-95 flex items-center gap-1.5"
                    style={
                      categoryId === cat.id
                        ? { background: theme.primary, color: '#ffffff', borderColor: theme.primary }
                        : { background: theme.surface, color: theme.primary, borderColor: theme.border }
                    }
                  >
                    {getIcon(cat.icon, { size: 14, color: categoryId === cat.id ? '#ffffff' : theme.primary })}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={handleNoteChange}
              className="border-b outline-none py-2 text-base bg-transparent"
              style={{ borderColor: theme.border, color: theme.text }}
            />

            <button
              type="submit"
              disabled={!amount || !categoryId}
              className="py-3.5 rounded-xl text-base font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            >
              {isEditing ? 'Update Expense' : 'Save Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
