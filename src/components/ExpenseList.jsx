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
      <div className="text-center py-24" style={{ color: '#94a3b8' }}>
        <p className="text-5xl mb-3">📋</p>
        <p className="text-sm">No expenses here. Tap + to add one.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {expenses.map(exp => (
        <li
          key={exp.id}
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xl w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#f1f5f9' }}
            >
              {CATEGORY_EMOJI[exp.category] ?? '📦'}
            </span>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>
                {exp.category}
              </p>
              {exp.note && (
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{exp.note}</p>
              )}
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{formatDate(exp.date)}</p>
            </div>
          </div>
          <p className="text-base font-bold ml-4" style={{ color: '#0f172a' }}>
            ₹{exp.amount}
          </p>
        </li>
      ))}
    </ul>
  )
}
