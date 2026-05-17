import html2canvas from 'html2canvas'
import { monthYearLabel, fullDateLabel, dayMonthLabel } from './dateFormat'

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

// Fixed column width (px) reserved for the amount on the right of each card.
// Handles amounts up to ₹9,99,999 at the font sizes used below.
const AMOUNT_COL = 90

function buildExportTemplate({ breakdown, total, monthExpenses, theme, isDark, now }) {
  const accent     = theme.primary
  const gradEnd    = theme.gradEnd || theme.secondary
  const gradientBg = theme.gradientBg

  const bg      = isDark ? '#0a0a0a' : theme.pageBg
  const cardBg  = isDark ? '#151515' : '#ffffff'
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const text    = isDark ? '#f8fafc' : '#0f172a'
  const muted   = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)'
  const faint   = isDark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.28)'
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const barBg   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'

  const pjs = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  const sg  = `'Space Grotesk', system-ui, -apple-system, sans-serif`

  const genDate = fullDateLabel(now)

  // Switch to 2-column grid when there are many categories
  const twoCol = breakdown.length > 5

  // Most expensive day
  const byDay = {}
  for (const exp of monthExpenses) {
    const d = new Date(exp.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDay[key]) byDay[key] = { date: d, total: 0 }
    byDay[key].total += exp.amount
  }
  const maxDayEntry = Object.values(byDay).sort((a, b) => b.total - a.total)[0]
  const maxDayLabel = maxDayEntry ? dayMonthLabel(maxDayEntry.date).toUpperCase() : '—'
  const maxDayAmt   = maxDayEntry ? fmt(maxDayEntry.total) : '—'
  const daysElapsed = now.getDate()
  const avgExpense  = daysElapsed > 0 ? fmt(total / daysElapsed) : '—'

  function statChip({ topLabel, value, sub }) {
    return `
      <div style="
        flex: 1;
        background: ${cardBg};
        border-radius: 14px;
        padding: 16px 14px 18px;
        border: 1px solid ${border};
        text-align: center;
        box-sizing: border-box;
      ">
        <p style="
          font-family: ${pjs};
          font-size: 8px;
          font-weight: 700;
          line-height: 1.4;
          color: ${muted};
          margin: 0 0 8px;
          padding-bottom: 2px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          display: block;
        ">${topLabel}</p>
        <p style="
          font-family: ${sg};
          font-size: 20px;
          font-weight: 700;
          line-height: 1.3;
          color: ${text};
          margin: 0;
          padding-bottom: 4px;
          letter-spacing: -0.02em;
          display: block;
        ">${value}</p>
        ${sub ? `<p style="
          font-family: ${sg};
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          color: ${accent};
          margin: 3px 0 0;
          padding-bottom: 4px;
          letter-spacing: -0.01em;
          display: block;
        ">${sub}</p>` : ''}
      </div>
    `
  }

  const statChips = [
    statChip({ topLabel: 'Most Expensive Day', value: maxDayLabel, sub: maxDayAmt }),
    statChip({ topLabel: 'Avg Daily Spend',     value: avgExpense,  sub: null    }),
  ].join('')

  /*
   * Category card:
   *   - Amount is position:absolute at right edge — never overflows the card
   *   - Name column has padding-right equal to AMOUNT_COL + card-right-pad so they never touch
   *   - overflow:hidden is on a wrapper div, NOT on the text <p>, so html2canvas never clips glyphs
   *   - All text has explicit line-height + padding-bottom to prevent bottom-pixel clipping
   */
  function categoryCard({ name, amount, percentage }, compact) {
    const hPad  = compact ? 12 : 18   // horizontal card padding
    const vPadT = compact ? 14 : 18   // vertical top padding
    const vPadB = compact ? 16 : 20   // vertical bottom padding
    const namePx = compact ? 13 : 14  // category name font size
    const amtPx  = compact ? 13 : 15  // amount font size
    const pctPx  = compact ? 9  : 10  // percentage font size

    return `
      <div style="
        ${compact ? 'width: calc(50% - 5px);' : ''}
        position: relative;
        padding: ${vPadT}px ${AMOUNT_COL + hPad + 4}px ${vPadB}px ${hPad}px;
        background: ${cardBg};
        border-radius: 14px;
        border: 1px solid ${border};
        box-sizing: border-box;
        margin-bottom: ${compact ? 8 : 10}px;
      ">
        <!-- Amount pinned to right — absolutely positioned, never overflows -->
        <div style="
          position: absolute;
          right: ${hPad}px;
          top: 50%;
          margin-top: -20px;
          width: ${AMOUNT_COL}px;
          text-align: right;
        ">
          <span style="
            font-family: ${sg};
            font-size: ${amtPx}px;
            font-weight: 700;
            line-height: 1.6;
            color: ${accent};
            letter-spacing: -0.01em;
            display: block;
            padding-bottom: 4px;
            white-space: nowrap;
          ">${fmt(amount)}</span>
        </div>

        <!-- Name: overflow wrapper keeps truncation off the <span> so glyphs aren't clipped -->
        <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 4px;">
          <span style="
            font-family: ${pjs};
            font-size: ${namePx}px;
            font-weight: 700;
            line-height: 1.6;
            color: ${text};
            letter-spacing: -0.01em;
            padding-bottom: 4px;
            display: inline-block;
          ">${name}</span>
        </div>

        <!-- Percentage -->
        <p style="
          font-family: ${pjs};
          font-size: ${pctPx}px;
          font-weight: 500;
          line-height: 1.6;
          color: ${muted};
          margin: 0 0 ${compact ? 10 : 12}px;
          padding-bottom: 4px;
          display: block;
        ">${percentage.toFixed(1)}%</p>

        <!-- Progress bar -->
        <div style="height: 3px; background: ${barBg}; border-radius: 999px; overflow: hidden;">
          <div style="
            height: 100%;
            width: ${Math.max(percentage, 2)}%;
            background: linear-gradient(90deg, ${accent}, ${gradEnd});
            border-radius: 999px;
          "></div>
        </div>
      </div>
    `
  }

  const categoryRows = twoCol
    ? `<div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${breakdown.map(item => categoryCard(item, true)).join('')}
       </div>`
    : breakdown.map(item => categoryCard(item, false)).join('')

  return `
    <div style="
      background: ${bg};
      width: 540px;
      box-sizing: border-box;
      padding: 52px 46px 52px;
      font-family: ${pjs};
      position: relative;
    ">

      <!-- Header -->
      <div style="margin-bottom: 30px;">
        <p style="
          font-family: ${pjs};
          font-size: 9px;
          font-weight: 700;
          line-height: 1.6;
          letter-spacing: 0.18em;
          color: ${accent};
          text-transform: uppercase;
          margin: 0 0 14px;
          padding-bottom: 4px;
          display: block;
        ">Heath Ledger ✦</p>
        <h1 style="
          font-family: ${sg};
          font-size: 36px;
          font-weight: 800;
          line-height: 1.2;
          color: ${text};
          margin: 0 0 10px;
          padding-bottom: 4px;
          letter-spacing: -0.03em;
          display: block;
        ">Phirse Kharcha?</h1>
        <p style="
          font-family: ${pjs};
          font-size: 13px;
          font-weight: 500;
          line-height: 1.6;
          color: ${muted};
          margin: 0;
          padding-bottom: 4px;
          display: block;
        ">${monthYearLabel(now)}</p>
      </div>

      <div style="height: 1px; background: ${divider}; margin-bottom: 26px;"></div>

      <!-- Hero total card -->
      <div style="
        background: ${gradientBg};
        border-radius: 20px;
        padding: 24px 32px 26px;
        margin-bottom: 16px;
        text-align: center;
      ">
        <p style="
          font-family: ${pjs};
          font-size: 9px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.80);
          text-transform: uppercase;
          margin: 0 0 2px;
          padding-bottom: 2px;
          display: block;
        ">This month's damage</p>
        <p style="
          font-family: ${sg};
          font-size: 54px;
          font-weight: 700;
          line-height: 1;
          color: #ffffff;
          margin: 0;
          padding-bottom: 6px;
          letter-spacing: -0.025em;
          display: block;
        ">${fmt(total)}</p>
        ${breakdown[0] ? `
          <p style="
            font-family: ${pjs};
            font-size: 11px;
            font-weight: 500;
            line-height: 1.6;
            color: rgba(255,255,255,0.80);
            margin: 10px 0 0;
            padding-bottom: 4px;
            letter-spacing: 0.01em;
            display: block;
          ">Biggest: ${breakdown[0].name} — ${fmt(breakdown[0].amount)}</p>
        ` : ''}
      </div>

      <!-- Stats chips -->
      <div style="display: flex; gap: 10px; margin-bottom: 28px;">
        ${statChips}
      </div>

      ${breakdown.length > 0 ? `
      <!-- Category breakdown -->
      <div style="margin-bottom: 32px;">
        <p style="
          font-family: ${pjs};
          font-size: 9px;
          font-weight: 700;
          line-height: 1.6;
          letter-spacing: 0.14em;
          color: ${muted};
          text-transform: uppercase;
          margin: 0 0 14px;
          padding-bottom: 4px;
          display: block;
        ">Where it all went</p>
        ${categoryRows}
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="height: 1px; background: ${divider}; margin-bottom: 18px;"></div>
      <div style="overflow: hidden;">
        <p style="
          float: right;
          font-family: ${pjs};
          font-size: 9px;
          font-weight: 700;
          line-height: 1.6;
          color: ${accent};
          margin: 0;
          padding-bottom: 4px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.7;
        ">Heath Ledger</p>
        <p style="
          font-family: ${pjs};
          font-size: 10px;
          font-weight: 500;
          line-height: 1.6;
          color: ${faint};
          margin: 0;
          padding-bottom: 4px;
          letter-spacing: 0.02em;
        ">Generated on ${genDate}</p>
      </div>

    </div>
  `
}

export async function generateMonthlyImage({ expenses, categories, theme, isDark }) {
  const now = new Date()
  const idToCategory = Object.fromEntries((categories ?? []).map(c => [c.id, c]))

  const monthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const byCategory = {}
  for (const exp of monthExpenses) {
    const key = exp.categoryId ?? exp.category ?? 'Unknown'
    byCategory[key] = (byCategory[key] || 0) + exp.amount
  }

  const breakdown = Object.entries(byCategory)
    .map(([key, amount]) => {
      const cat = idToCategory[key]
      return {
        name: cat?.name ?? key,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none;z-index:-999;'
  container.innerHTML = buildExportTemplate({ breakdown, total, monthExpenses, theme, isDark, now })
  document.body.appendChild(container)

  const bgColor = isDark ? '#0a0a0a' : theme.pageBg
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const filename = `${monthName}-${now.getFullYear()}-Report-Heath-Ledger.png`

  try {
    const el = container.firstElementChild

    // Let the off-screen layout fully settle before measuring height
    await new Promise(r => setTimeout(r, 80))

    const canvas = await html2canvas(el, {
      scale: 3,              // 1620px output → sharp when zoomed
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      logging: false,
      width: 540,
      height: el.scrollHeight,
      windowWidth: 540,
      windowHeight: el.scrollHeight,
    })

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

    const file = new File([blob], filename, { type: 'image/png' })
    if (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: 'Heath Ledger — Monthly Summary',
      })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } finally {
    document.body.removeChild(container)
  }
}
