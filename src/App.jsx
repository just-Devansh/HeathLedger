import { useState, useMemo } from 'react'
import { loadExpenses, saveExpenses, loadCategories } from './utils/storage'
import { useTheme } from './context/ThemeContext'
import AddExpenseModal from './components/AddExpenseModal'
import ExpenseList from './components/ExpenseList'
import SummaryScreen from './components/SummaryScreen'
import CategoryManager from './components/CategoryManager'

const FILTERS = ['Today', 'Week', 'Month']

function filterExpenses(expenses, filter) {
  const now = new Date()
  return expenses.filter(exp => {
    const d = new Date(exp.date)
    if (filter === 'Today') return d.toDateString() === now.toDateString()
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

function ListIcon({ active, color }) {
  const fill = active ? color : '#94a3b8'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="5" width="14" height="2" rx="1" fill={fill} />
      <rect x="3" y="9" width="10" height="2" rx="1" fill={fill} />
      <rect x="3" y="13" width="12" height="2" rx="1" fill={fill} />
    </svg>
  )
}

function ChartIcon({ active, primary, secondary, gradEnd }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3"   y="12" width="3" height="5"  rx="1" fill={active ? primary   : '#94a3b8'} />
      <rect x="8.5" y="8"  width="3" height="9"  rx="1" fill={active ? gradEnd   : '#cbd5e1'} />
      <rect x="14"  y="4"  width="3" height="13" rx="1" fill={active ? secondary : '#b8c4d4'} />
    </svg>
  )
}

export default function App() {
  const { theme } = useTheme()
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [categories, setCategories] = useState(() => loadCategories())
  const [showModal, setShowModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [filter, setFilter] = useState('Today')
  const [activeTab, setActiveTab] = useState('expenses')

  function handleSave(expense) {
    const updated = [expense, ...expenses]
    setExpenses(updated)
    saveExpenses(updated)
  }

  const filtered = useMemo(() => filterExpenses(expenses, filter), [expenses, filter])

  return (
    <div className="min-h-screen" style={{ background: theme.pageBg }}>

      {activeTab === 'expenses' && (
        <div className="max-w-[480px] mx-auto px-4 pb-28">
          <header className="pt-8 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>HeathLedger</p>
                <h1 className="text-2xl font-bold mt-1" style={{ color: theme.heading }}>
                  Firse Kharcha?
                </h1>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{currentMonth()}</p>
              </div>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="mt-1 w-9 h-9 flex items-center justify-center rounded-full text-lg"
                style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.secondary }}
                aria-label="Manage categories"
              >
                ⚙️
              </button>
            </div>

            <div
              className="flex gap-1 mt-4 w-fit rounded-full p-1"
              style={{ background: '#ffffff', border: `1px solid ${theme.border}` }}
            >
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: filter === f ? theme.primary : 'transparent',
                    color: filter === f ? '#ffffff' : theme.accent,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </header>

          <ExpenseList expenses={filtered} categories={categories} />
        </div>
      )}

      {activeTab === 'summary' && (
        <SummaryScreen expenses={expenses} categories={categories} />
      )}

      <button
        onClick={() => setShowModal(true)}
        className="fixed right-6 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl active:scale-95 transition-transform"
        style={{
          bottom: '76px',
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
          boxShadow: `0 4px 20px rgba(${theme.shadowRgb},0.5)`,
        }}
        aria-label="Add expense"
      >
        +
      </button>

      <nav
        className="fixed bottom-0 left-0 right-0 flex"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          boxShadow: `0 -2px 12px rgba(${theme.shadowRgb},0.08)`,
          height: '60px',
        }}
      >
        <button
          onClick={() => setActiveTab('expenses')}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={{ color: activeTab === 'expenses' ? theme.primary : '#94a3b8' }}
        >
          <ListIcon active={activeTab === 'expenses'} color={theme.primary} />
          <span className="text-xs font-medium">Expenses</span>
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={{ color: activeTab === 'summary' ? theme.primary : '#94a3b8' }}
        >
          <ChartIcon
            active={activeTab === 'summary'}
            primary={theme.primary}
            secondary={theme.secondary}
            gradEnd={theme.gradEnd}
          />
          <span className="text-xs font-medium">Summary</span>
        </button>
      </nav>

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
