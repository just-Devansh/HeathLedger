import { useState, useMemo, useEffect, useRef } from 'react'
import { Settings, Clock } from 'lucide-react'
import { loadExpenses, saveExpenses, loadCategories } from './utils/storage'
import { useTheme } from './context/ThemeContext'
import AddExpenseModal from './components/AddExpenseModal'
import ExpenseList from './components/ExpenseList'
import SummaryScreen from './components/SummaryScreen'
import CategoryManager from './components/CategoryManager'
import RadialMenu from './components/RadialMenu'
import HistoryScreen from './components/HistoryScreen'

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
  const d = new Date()
  return `${d.toLocaleDateString('en-IN', { month: 'long' })} • ${d.getFullYear()}`
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
  const { theme, setTheme, setDark } = useTheme()
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [categories, setCategories] = useState(() => loadCategories())
  const [showModal, setShowModal] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [prefillData, setPrefillData] = useState(null)
  const [radialOpen, setRadialOpen] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [filter, setFilter] = useState('Today')
  const [activeTab, setActiveTab] = useState('expenses')
  const [toast, setToast] = useState({ visible: false, message: '' })

  // ── Browser history / back-button management ────────────────────────────────
  // overlayDepth tracks how many history entries we've pushed so we can call
  // history.back() from X-buttons to keep the browser stack in sync.
  const overlayDepth = useRef(0)
  // Set to true by X-button close helpers before calling history.back() so the
  // popstate handler knows the close was already handled and skips re-closing.
  const isManualBack = useRef(false)
  // Mirror of current React state used inside the popstate handler to avoid
  // stale-closure reads (effects re-register the handler on every state change).
  const stateRef = useRef({})
  // When HistoryScreen is active it registers its own back handler here so the
  // centralized popstate below can delegate to it.
  const historyScreenBackRef = useRef(null)

  // Swipe navigation (expenses tab)
  const expensesContainerRef = useRef(null) // non-passive touchmove target
  const swipeTrackRef        = useRef(null) // DOM-manipulated during gesture
  const pillRef              = useRef(null) // filter pill — DOM-manipulated during gesture
  const touchStartRef        = useRef(null) // { x, y } of current touch
  const isHorizontalRef      = useRef(null) // null=undecided, true=horizontal, false=vertical
  const filterIndexRef       = useRef(0)    // mirror of filterIndex state for gesture handlers

  // Keep stateRef current so the popstate handler always reads fresh state.
  useEffect(() => {
    stateRef.current = { showModal, editExpense, radialOpen, showCategoryManager, activeTab }
  }, [showModal, editExpense, radialOpen, showCategoryManager, activeTab])

  // Centralized popstate handler — fires when Android/browser back is pressed.
  useEffect(() => {
    function handlePopState() {
      // If an X-button called syncHistoryBack() it already closed the overlay
      // and set isManualBack. Skip so we don't double-close.
      if (isManualBack.current) {
        isManualBack.current = false
        return
      }
      const s = stateRef.current
      // Priority: modal > settings > history tab (delegated) > other tabs.
      if (s.showModal || s.editExpense) {
        setShowModal(false)
        setEditExpense(null)
        setPrefillData(null)
      } else if (s.showCategoryManager) {
        setCategories(loadCategories())
        setShowCategoryManager(false)
      } else if (s.activeTab === 'history' && historyScreenBackRef.current) {
        // HistoryScreen handles its internal levels; calls onClose when done.
        historyScreenBackRef.current()
      } else if (s.activeTab !== 'expenses') {
        setActiveTab('expenses')
      }
      // else: nothing open — browser navigates back naturally.
      if (overlayDepth.current > 0) overlayDepth.current--
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // stable — reads all state via refs

  // Keep filterIndexRef in sync so gesture closures never read stale state.
  useEffect(() => {
    filterIndexRef.current = FILTERS.indexOf(filter)
  }, [filter])

  // Non-passive touchmove so we can call e.preventDefault() during horizontal swipes.
  // React adds passive listeners by default, so we must use addEventListener directly.
  useEffect(() => {
    if (activeTab !== 'expenses') return
    const el = expensesContainerRef.current
    if (!el) return

    function onTouchMove(e) {
      if (!touchStartRef.current) return
      const dx = e.touches[0].clientX - touchStartRef.current.x
      const dy = e.touches[0].clientY - touchStartRef.current.y

      // Direction lock: decide after 8px of movement.
      if (isHorizontalRef.current === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          isHorizontalRef.current = Math.abs(dx) > Math.abs(dy)
        }
      }
      if (!isHorizontalRef.current) return

      e.preventDefault() // block vertical scroll while swiping horizontally

      const idx = filterIndexRef.current
      // Rubber-band resistance at the edges.
      const atStart = idx === 0 && dx > 0
      const atEnd   = idx === FILTERS.length - 1 && dx < 0
      const clampedDx = (atStart || atEnd) ? dx * 0.18 : dx

      // Track: each page is 1/3 of the 300%-wide container.
      const PAGE   = 100 / 3
      const offset = -(idx * PAGE) + (clampedDx / window.innerWidth) * PAGE
      if (swipeTrackRef.current) {
        swipeTrackRef.current.style.transition = 'none'
        swipeTrackRef.current.style.transform  = `translateX(${offset}%)`
      }

      // Pill: translateX in multiples of its own width (100% = 1 tab step).
      if (pillRef.current) {
        const progress = -(clampedDx / window.innerWidth)
        const liveIdx  = Math.max(0, Math.min(FILTERS.length - 1, idx + progress))
        pillRef.current.style.transition = 'none'
        pillRef.current.style.transform  = `translateX(${liveIdx * 100}%)`
      }
    }

    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [activeTab])

  function pushOverlay() {
    overlayDepth.current++
    history.pushState({ heathLedger: true, depth: overlayDepth.current }, '')
  }

  // Called by X-buttons: close is already handled by React state above; this
  // just consumes the pushed history entry so the browser stack stays in sync.
  function syncHistoryBack() {
    if (overlayDepth.current > 0) {
      overlayDepth.current--
      isManualBack.current = true
      history.back()
    }
  }

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
    pushOverlay()
  }

  function closeModal() {
    setShowModal(false)
    setEditExpense(null)
    setPrefillData(null)
    syncHistoryBack()
  }

  function handleRadialAction(action) {
    setRadialOpen(false)
    setPrefillData({ category: action.category, note: action.note })
    setShowModal(true)
    pushOverlay()
  }

  function handleManualEntry() {
    setRadialOpen(false)
    setPrefillData({ category: '', note: '' })  // explicit empty — no localStorage fallback
    setShowModal(true)
    pushOverlay()
  }

  function handleTouchStart(e) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isHorizontalRef.current = null
  }

  function handleTouchEnd(e) {
    if (!touchStartRef.current || !isHorizontalRef.current) {
      touchStartRef.current = null
      isHorizontalRef.current = null
      return
    }
    const dx        = e.changedTouches[0].clientX - touchStartRef.current.x
    const W         = window.innerWidth
    const threshold = Math.min(50, W * 0.25)
    const idx       = filterIndexRef.current
    let newIdx      = idx
    if (dx < -threshold && idx < FILTERS.length - 1) newIdx = idx + 1
    else if (dx > threshold && idx > 0)               newIdx = idx - 1

    const PAGE = 100 / 3
    const ease = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)'
    if (swipeTrackRef.current) {
      swipeTrackRef.current.style.transition = ease
      swipeTrackRef.current.style.transform  = `translateX(${-newIdx * PAGE}%)`
    }
    if (pillRef.current) {
      pillRef.current.style.transition = ease
      pillRef.current.style.transform  = `translateX(${newIdx * 100}%)`
    }
    if (newIdx !== idx) setFilter(FILTERS[newIdx])

    touchStartRef.current = null
    isHorizontalRef.current = null
  }

  function handleTouchCancel() {
    // Finger lifted abnormally (e.g. incoming call) — snap back to current tab.
    if (touchStartRef.current && isHorizontalRef.current) {
      const idx  = filterIndexRef.current
      const PAGE = 100 / 3
      const ease = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)'
      if (swipeTrackRef.current) {
        swipeTrackRef.current.style.transition = ease
        swipeTrackRef.current.style.transform  = `translateX(${-idx * PAGE}%)`
      }
      if (pillRef.current) {
        pillRef.current.style.transition = ease
        pillRef.current.style.transform  = `translateX(${idx * 100}%)`
      }
    }
    touchStartRef.current = null
    isHorizontalRef.current = null
  }

  // All three tab lists computed simultaneously so pages are always mounted
  // (preserves each tab's scroll position during swipes).
  const todayExpenses = useMemo(() => filterExpenses(expenses, 'Today'), [expenses])
  const weekExpenses  = useMemo(() => filterExpenses(expenses, 'Week'),  [expenses])
  const monthExpenses = useMemo(() => filterExpenses(expenses, 'Month'), [expenses])
  const filterIndex   = FILTERS.indexOf(filter)

  return (
    <div className="min-h-screen" style={{ background: theme.pageBg }}>

      {activeTab === 'expenses' && (
        <div
          ref={expensesContainerRef}
          style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {/* Fixed header — sits above the swipeable content area */}
          <div className="flex-shrink-0" style={{ maxWidth: '480px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
            <header className="header-animate pt-8 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-xs font-semibold uppercase"
                    style={{ color: theme.accent, letterSpacing: '0.13em' }}
                  >
                    Heath Ledger ✦
                  </p>
                  <h1
                    className="font-display font-bold mt-2"
                    style={{
                      color: theme.heading,
                      fontSize: '2.25rem',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Phirse Kharcha?
                  </h1>
                  <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
                    {currentMonth()}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => { setActiveTab('history'); setRadialOpen(false); pushOverlay() }}
                    className="btn-settings w-9 h-9 flex items-center justify-center rounded-full"
                    style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.secondary }}
                    aria-label="View history"
                  >
                    <Clock size={18} />
                  </button>
                  <button
                    onClick={() => { setShowCategoryManager(true); pushOverlay() }}
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
                {/* Pill: ref lets gesture handler move it without re-renders */}
                <div
                  ref={pillRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${100 / FILTERS.length}%`,
                    background: theme.primary,
                    borderRadius: '999px',
                    transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
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
          </div>

          {/* Swipeable content — clips the 300%-wide track */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              ref={swipeTrackRef}
              style={{
                display: 'flex',
                width: '300%',
                height: '100%',
                transform: `translateX(${-filterIndex * (100 / 3)}%)`,
                transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform',
              }}
            >
              {[todayExpenses, weekExpenses, monthExpenses].map((exps, i) => (
                <div
                  key={i}
                  style={{ width: '33.333%', flexShrink: 0, height: '100%', overflowY: 'auto' }}
                >
                  <div className="max-w-[480px] mx-auto px-4 pb-[100px]">
                    <ExpenseList
                      expenses={exps}
                      categories={categories}
                      onEdit={openEdit}
                      onDelete={handleDeleteExpense}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <SummaryScreen expenses={expenses} categories={categories} />
      )}

      {activeTab === 'history' && (
        <HistoryScreen
          expenses={expenses}
          categories={categories}
          onClose={() => setActiveTab('expenses')}
          onClosedByUI={() => { setActiveTab('expenses'); syncHistoryBack() }}
          onEdit={openEdit}
          onDelete={handleDeleteExpense}
          onRegisterBackHandler={fn => { historyScreenBackRef.current = fn }}
        />
      )}

      <nav
        className="fixed z-40"
        style={{
          display: activeTab === 'history' ? 'none' : 'grid',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '420px',
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
          onClick={() => { setActiveTab('expenses'); setRadialOpen(false) }}
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
          <RadialMenu
            isOpen={radialOpen}
            onToggle={() => setRadialOpen(o => !o)}
            onActionSelect={handleRadialAction}
            onManualEntry={handleManualEntry}
          />
        </div>

        <button
          onClick={() => { setActiveTab('summary'); setRadialOpen(false); pushOverlay() }}
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
        <div
          className="fixed left-0 right-0 flex justify-center pointer-events-none"
          style={{ bottom: 104, zIndex: 55 }}
        >
          <div
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white toast-slide-up"
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
          initialCategory={!editExpense ? prefillData?.category : undefined}
          initialNote={!editExpense ? prefillData?.note : undefined}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          onClose={() => { setCategories(loadCategories()); setShowCategoryManager(false); syncHistoryBack() }}
          onRestoreComplete={(data) => {
            setExpenses(data.expenses)
            setCategories(data.categories)
            if (data.settings?.theme) setTheme(data.settings.theme)
            if (data.settings?.darkMode != null) setDark(data.settings.darkMode === 'true')
            setShowCategoryManager(false)
            showToast('Backup restored.')
          }}
        />
      )}
    </div>
  )
}
