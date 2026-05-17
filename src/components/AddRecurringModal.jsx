import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'
import { localDateString, defaultRecurrenceValue } from '../utils/recurringExpenses'

function fmtDateDisplay(dateStr) {
  if (!dateStr) return ''
  const [yyyy, mm, dd] = dateStr.split('-')
  return `${dd}/${mm}/${yyyy}`
}

const MONTHLY_DAYS = [
  ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
  'last',
]

const WEEKLY_DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

export default function AddRecurringModal({ categories, onSave, onClose, editRule }) {
  const { theme, isDark } = useTheme()
  const isEditing = !!editRule

  const [amount, setAmount] = useState(() => isEditing ? String(editRule.amount) : '')
  const [categoryId, setCategoryId] = useState(() => {
    if (isEditing) return editRule.categoryId
    const subs = categories.find(c => c.name === 'Subscriptions')
    if (subs) return subs.id
    const rentFixed = categories.find(c => c.name === 'Rent/Fixed')
    if (rentFixed) return rentFixed.id
    return null
  })
  const [note, setNote] = useState(() => isEditing ? (editRule.note ?? '') : '')
  const [recurrenceType, setRecurrenceType] = useState(() => isEditing ? editRule.recurrenceType : 'monthly')
  const [recurrenceValue, setRecurrenceValue] = useState(() =>
    isEditing ? editRule.recurrenceValue : defaultRecurrenceValue('monthly')
  )
  const [startDate, setStartDate] = useState(() =>
    isEditing ? editRule.startDate : localDateString(new Date())
  )
  const [active, setActive] = useState(() => isEditing ? editRule.active : true)

  function handleTypeChange(type) {
    setRecurrenceType(type)
    setRecurrenceValue(defaultRecurrenceValue(type))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || !categoryId) return
    onSave({
      amount: parseFloat(amount),
      categoryId,
      note: note.trim(),
      recurrenceType,
      recurrenceValue,
      startDate,
      active,
    })
  }

  return (
    <div
      className="fixed inset-0 flex items-end z-[60]"
      style={{ background: theme.modalBg }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl max-w-[480px] mx-auto flex flex-col"
        style={{ background: theme.cardBg, maxHeight: 'min(92dvh, 92vh)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            {isEditing ? 'Edit Recurring' : 'Add Recurring'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full text-xl leading-none active:scale-90 transition-transform"
            style={{ background: theme.inputBg, color: theme.textMuted }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Amount */}
            <div className="flex items-center gap-1 pt-1">
              <span className="text-4xl font-bold flex-shrink-0" style={{ color: theme.gradEnd }}>₹</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-4xl font-bold outline-none w-full bg-transparent min-w-0"
                style={{ color: theme.text }}
                autoFocus
                required
                min="0"
                step="any"
              />
            </div>

            {/* Note / Name */}
            <input
              type="text"
              placeholder="Name (Netflix, Rent, Gym...)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="border-b outline-none py-2 text-base bg-transparent"
              style={{ borderColor: theme.border, color: theme.text }}
            />

            {/* Category */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="px-3 py-2 rounded-full text-sm font-medium border transition-colors active:scale-95 flex items-center gap-1.5"
                    style={
                      categoryId === cat.id
                        ? { background: theme.primary, color: '#ffffff', borderColor: theme.primary }
                        : { background: theme.surface, color: theme.primary, borderColor: theme.border }
                    }
                  >
                    {getIcon(cat.icon, { size: 14, color: categoryId === cat.id ? '#ffffff' : theme.primary })}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurrence type toggle */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
                Repeats
              </p>
              <div
                className="relative flex overflow-hidden"
                style={{
                  background: theme.filterBg,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 'var(--r-card)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '50%',
                    background: theme.primary,
                    borderRadius: 'var(--r-element)',
                    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
                    transform: recurrenceType === 'weekly' ? 'translateX(100%)' : 'translateX(0)',
                  }}
                />
                {['monthly', 'weekly'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className="relative z-10 flex-1 text-sm font-medium"
                    style={{
                      padding: '8px 16px',
                      color: recurrenceType === type ? '#ffffff' : theme.accent,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {type === 'monthly' ? 'Monthly' : 'Weekly'}
                  </button>
                ))}
              </div>
            </div>

            {/* Day picker */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
                {recurrenceType === 'monthly' ? 'Day of Month' : 'Day of Week'}
              </p>

              {recurrenceType === 'monthly' ? (
                <div className="flex flex-wrap gap-1.5">
                  {MONTHLY_DAYS.map(day => {
                    const isSelected = recurrenceValue === day
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setRecurrenceValue(day)}
                        className="flex items-center justify-center rounded-xl text-xs font-semibold transition-colors active:scale-90"
                        style={{
                          width: day === 'last' ? '46px' : '36px',
                          height: '36px',
                          background: isSelected ? theme.primary : theme.inputBg,
                          color: isSelected ? '#ffffff' : theme.textMuted,
                          border: `1.5px solid ${isSelected ? theme.primary : 'transparent'}`,
                        }}
                      >
                        {day === 'last' ? 'Last' : day}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  {WEEKLY_DAYS.map(({ value, label }) => {
                    const isSelected = recurrenceValue === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRecurrenceValue(value)}
                        className="flex items-center justify-center rounded-xl text-xs font-semibold transition-colors active:scale-90"
                        style={{
                          flex: 1,
                          height: '36px',
                          background: isSelected ? theme.primary : theme.inputBg,
                          color: isSelected ? '#ffffff' : theme.textMuted,
                          border: `1.5px solid ${isSelected ? theme.primary : 'transparent'}`,
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Start date */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
                Start Date
              </p>
              <div className="relative">
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: theme.inputBg }}
                >
                  <span className="text-sm" style={{ color: theme.text }}>
                    {fmtDateDisplay(startDate)}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ color: theme.textMuted }}>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium" style={{ color: theme.text }}>Active</p>
                <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                  {active
                    ? 'Will generate expenses automatically'
                    : 'Paused — no entries will be created'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(v => !v)}
                className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0 active:scale-95"
                style={{ background: active ? theme.primary : theme.border }}
                aria-label={active ? 'Disable rule' : 'Enable rule'}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                  style={{
                    left: '2px',
                    transform: active ? 'translateX(24px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={!amount || !categoryId}
              className="py-3.5 rounded-xl text-base font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            >
              {isEditing ? 'Update Rule' : 'Save Rule'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
