import html2canvas from 'html2canvas'
import { monthYearLabel, fullDateLabel } from './dateFormat'

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

// Measures the rendered pixel width of a string at given font settings.
// Used to compute a safe padding-right for the category name column.
function measureText(str, fontPx, weight, family) {
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    ctx.font = `${weight} ${fontPx}px ${family}`
    return ctx.measureText(str).width
  } catch (_) {
    return fontPx * str.length * 0.6
  }
}

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

  const avgPerEntry = monthExpenses.length > 0 ? fmt(total / monthExpenses.length) : '—'
  const genDate = fullDateLabel(now)

  // Pre-measure the widest amount string so we know how much right-padding the name needs
  const widestAmount = breakdown.reduce((max, { amount }) => {
    const w = measureText(fmt(amount), 15, '700', 'Space Grotesk, system-ui')
    return w > max ? w : max
  }, 60)
  const amountColWidth = Math.ceil(widestAmount) + 16  // 16px breathing room

  const statChips = [
    { value: monthExpenses.length, label: 'Entries' },
    { value: breakdown.length,     label: 'Categories' },
    { value: avgPerEntry,          label: 'Avg/Entry' },
  ].map(({ value, label }) => `
    <div style="
      flex: 1;
      background: ${cardBg};
      border-radius: 14px;
      padding: 18px 12px 22px;
      border: 1px solid ${border};
      text-align: center;
      box-sizing: border-box;
    ">
      <p style="
        font-family: ${sg};
        font-size: 22px;
        font-weight: 700;
        line-height: 1.6;
        color: ${text};
        margin: 0;
        padding-bottom: 4px;
        letter-spacing: -0.025em;
        display: block;
      ">${value}</p>
      <p style="
        font-family: ${pjs};
        font-size: 9px;
        font-weight: 600;
        line-height: 1.6;
        color: ${muted};
        margin: 4px 0 0;
        padding-bottom: 4px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        display: block;
      ">${label}</p>
    </div>
  `).join('')

  /*
   * Category row layout:
   * - Outer card is position:relative
   * - Amount is position:absolute right:18px top:18px — never overflows the card
   * - Name + percentage occupy the left, with padding-right equal to amountColWidth + card-right-padding
   * - No flexbox, no display:table — plain block + absolute, most reliable in html2canvas
   */
  const categoryRows = breakdown.map(({ name, amount, percentage }) => `
    <div style="
      position: relative;
      padding: 18px ${amountColWidth + 26}px 20px 18px;
      background: ${cardBg};
      border-radius: 14px;
      border: 1px solid ${border};
      margin-bottom: 10px;
      box-sizing: border-box;
    ">
      <!-- Amount: absolutely pinned to right, never overflows -->
      <div style="
        position: absolute;
        right: 18px;
        top: 50%;
        margin-top: -22px;
        width: ${amountColWidth}px;
        text-align: right;
      ">
        <span style="
          font-family: ${sg};
          font-size: 15px;
          font-weight: 700;
          line-height: 1.6;
          color: ${accent};
          letter-spacing: -0.01em;
          display: block;
          padding-bottom: 4px;
          white-space: nowrap;
        ">${fmt(amount)}</span>
      </div>

      <!-- Name -->
      <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 4px;">
        <span style="
          font-family: ${pjs};
          font-size: 14px;
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
        font-size: 10px;
        font-weight: 500;
        line-height: 1.6;
        color: ${muted};
        margin: 0 0 12px;
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
  `).join('')

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
        padding: 38px 32px 40px;
        margin-bottom: 16px;
        text-align: center;
      ">
        <p style="
          font-family: ${pjs};
          font-size: 9px;
          font-weight: 700;
          line-height: 1.6;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          margin: 0 0 16px;
          padding-bottom: 4px;
          display: block;
        ">This month's damage</p>
        <p style="
          font-family: ${sg};
          font-size: 54px;
          font-weight: 700;
          line-height: 1.15;
          color: #ffffff;
          margin: 0;
          padding-bottom: 4px;
          letter-spacing: -0.025em;
          display: block;
        ">${fmt(total)}</p>
        ${breakdown[0] ? `
          <p style="
            font-family: ${pjs};
            font-size: 11px;
            font-weight: 500;
            line-height: 1.6;
            color: rgba(255,255,255,0.55);
            margin: 14px 0 0;
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
          display: block;
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
          display: block;
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
  const month = now.toLocaleDateString('en-CA').slice(0, 7)
  const filename = `heath-ledger-${month}.png`

  try {
    const el = container.firstElementChild

    // Let the off-screen layout fully settle before measuring
    await new Promise(r => setTimeout(r, 80))

    const canvas = await html2canvas(el, {
      scale: 2,
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
