import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { monthYearLabel, monthName, fullDateLabel } from './dateFormat'

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function monthSlug(date) {
  return monthName(date).toLowerCase() + '-' + date.getFullYear()
}

function buildTemplate({ breakdown, total, monthExpenses, theme, now }) {
  const accent      = theme.primary
  const gradEnd     = theme.gradEnd   || theme.secondary
  const gradientBg  = theme.gradientBg

  // Always dark — premium OLED-style PDF regardless of app mode
  const bg      = '#0d0d0d'
  const cardBg  = '#1a1a1a'
  const border  = 'rgba(255,255,255,0.07)'
  const text    = '#f8fafc'
  const muted   = 'rgba(255,255,255,0.50)'
  const faint   = 'rgba(255,255,255,0.26)'
  const divider = 'rgba(255,255,255,0.06)'

  const pjs = `'Plus Jakarta Sans', system-ui, sans-serif`
  const sg  = `'Space Grotesk', system-ui, sans-serif`

  const genDate = fullDateLabel(now)

  const avgPerEntry = monthExpenses.length > 0
    ? fmt(total / monthExpenses.length)
    : '—'

  // ── Snapshot chips ────────────────────────────────────────────────────────
  const stats = [
    { value: monthExpenses.length, label: 'entries logged' },
    { value: breakdown.length,     label: 'categories'     },
    { value: avgPerEntry,          label: 'avg per entry'  },
  ]

  const statChips = stats.map(({ value, label }) => `
    <div style="
      flex: 1;
      background: ${cardBg};
      border-radius: 16px;
      padding: 22px 18px;
      border: 1px solid ${border};
      text-align: center;
    ">
      <p style="
        font-family: ${sg};
        font-size: 26px;
        font-weight: 700;
        color: ${text};
        margin: 0;
        letter-spacing: -0.025em;
        line-height: 1;
      ">${value}</p>
      <p style="
        font-family: ${pjs};
        font-size: 10px;
        font-weight: 600;
        color: ${muted};
        margin: 8px 0 0;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      ">${label}</p>
    </div>
  `).join('')

  // ── Category cards (2-col grid via flex) ─────────────────────────────────
  const categoryCards = breakdown.map(({ name, amount, percentage }) => `
    <div style="
      width: calc(50% - 6px);
      box-sizing: border-box;
      background: ${cardBg};
      border-radius: 16px;
      padding: 20px 22px;
      border: 1px solid ${border};
    ">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
        <div style="min-width:0; flex:1; margin-right:10px;">
          <p style="
            font-family: ${pjs};
            font-size: 13px;
            font-weight: 700;
            color: ${text};
            margin: 0;
            letter-spacing: -0.01em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${name}</p>
          <p style="
            font-family: ${pjs};
            font-size: 11px;
            font-weight: 500;
            color: ${muted};
            margin: 4px 0 0;
          ">${percentage.toFixed(1)}%</p>
        </div>
        <p style="
          font-family: ${sg};
          font-size: 15px;
          font-weight: 700;
          color: ${accent};
          margin: 0;
          letter-spacing: -0.02em;
          white-space: nowrap;
          flex-shrink: 0;
        ">${fmt(amount)}</p>
      </div>
      <div style="height: 3px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
        <div style="
          height: 100%;
          width: ${Math.max(percentage, 2)}%;
          background: linear-gradient(90deg, ${accent}, ${gradEnd});
          border-radius: 999px;
        "></div>
      </div>
    </div>
  `).join('')

  return `
    <div style="
      background: ${bg};
      width: 800px;
      box-sizing: border-box;
      padding: 60px;
      position: relative;
      font-family: ${pjs};
    ">

      <!-- Header -->
      <div style="margin-bottom: 36px;">
        <p style="
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: ${accent};
          text-transform: uppercase;
          margin: 0 0 14px;
          font-family: ${pjs};
        ">Heath Ledger ✦</p>
        <h1 style="
          font-family: ${sg};
          font-size: 42px;
          font-weight: 800;
          color: ${text};
          margin: 0 0 10px;
          letter-spacing: -0.035em;
          line-height: 1.0;
        ">Phirse Kharcha?</h1>
        <p style="
          font-family: ${pjs};
          font-size: 14px;
          font-weight: 500;
          color: ${muted};
          margin: 0;
        ">${monthYearLabel(now)}</p>
      </div>

      <div style="height: 1px; background: ${divider}; margin-bottom: 36px;"></div>

      <!-- Hero total card -->
      <div style="
        background: ${gradientBg};
        border-radius: 20px;
        padding: 40px;
        margin-bottom: 24px;
        text-align: center;
      ">
        <p style="
          font-family: ${pjs};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.58);
          text-transform: uppercase;
          margin: 0 0 16px;
        ">This month's damage</p>
        <p style="
          font-family: ${sg};
          font-size: 60px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.025em;
          line-height: 1;
        ">${fmt(total)}</p>
        ${breakdown[0] ? `
          <p style="
            font-family: ${pjs};
            font-size: 13px;
            font-weight: 500;
            color: rgba(255,255,255,0.58);
            margin: 16px 0 0;
            letter-spacing: 0.01em;
          ">Biggest: ${breakdown[0].name} — ${fmt(breakdown[0].amount)}</p>
        ` : ''}
      </div>

      <!-- Snapshot chips -->
      <div style="display: flex; gap: 12px; margin-bottom: 36px;">
        ${statChips}
      </div>

      ${breakdown.length > 0 ? `
      <!-- Category breakdown -->
      <div style="margin-bottom: 40px;">
        <p style="
          font-family: ${pjs};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: ${muted};
          text-transform: uppercase;
          margin: 0 0 20px;
        ">Where it all went</p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          ${categoryCards}
        </div>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="height: 1px; background: ${divider}; margin-bottom: 22px;"></div>
      <p style="
        font-family: ${pjs};
        font-size: 11px;
        font-weight: 500;
        color: ${faint};
        margin: 0;
        letter-spacing: 0.02em;
      ">Generated on ${genDate} · Heath Ledger</p>

    </div>
  `
}

export async function generateMonthlySummaryPDF({ expenses, theme }) {
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

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed; top:-9999px; left:-9999px; pointer-events:none;'
  container.innerHTML = buildTemplate({ breakdown, total, monthExpenses, theme, now })
  document.body.appendChild(container)

  try {
    const el = container.firstElementChild
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0d0d0d',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdfWidth  = 210
    const pdfHeight = (canvas.height / canvas.width) * pdfWidth

    const pdf = new jsPDF({
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      orientation: 'portrait',
    })

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`heath-ledger-${monthSlug(now)}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
