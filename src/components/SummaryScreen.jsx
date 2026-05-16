import { useMemo, useState } from 'react'
import { Wallet, Download } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'
import PageHeader from './PageHeader'

function currentMonthLabel() {
  const d = new Date()
  return `${d.toLocaleDateString('en-IN', { month: 'long' })} • ${d.getFullYear()}`
}

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

export default function SummaryScreen({ expenses, categories }) {
  const { theme, isDark } = useTheme()
  const iconMap = Object.fromEntries((categories ?? []).map(c => [c.name, c.icon]))
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    setGenerating(true)
    try {
      const { generateMonthlySummaryPDF } = await import('../utils/generatePDF')
      await generateMonthlySummaryPDF({ expenses, theme })
    } finally {
      setGenerating(false)
    }
  }

  const { total, breakdown } = useMemo(() => {
    const now = new Date()
    const monthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

    const byCategory = {}
    for (const exp of monthExpenses) {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
    }

    const breakdown = Object.entries(byCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    return { total, breakdown }
  }, [expenses])

  const biggest = breakdown[0]

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-[100px]">
      <PageHeader
        animate
        label="Heath Ledger ✦"
        title="Phirse Kharcha?"
        subtitle={currentMonthLabel()}
        right={
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold flex-shrink-0 mt-1 active:scale-95 transition-transform"
            style={{
              background: generating
                ? `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), ${theme.primary}`
                : theme.primary,
              color: '#ffffff',
              cursor: generating ? 'wait' : 'pointer',
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
              boxShadow: generating ? 'none' : `0 4px 14px rgba(${theme.shadowRgb},0.35)`,
            }}
            aria-label="Download PDF summary"
          >
            {generating ? (
              <svg
                className="icon-spin"
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <path d="M7 2a5 5 0 0 1 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <Download size={14} strokeWidth={2.5} />
            )}
            <span>{generating ? 'Generating…' : 'PDF'}</span>
          </button>
        }
      />

      <div
        className="rounded-2xl p-6 mb-5 text-center"
        style={{
          background: theme.gradientBg,
          boxShadow: theme.heroShadow,
        }}
      >
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: theme.mutedText, letterSpacing: '0.12em' }}>
          This month's damage
        </p>
        <p className="font-numeric" style={{ color: '#ffffff', fontSize: '2.75rem', fontWeight: 700, lineHeight: 1 }}>
          ₹{formatAmount(total)}
        </p>
        {biggest ? (
          <p className="text-xs mt-2.5 font-medium" style={{ color: theme.mutedText, letterSpacing: '0.01em' }}>
            Biggest: {biggest.name} — ₹{formatAmount(biggest.amount)}
          </p>
        ) : (
          <p className="text-xs mt-2.5" style={{ color: theme.mutedText }}>
            {breakdown.length} {breakdown.length === 1 ? 'category' : 'categories'}
          </p>
        )}
      </div>

      {breakdown.length === 0 ? (
        <div className="text-center py-16" style={{ color: theme.textFaint }}>
          <div className="flex justify-center mb-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: theme.inputBg }}
            >
              <Wallet size={28} color={theme.textFaint} />
            </div>
          </div>
          <p className="text-sm">No damage yet.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold mb-3 tracking-tight" style={{ color: theme.heading }}>
            Where it all went
          </p>
          <div className="flex flex-col gap-3">
            {breakdown.map(({ name, amount, percentage }) => {
              const barBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
              return (
                <div
                  key={name}
                  className="p-4 rounded-2xl"
                  style={{
                    background: theme.cardBg,
                    border: `1px solid rgba(${theme.shadowRgb}, 0.18)`,
                    boxShadow: `0 2px 14px rgba(${theme.shadowRgb}, 0.09)`,
                  }}
                >
                  {/* Left side allows shrinking; right side (amount) never shrinks */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ background: theme.surface }}
                      >
                        {getIcon(iconMap[name] ?? 'box', { size: 18, color: theme.primary })}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-bold tracking-tight leading-tight truncate"
                          style={{ color: theme.heading }}
                        >
                          {name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-base font-bold leading-tight tracking-tight flex-shrink-0"
                      style={{ color: theme.primary }}
                    >
                      ₹{formatAmount(amount)}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: barBg }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${theme.primary}, ${theme.gradEnd})`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
