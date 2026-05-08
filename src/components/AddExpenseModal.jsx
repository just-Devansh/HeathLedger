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

// Collapse "Zepto / Blinkit" and "Zepto/Blinkit" to the same key
function normCat(name) {
  return name.toLowerCase().replace(/\s*\/\s*/g, '/').trim()
}

// Find the actual stored category name that matches `name` after normalization.
// Returns the stored name (with its original formatting) or falls back to `name`.
function resolveCategory(name, categories) {
  if (!name) return name
  const key = normCat(name)
  return categories.find(c => normCat(c.name) === key)?.name ?? name
}

export default function AddExpenseModal({ categories, onSave, onClose, editExpense, initialCategory, initialNote }) {
  const { theme, isDark } = useTheme()
  const isEditing = !!editExpense

  const [amount, setAmount] = useState(() =>
    isEditing ? String(editExpense.amount) : ''
  )
  const [category, setCategory] = useState(() => {
    if (isEditing) return editExpense.category
    // initialCategory != null covers both null and undefined (loose inequality)
    // Quick actions pass a string; Custom passes ''; no prefill passes undefined → use localStorage
    if (initialCategory != null) return resolveCategory(initialCategory, categories)
    return resolveCategory(localStorage.getItem('heath_ledger_last_category') || '', categories)
  })
  const [note, setNote] = useState(() => isEditing ? editExpense.note : (initialNote || ''))
  const [date, setDate] = useState(() =>
    isEditing ? editExpense.date.split('T')[0] : todayString()
  )

  function handleNoteChange(e) {
    const val = e.target.value
    setNote(val)
    const inferred = inferCategory(val)
    if (inferred && !category) setCategory(resolveCategory(inferred, categories))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || !category) return
    if (!isEditing) localStorage.setItem('heath_ledger_last_category', category)
    onSave({
      id: isEditing ? editExpense.id : crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
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
      <div
        className="w-full rounded-t-2xl p-6 max-w-[480px] mx-auto"
        style={{ background: theme.cardBg }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl leading-none"
            style={{ background: theme.inputBg, color: theme.textMuted }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-1 py-2">
            <span className="text-4xl font-bold" style={{ color: theme.gradEnd }}>₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-bold outline-none w-full bg-transparent"
              style={{ color: theme.text }}
              autoFocus
              required
              min="0"
              step="any"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className="px-3 py-2 rounded-full text-sm font-medium border transition-colors active:scale-95 flex items-center gap-1.5"
                  style={
                    category === cat.name
                      ? { background: theme.primary, color: '#ffffff', borderColor: theme.primary }
                      : { background: theme.surface, color: theme.primary, borderColor: theme.border }
                  }
                >
                  {getIcon(cat.icon, { size: 14, color: category === cat.name ? '#ffffff' : theme.primary })}
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

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border-b outline-none py-2 text-base bg-transparent"
            style={{ borderColor: theme.border, color: theme.text, colorScheme: isDark ? 'dark' : 'light' }}
          />

          <button
            type="submit"
            disabled={!amount || !category}
            className="py-4 rounded-xl text-base font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
          >
            {isEditing ? 'Update Expense' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}
