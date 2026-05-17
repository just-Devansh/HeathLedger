import { useState, useRef, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { CATEGORY_ICONS, ICON_OPTIONS, getIcon } from '../utils/icons'

function formatIconLabel(name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function InlineIconPicker({ selected, onSelect, theme }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open])

  const SelectedIcon = CATEGORY_ICONS[selected] ?? CATEGORY_ICONS.box

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 flex items-center justify-center transition-all active:scale-90"
        style={{
          borderRadius: 'var(--r-element)',
          background: open ? theme.primary : theme.surface,
          border: `1.5px solid ${open ? theme.primary : theme.border}`,
        }}
        aria-label="Choose icon"
      >
        <SelectedIcon size={18} color={open ? '#ffffff' : theme.primary} />
      </button>

      {open && (
        <div
          className="icon-picker-panel absolute left-0 z-50"
          style={{
            bottom: 'calc(100% + 8px)',
            borderRadius: 'var(--r-card)',
            padding: '16px',
            width: 'fit-content',
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 8px 32px rgba(${theme.shadowRgb},0.2), 0 2px 8px rgba(${theme.shadowRgb},0.1)`,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 36px)', gap: '12px' }}>
            {ICON_OPTIONS.map(name => {
              const isSelected = selected === name
              const Icon = CATEGORY_ICONS[name]
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onSelect(name); setOpen(false) }}
                  className="w-9 h-9 flex items-center justify-center transition-colors active:scale-90"
                  style={{
                    borderRadius: 'var(--r-element)',
                    background: isSelected ? theme.primary : theme.inputBg,
                    border: `2px solid ${isSelected ? theme.primary : 'transparent'}`,
                  }}
                  aria-label={formatIconLabel(name)}
                >
                  <Icon size={16} color={isSelected ? '#ffffff' : theme.textMuted} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AddCategoryModal({ existingNames, onSave, onClose }) {
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('box')
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  const trimmed = name.trim()
  const isDupe = existingNames.includes(trimmed)
  const canSave = trimmed.length > 0 && !isDupe

  function handleSave() {
    if (!canSave) return
    onSave({ name: trimmed, icon })
  }

  return (
    <div
      className="fixed inset-0 flex items-end z-[60]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[480px] mx-auto flex flex-col"
        style={{
          background: theme.pageBg,
          borderRadius: 'var(--r-shell) var(--r-shell) 0 0',
          maxHeight: 'min(92dvh, 92vh)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4 flex-shrink-0">
          <h3 className="text-lg font-bold" style={{ color: theme.heading }}>New Category</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
            style={{ borderRadius: 'var(--r-element)', border: `1px solid ${theme.border}`, color: theme.textMuted }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 pb-8 flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <InlineIconPicker selected={icon} onSelect={setIcon} theme={theme} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Category name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
              className="flex-1 px-4 py-3 text-sm outline-none"
              style={{
                borderRadius: 'var(--r-element)',
                background: theme.inputBg,
                color: theme.text,
                border: `1px solid ${isDupe ? '#ef4444' : theme.border}`,
              }}
            />
          </div>

          {isDupe && (
            <p className="text-xs" style={{ color: '#ef4444', marginTop: -8 }}>
              A category with this name already exists.
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-30"
            style={{
              borderRadius: 'var(--r-element)',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            }}
          >
            <Check size={16} />
            Save Category
          </button>
        </div>
      </div>
    </div>
  )
}
