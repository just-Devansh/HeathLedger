import { useState, useMemo } from 'react'
import { loadExpenses, saveExpenses, loadCategories } from './utils/storage'
import AddExpenseModal from './components/AddExpenseModal'
import ExpenseList from './components/ExpenseList'
import CategoryManager from './components/CategoryManager'

const FILTERS = ['Today', 'Week', 'Month']

function filterExpenses(expenses, filter) {
  const now = new Date()
  return expenses.filter(exp => {
    const d = new Date(exp.date)
    if (filter === 'Today') {
      return d.toDateString() === now.toDateString()
    }
    if (filter === 'Week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
}

function currentMonth() {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function App() {
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [categories, setCategories] = useState(() => loadCategories())
  const [showModal, setShowModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [filter, setFilter] = useState('Today')

  function handleSave(expense) {
    const updated = [expense, ...expenses]
    setExpenses(updated)
    saveExpenses(updated)
  }

  const filtered = useMemo(() => filterExpenses(expenses, filter), [expenses, filter])

  return (
    <div className="min-h-screen" style={{ background: '#f1f5ff' }}>
      <div className="max-w-[480px] mx-auto px-4 pb-28">

        <header className="pt-8 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-wide" style={{ color: '#6366f1' }}>HeathLedger</p>
              <h1 className="text-2xl font-bold mt-1" style={{ color: '#1e1b4b' }}>
                Firse Kharcha?
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{currentMonth()}</p>
            </div>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="mt-1 w-9 h-9 flex items-center justify-center rounded-full text-lg"
              style={{ background: '#ede9fe', border: '1px solid #c4b5fd', color: '#7c3aed' }}
              aria-label="Manage categories"
            >
              ⚙️
            </button>
          </div>

          <div
            className="flex gap-1 mt-4 w-fit rounded-full p-1"
            style={{ background: '#ffffff', border: '1px solid #ddd6fe' }}
          >
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: filter === f ? '#4f46e5' : 'transparent',
                  color: filter === f ? '#ffffff' : '#6366f1',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        <ExpenseList expenses={filtered} categories={categories} />
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #a855f7)', boxShadow: '0 4px 20px rgba(79,70,229,0.5)' }}
        aria-label="Add expense"
      >
        +
      </button>

      {showModal && (
        <AddExpenseModal
          categories={categories}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {showCategoryManager && (
        <CategoryManager onClose={() => { setCategories(loadCategories()); setShowCategoryManager(false) }} />
      )}
    </div>
  )
}
