const CATEGORY_EMOJI = {
  'Food': '🍔',
  'Transport': '🚗',
  'Rent/Fixed': '🏠',
  'Social/Going Out': '🎉',
  'Shopping': '🛍️',
  'Travel': '✈️',
  'Miscellaneous': '📦',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export default function ExpenseList({ expenses }) {
  if (expenses.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20">
        <p className="text-5xl mb-3">📋</p>
        <p className="text-sm">No expenses yet. Tap + to add one.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-50">
      {expenses.map(exp => (
        <li key={exp.id} className="flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl w-8 text-center">
              {CATEGORY_EMOJI[exp.category] ?? '📦'}
            </span>
            <div>
              <p className="font-medium text-gray-900 text-sm">{exp.category}</p>
              {exp.note && (
                <p className="text-sm text-gray-500">{exp.note}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(exp.date)}</p>
            </div>
          </div>
          <p className="text-base font-semibold text-gray-900">₹{exp.amount}</p>
        </li>
      ))}
    </ul>
  )
}
