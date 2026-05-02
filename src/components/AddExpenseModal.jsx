import { useState } from 'react'
import { inferCategory } from '../utils/categoryMapper'

function todayString() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export default function AddExpenseModal({ categories, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(
    () => localStorage.getItem('heath_ledger_last_category') || ''
  )
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayString())

  function handleNoteChange(e) {
    const val = e.target.value
    setNote(val)
    const inferred = inferCategory(val)
    if (inferred && !category) setCategory(inferred)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || !category) return
    localStorage.setItem('heath_ledger_last_category', category)
    onSave({
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
      note: note.trim(),
      date: new Date(date).toISOString(),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-2xl p-6 max-w-[480px] mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: '#0f172a' }}>Add Expense</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl leading-none"
            style={{ background: '#f1f5f9', color: '#64748b' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-1 py-2">
            <span className="text-4xl font-bold" style={{ color: '#a855f7' }}>₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-bold outline-none w-full"
              style={{ color: '#0f172a' }}
              autoFocus
              required
              min="0"
              step="any"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className="px-3 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5"
                  style={
                    category === cat.name
                      ? { background: '#4f46e5', color: '#ffffff', borderColor: '#4f46e5' }
                      : { background: '#f5f3ff', color: '#4f46e5', borderColor: '#ddd6fe' }
                  }
                >
                  <span>{cat.emoji}</span>
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
            className="border-b outline-none py-2 text-base"
            style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
          />

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border-b outline-none py-2 text-base"
            style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
          />

          <button
            type="submit"
            disabled={!amount || !category}
            className="py-4 rounded-xl text-base font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            Save Expense
          </button>
        </form>
      </div>
    </div>
  )
}
