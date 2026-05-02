import { useState } from 'react'
import { loadExpenses, saveExpenses } from './utils/storage'
import AddExpenseModal from './components/AddExpenseModal'
import ExpenseList from './components/ExpenseList'

export default function App() {
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [showModal, setShowModal] = useState(false)

  function handleSave(expense) {
    const updated = [expense, ...expenses]
    setExpenses(updated)
    saveExpenses(updated)
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white relative">
      <header className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold tracking-tight">HeathLedger</h1>
      </header>

      <main className="pb-24">
        <ExpenseList expenses={expenses} />
      </main>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full text-3xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add expense"
      >
        +
      </button>

      {showModal && (
        <AddExpenseModal
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
