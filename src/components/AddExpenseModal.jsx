import { useState } from 'react'
import { inferCategory } from '../utils/categoryMapper'

const CATEGORIES = [
  'Food',
  'Transport',
  'Rent/Fixed',
  'Social/Going Out',
  'Shopping',
  'Travel',
  'Miscellaneous',
]

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export default function AddExpenseModal({ onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
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
        className="bg-white w-full rounded-t-2xl p-6 max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Add Expense</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="text-4xl font-bold border-b-2 border-gray-200 focus:border-black outline-none py-2 w-full"
            autoFocus
            required
            min="0"
            step="any"
          />

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    category === cat
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 text-gray-700 active:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={handleNoteChange}
            className="border-b border-gray-200 focus:border-black outline-none py-2 text-base"
          />

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border-b border-gray-200 focus:border-black outline-none py-2 text-base"
          />

          <button
            type="submit"
            disabled={!amount || !category}
            className="bg-black text-white py-4 rounded-xl text-base font-semibold disabled:opacity-30 active:scale-95 transition-transform"
          >
            Save Expense
          </button>
        </form>
      </div>
    </div>
  )
}
