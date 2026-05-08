import { useState, useMemo } from 'react'
import { Settings } from 'lucide-react'
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

function ListIcon({ active, color, muted }) {
  const fill = active ? color : muted
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="5" width="14" height="2" rx="1" fill={fill} />
      <rect x="3" y="9" width="10" height="2" rx="1" fill={fill} />
      <rect x="3" y="13" width="12" height="2" rx="1" fill={fill} />
    </svg>
  )
}

function ChartIcon({ active, primary, secondary, gradEnd, muted }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3"   y="12" width="3" height="5"  rx="1" fill={active ? primary   : muted} />
      <rect x="8.5" y="8"  width="3" height="9"  rx="1" fill={active ? gradEnd   : muted} />
      <rect x="14"  y="4"  width="3" height="13" rx="1" fill={active ? secondary : muted} />
    </svg>
  )
}

export default function App() {
  const { theme } = useTheme()
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [categories, setCategories] = useState(() => loadCategories())
  const [showModal, setShowModal] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [filter, setFilter] = useState('Today')
  const [activeTab, setActiveTab] = useState('expenses')
  const [toast, setToast] = useState({ visible: false, message: '' })

  function showToast(message) {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }

  function handleSave(expense) {
    const isUpdate = expenses.some(e => e.id === expense.id)
    const updated = isUpdate
      ? expenses.map(e => e.id === expense.id ? expense : e)
      : [expense, ...expenses]
    setExpenses(updated)
    saveExpenses(updated)
    showToast(`${isUpdate ? 'Updated' : 'Added'} ₹${expense.amount} to ${expense.category}`)
  }

  function handleDeleteExpense(id) {
    const updated = expenses.filter(e => e.id !== id)
    setExpenses(updated)
    saveExpenses(updated)
    showToast('Expense deleted')
  }

  function openEdit(expense) {
    setEditExpense(expense)
  }

  function closeModal() {
    setShowModal(false)
    setEditExpense(null)
  }

  const filtered = useMemo(() => filterExpenses(expenses, filter), [expenses, filter])
  const filterIndex = FILTERS.indexOf(filter)

  return (
    <div className="min-h-screen" style={{ background: theme.pageBg }}>

      {activeTab === 'expenses' && (
        <div className="max-w-[480px] mx-auto px-4 pb-[100px]">
          <header className="pt-8 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>HeathLedger</p>
                <h1 className="text-2xl font-bold mt-1" style={{ color: theme.heading }}>
                  Firse Kharcha?
                </h1>
                <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>{currentMonth()}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="btn-settings w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.secondary }}
                  aria-label="Manage categories"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>

            <div
              className="relative flex mt-4 rounded-full overflow-hidden"
              style={{
                background: theme.filterBg,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${100 / FILTERS.length}%`,
                  background: theme.primary,
                  borderRadius: '999px',
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                  transform: `translateX(${filterIndex * 100}%)`,
                }}
              />
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="relative z-10 text-sm font-medium"
                  style={{
                    flex: 1,
                    padding: '7px 16px',
                    color: filter === f ? '#ffffff' : theme.accent,
                    transition: 'color 0.2s ease',
                    minWidth: '72px',
                    textAlign: 'center',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </header>

          <ExpenseList
            expenses={filtered}
            categories={categories}
            onEdit={openEdit}
            onDelete={handleDeleteExpense}
          />
        </div>
      )}

      {activeTab === 'summary' && (
        <SummaryScreen expenses={expenses} categories={categories} />
      )}

      <nav
        className="fixed z-40"
        style={{
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '420px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '6px',
          background: theme.glassBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '999px',
          boxShadow: theme.glassShadow,
        }}
      >
        <button
          onClick={() => setActiveTab('expenses')}
          className="flex flex-col items-center justify-center gap-0.5 active:scale-95"
          style={{
            padding: '8px 0',
            borderRadius: '999px',
            background: activeTab === 'expenses'
              ? `linear-gradient(135deg, rgba(${theme.shadowRgb},0.32) 0%, rgba(${theme.shadowRgb},0.14) 100%)`
              : 'transparent',
            color: activeTab === 'expenses' ? theme.primary : theme.textMuted,
            transition: 'all 0.2s ease',
          }}
        >
          <ListIcon active={activeTab === 'expenses'} color={theme.primary} muted={theme.textFaint} />
          <span className="text-xs font-medium">Expenses</span>
        </button>

        <div style={{ paddingInline: '8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => { setEditExpense(null); setShowModal(true) }}
            className="flex items-center justify-center text-white active:scale-95 transition-transform"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              marginTop: '-32px',
              fontSize: '28px',
              lineHeight: 1,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
              boxShadow: `0 4px 20px rgba(${theme.shadowRgb},0.5)`,
            }}
            aria-label="Add expense"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setActiveTab('summary')}
          className="flex flex-col items-center justify-center gap-0.5 active:scale-95"
          style={{
            padding: '8px 0',
            borderRadius: '999px',
            background: activeTab === 'summary' ? `rgba(${theme.shadowRgb},0.12)` : 'transparent',
            color: activeTab === 'summary' ? theme.primary : theme.textFaint,
            transition: 'all 0.2s ease',
          }}
        >
          <ChartIcon
            active={activeTab === 'summary'}
            primary={theme.primary}
            secondary={theme.secondary}
            gradEnd={theme.gradEnd}
            muted={theme.textFaint}
          />
          <span className="text-xs font-medium">Summary</span>
        </button>
      </nav>

      {toast.visible && (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
              boxShadow: `0 4px 20px rgba(${theme.shadowRgb},0.45)`,
            }}
          >
            {toast.message}
          </div>
        </div>
      )}

      {(showModal || editExpense) && (
        <AddExpenseModal
          categories={categories}
          onSave={handleSave}
          onClose={closeModal}
          editExpense={editExpense}
        />
      )}

      {showCategoryManager && (
        <CategoryManager onClose={() => { setCategories(loadCategories()); setShowCategoryManager(false) }} />
      )}
    </div>
  )
}
