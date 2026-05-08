import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function fmt(n) {
  return '₹' + n.toLocaleString('en-IN')
}

function monthLabel(date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function monthSlug(date) {
  return (
    date.toLocaleDateString('en-IN', { month: 'long' }).toLowerCase() +
    '-' +
    date.getFullYear()
  )
}

function buildTemplate({ breakdown, total, monthExpenses, accentHex, now }) {
  const genDate = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const categoryRows = breakdown
    .map(
      ({ name, amount, percentage }) => `
      <div style="
        background: #f8fafc;
        border-radius: 12px;
        padding: 18px 20px;
        border-left: 4px solid ${accentHex};
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div>
            <p style="font-size:15px; font-weight:700; color:#0f172a; margin:0; letter-spacing:-0.01em;">${name}</p>
            <p style="font-size:12px; color:#94a3b8; margin:3px 0 0;">${percentage.toFixed(1)}% of total</p>
          </div>
          <p style="font-size:17px; font-weight:800; color:${accentHex}; margin:0; letter-spacing:-0.02em;">${fmt(amount)}</p>
        </div>
        <div style="height:4px; background:#e2e8f0; border-radius:999px; overflow:hidden;">
          <div style="height:100%; width:${percentage}%; background:${accentHex}; border-radius:999px;"></div>
        </div>
      </div>
    `
    )
    .join('')

  const insightItems = [
    breakdown[0]
      ? `<div>
          <p style="font-size:20px; font-weight:800; color:#0f172a; margin:0; letter-spacing:-0.02em;">${breakdown[0].name}</p>
          <p style="font-size:12px; color:#64748b; margin:4px 0 0;">Biggest category</p>
         </div>`
      : '',
    `<div>
      <p style="font-size:20px; font-weight:800; color:#0f172a; margin:0;">${breakdown.length}</p>
      <p style="font-size:12px; color:#64748b; margin:4px 0 0;">Categories used</p>
     </div>`,
    `<div>
      <p style="font-size:20px; font-weight:800; color:#0f172a; margin:0;">${monthExpenses.length}</p>
      <p style="font-size:12px; color:#64748b; margin:4px 0 0;">Entries logged</p>
     </div>`,
  ]
    .filter(Boolean)
    .join('')

  return `
    <div style="
      position:relative;
      background:#ffffff;
      width:800px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      padding:60px;
      box-sizing:border-box;
      overflow:hidden;
    ">
      <!-- Top accent bar -->
      <div style="position:absolute; top:0; left:0; right:0; height:6px; background:${accentHex};"></div>

      <!-- Header -->
      <div style="margin-bottom:40px;">
        <p style="
          font-size:10px;
          font-weight:700;
          letter-spacing:0.14em;
          color:${accentHex};
          text-transform:uppercase;
          margin:0 0 10px;
        ">Firse Kharcha?</p>
        <h1 style="
          font-size:34px;
          font-weight:800;
          color:#0f172a;
          margin:0 0 6px;
          letter-spacing:-0.02em;
          line-height:1.1;
        ">Monthly Summary</h1>
        <p style="font-size:15px; color:#64748b; margin:0;">${monthLabel(now)}</p>
      </div>

      <div style="height:1px; background:#e2e8f0; margin-bottom:40px;"></div>

      <!-- Total spend -->
      <div style="margin-bottom:40px;">
        <p style="
          font-size:10px;
          font-weight:700;
          letter-spacing:0.12em;
          color:#94a3b8;
          text-transform:uppercase;
          margin:0 0 12px;
        ">Total Spend</p>
        <p style="
          font-size:56px;
          font-weight:900;
          color:#0f172a;
          margin:0;
          letter-spacing:-0.03em;
          line-height:1;
        ">${fmt(total)}</p>
        ${
          breakdown[0]
            ? `<p style="font-size:14px; color:#64748b; margin:12px 0 0;">
                Biggest hit: <strong style="color:#0f172a;">${breakdown[0].name}</strong> — ${fmt(breakdown[0].amount)}
               </p>`
            : ''
        }
      </div>

      <div style="height:1px; background:#e2e8f0; margin-bottom:40px;"></div>

      <!-- Breakdown -->
      ${
        breakdown.length > 0
          ? `
      <div style="margin-bottom:40px;">
        <p style="
          font-size:10px;
          font-weight:700;
          letter-spacing:0.12em;
          color:#94a3b8;
          text-transform:uppercase;
          margin:0 0 20px;
        ">Category Breakdown</p>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${categoryRows}
        </div>
      </div>
      `
          : ''
      }

      <!-- Insights panel -->
      <div style="
        background:#f1f5f9;
        border-radius:14px;
        padding:24px 28px;
        margin-bottom:40px;
      ">
        <p style="
          font-size:10px;
          font-weight:700;
          letter-spacing:0.12em;
          color:#94a3b8;
          text-transform:uppercase;
          margin:0 0 18px;
        ">Snapshot</p>
        <div style="display:flex; gap:48px; flex-wrap:wrap;">
          ${insightItems}
        </div>
      </div>

      <!-- Footer -->
      <div style="height:1px; background:#e2e8f0; margin-bottom:24px;"></div>
      <p style="font-size:12px; color:#cbd5e1; margin:0;">
        Generated on ${genDate} · Firse Kharcha?
      </p>
    </div>
  `
}

export async function generateMonthlySummaryPDF({ expenses, accentHex }) {
  const now = new Date()

  const monthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date)
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    )
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
  container.style.cssText =
    'position:fixed; top:-9999px; left:-9999px; pointer-events:none;'
  container.innerHTML = buildTemplate({
    breakdown,
    total,
    monthExpenses,
    accentHex,
    now,
  })
  document.body.appendChild(container)

  try {
    const el = container.firstElementChild
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')

    // Fit to A4 width, allow natural height
    const pdfWidth = 210
    const pdfHeight = (canvas.height / canvas.width) * pdfWidth

    const pdf = new jsPDF({
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      orientation: 'portrait',
    })

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`firse-kharcha-${monthSlug(now)}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
