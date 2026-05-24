import { useState, useMemo, useEffect, useRef } from 'react'
import { Settings, Clock } from 'lucide-react'
import {
  loadExpenses, loadCategories, loadRecurringRules, loadQuickActions,
  saveExpense, deleteExpense, bulkAddExpenses,
  saveRecurringRules, migrateExpensesToCategoryIds,
} from './utils/storage'
import { syncRecurringExpenses } from './utils/recurringExpenses'
import { getDriveEnabled, getLastBackupTime, getStoredToken, isTokenValid } from './utils/driveAuth'
import { performBackup as drivePerformBackup } from './utils/driveBackup'
import { useTheme } from './context/ThemeContext'
import AddExpenseModal from './components/AddExpenseModal'
import ExpenseList from './components/ExpenseList'
import SummaryScreen from './components/SummaryScreen'
import CategoryManager from './components/CategoryManager'
import RadialMenu from './components/RadialMenu'
import HistoryScreen from './components/HistoryScreen'
import PageHeader from './components/PageHeader'
import MonthCategoryFilter from './components/MonthCategoryFilter'
import { monthYearLabel } from './utils/dateFormat'

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
  return monthYearLabel(new Date())
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

  // All data starts empty; populated async from IndexedDB.
  const [isLoading, setIsLoading]       = useState(true)
  const [expenses, setExpenses]         = useState([])
  const [categories, setCategories]     = useState([])
  const [recurringRules, setRecurringRules] = useState([])
  const [quickActions, setQuickActions] = useState([])

  // Load everything from IndexedDB on mount.
  useEffect(() => {
    async function loadAll() {
      const [cats, exps, rules, actions] = await Promise.all([
        loadCategories(),
        loadExpenses(),
        loadRecurringRules(),
        loadQuickActions(),
      ])

      // One-time data migration: assign categoryId to legacy expenses that only have a name string.
      const { expenses: migrated, changed } = migrateExpensesToCategoryIds(exps, cats)
      if (changed) await bulkAddExpenses(migrated)

      // Auto-generate any recurring entries that are overdue.
      const generated = syncRecurringExpenses(rules, migrated)
      let finalExpenses = migrated
      if (generated.length > 0) {
        finalExpenses = [...generated, ...migrated]
        await bulkAddExpenses(generated)
      }

      setCategories(cats)
      setExpenses(finalExpenses)
      setRecurringRules(rules)
      setQuickActions(actions)
      setIsLoading(false)

      // Auto-backup: silently upload to Drive if >7 days since last backup and token is valid.
      // Runs after UI renders so it never blocks the app.
      ;(async () => {
        try {
          const [isDriveOn, lastBt, token] = await Promise.all([
            getDriveEnabled(), getLastBackupTime(), getStoredToken(),
          ])
          if (!isDriveOn || !isTokenValid(token)) return
          const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
          if (lastBt && Date.now() - new Date(lastBt).getTime() < SEVEN_DAYS) return
          await drivePerformBackup(token.access_token)
        } catch { /* silent — user will see stale timestamp in Settings */ }
      })()
    }
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [showModal, setShowModal]               = useState(false)
  const [editExpense, setEditExpense]           = useState(null)
  const [prefillData, setPrefillData]           = useState(null)
  const [radialOpen, setRadialOpen]             = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [filter, setFilter]                     = useState('Today')
  const [activeTab, setActiveTab]               = useState('expenses')
  const [toast, setToast]                       = useState({ visible: false, message: '' })
  const [monthCatFilter, setMonthCatFilter]     = useState(null)

  // ── Browser history / back-button management ────────────────────────────────
  const overlayDepth      = useRef(0)
  const isManualBack      = useRef(false)
  const stateRef          = useRef({})
  const historyScreenBackRef = useRef(null)

  // Swipe navigation (expenses tab)
  const expensesContainerRef = useRef(null)
  const swipeTrackRef        = useRef(null)
  const pillRef              = useRef(null)
  const touchStartRef        = useRef(null)
  const isHorizontalRef      = useRef(null)
  const filterIndexRef       = useRef(0)

  useEffect(() => {
    stateRef.current = { showModal, editExpense, radialOpen, showCategoryManager, activeTab }
  }, [showModal, editExpense, radialOpen, showCategoryManager, activeTab])

  useEffect(() => {
    function handlePopState() {
      if (isManualBack.current) {
        isManualBack.current = false
        return
      }
      const s = stateRef.current
      if (s.showModal || s.editExpense) {
        setShowModal(false)
        setEditExpense(null)
        setPrefillData(null)
      } else if (s.showCategoryManager) {
        setShowCategoryManager(false)
      } else if (s.activeTab === 'history' && historyScreenBackRef.current) {
        historyScreenBackRef.current()
      } else if (s.activeTab !== 'expenses') {
        setActiveTab('expenses')
      }
      if (overlayDepth.current > 0) overlayDepth.current--
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    filterIndexRef.current = FILTERS.indexOf(filter)
  }, [filter])

  function handleTouchMove(e) {
    if (!touchStartRef.current) return
    const dx = e.touches[0].clientX - touchStartRef.current.x
    const dy = e.touches[0].clientY - touchStartRef.current.y
    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy)
      }
    }
    if (!isHorizontalRef.current) return
    const idx       = filterIndexRef.current
    const W         = window.innerWidth
    const atStart   = idx === 0 && dx > 0
    const atEnd     = idx === FILTERS.length - 1 && dx < 0
    const clampedDx = (atStart || atEnd) ? dx * 0.18 : dx
    if (swipeTrackRef.current) {
      swipeTrackRef.current.style.transition = 'none'
      swipeTrackRef.current.style.transform  = `translateX(${-idx * W + clampedDx}px)`
    }
    if (pillRef.current) {
      const progress = -(clampedDx / W)
      const liveIdx  = Math.max(0, Math.min(FILTERS.length - 1, idx + progress))
      pillRef.current.style.transition = 'none'
      pillRef.current.style.transform  = `translateX(${liveIdx * 100}%)`
    }
  }

  function pushOverlay() {
    overlayDepth.current++
    history.pushState({ heathLedger: true, depth: overlayDepth.current }, '')
  }

  function syncHistoryBack() {
    if (overlayDepth.current > 0) {
      overlayDepth.current--
      isManualBack.current = true
      history.back()
    }
  }

  function handleRecurringRulesChange(newRules) {
    setRecurringRules(newRules)
    saveRecurringRules(newRules)
    const generated = syncRecurringExpenses(newRules, expenses)
    if (generated.length > 0) {
      setExpenses(prev => {
        const merged = [...generated, ...prev]
        bulkAddExpenses(generated)
        return merged
      })
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
    saveExpense(expense)
    const catName = categories.find(c => c.id === expense.categoryId)?.name ?? expense.category ?? ''
    showToast(`${isUpdate ? 'Updated' : 'Added'} ₹${expense.amount} to ${catName}`)
  }

  function handleDeleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
    deleteExpense(id)
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
    setPrefillData({ category: action.categoryId ?? action.category, note: action.note })
    setShowModal(true)
    pushOverlay()
  }

  function handleManualEntry() {
    setRadialOpen(false)
    setPrefillData({ category: '', note: '' })
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

    const ease = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)'
    if (swipeTrackRef.current) {
      swipeTrackRef.current.style.transition = ease
      swipeTrackRef.current.style.transform  = `translateX(${-newIdx * W}px)`
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
    if (touchStartRef.current && isHorizontalRef.current) {
      const idx  = filterIndexRef.current
      const ease = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)'
      if (swipeTrackRef.current) {
        swipeTrackRef.current.style.transition = ease
        swipeTrackRef.current.style.transform  = `translateX(${-idx * window.innerWidth}px)`
      }
      if (pillRef.current) {
        pillRef.current.style.transition = ease
        pillRef.current.style.transform  = `translateX(${idx * 100}%)`
      }
    }
    touchStartRef.current = null
    isHorizontalRef.current = null
  }

  const todayExpenses = useMemo(() => filterExpenses(expenses, 'Today'), [expenses])
  const weekExpenses  = useMemo(() => filterExpenses(expenses, 'Week'),  [expenses])
  const monthExpenses = useMemo(() => filterExpenses(expenses, 'Month'), [expenses])
  const filterIndex   = FILTERS.indexOf(filter)

  // Invisible splash while IndexedDB loads — same bg as app so there is no flash.
  if (isLoading) {
    return <div className="fixed inset-0" style={{ background: theme.pageBg }} />
  }

  return (
    <div className="min-h-screen" style={{ background: theme.pageBg }}>

      {activeTab === 'expenses' && (
        <div
          ref={expensesContainerRef}
          style={{ height: '100dvh', display: 'flex', flexDirection: 'column', touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="flex-shrink-0" style={{ maxWidth: '480px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
            <PageHeader
              animate
              label="Heath Ledger ✦"
              title="Phirse Kharcha?"
              subtitle={currentMonth()}
              right={
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
              }
            >
              <div
                className="relative flex mt-4 overflow-hidden"
                style={{
                  background: theme.filterBg,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 'var(--r-card)',
                }}
              >
                <div
                  ref={pillRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${100 / FILTERS.length}%`,
                    background: theme.primary,
                    borderRadius: 'var(--r-element)',
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
            </PageHeader>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              ref={swipeTrackRef}
              style={{
                display: 'flex',
                width: '300%',
                height: '100%',
                transform: `translateX(${-filterIndex * window.innerWidth}px)`,
                transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform',
              }}
            >
              {[todayExpenses, weekExpenses, monthExpenses].map((exps, i) => {
                const isMonth = i === 2
                const displayExpenses = isMonth && monthCatFilter
                  ? exps.filter(e => (e.categoryId ?? e.category) === monthCatFilter)
                  : exps
                return (
                  <div
                    key={i}
                    style={{ width: '33.333%', flexShrink: 0, height: '100%', overflowY: 'auto' }}
                  >
                    <div className="max-w-[480px] mx-auto px-4 pb-[100px]">
                      {isMonth && (
                        <div
                          style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 5,
                            paddingBottom: '2px',
                            background: theme.pageBg,
                          }}
                        >
                          <MonthCategoryFilter
                            categories={categories}
                            monthExpenses={exps}
                            value={monthCatFilter}
                            onChange={setMonthCatFilter}
                          />
                        </div>
                      )}
                      <ExpenseList
                        expenses={displayExpenses}
                        categories={categories}
                        onEdit={openEdit}
                        onDelete={handleDeleteExpense}
                      />
                    </div>
                  </div>
                )
              })}
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
          borderRadius: 'var(--r-shell)',
          boxShadow: theme.glassShadow,
          border: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => { setActiveTab('expenses'); setRadialOpen(false) }}
          className="flex flex-col items-center justify-center gap-0.5 active:scale-95"
          style={{
            padding: '8px 0',
            borderRadius: 'var(--r-card)',
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
            quickActions={quickActions}
            categories={categories}
          />
        </div>

        <button
          onClick={() => { setActiveTab('summary'); setRadialOpen(false); pushOverlay() }}
          className="flex flex-col items-center justify-center gap-0.5 active:scale-95"
          style={{
            padding: '8px 0',
            borderRadius: 'var(--r-card)',
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
          initialCategories={categories}
          initialQuickActions={quickActions}
          onCategoriesChange={setCategories}
          onQuickActionsChange={setQuickActions}
          recurringRules={recurringRules}
          onRecurringRulesChange={handleRecurringRulesChange}
          onClose={() => { setShowCategoryManager(false); syncHistoryBack() }}
          onRestoreComplete={({ expenses: exps, categories: cats, recurringRules: rules, settings }) => {
            setExpenses(exps)
            setCategories(cats)
            setRecurringRules(rules)
            if (settings?.theme)    setTheme(settings.theme)
            if (settings?.darkMode != null) setDark(settings.darkMode === 'true')
            setShowCategoryManager(false)
            showToast('Backup restored.')
          }}
        />
      )}
    </div>
  )
}
