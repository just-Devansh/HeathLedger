import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Check, X, Moon, Sun, Plus } from 'lucide-react'
import { loadCategories, saveCategories } from '../utils/storage'
import { useTheme } from '../context/ThemeContext'
import { THEME_META } from '../utils/theme'
import { CATEGORY_ICONS, ICON_OPTIONS, getIcon } from '../utils/icons'
import BackupSection from './BackupSection'
import RecurringManager from './RecurringManager'
import AddCategoryModal from './AddCategoryModal'

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
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
        style={{
          background: open ? theme.primary : theme.surface,
          border: `1.5px solid ${open ? theme.primary : theme.border}`,
        }}
        aria-label="Choose icon"
      >
        <SelectedIcon size={18} color={open ? '#ffffff' : theme.primary} />
      </button>

      {open && (
        <div
          className="icon-picker-panel absolute left-0 z-50 rounded-2xl"
          style={{
            bottom: 'calc(100% + 8px)',
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
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors active:scale-90"
                  style={{
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

export default function CategoryManager({ onClose, onRestoreComplete, recurringRules, onRecurringRulesChange }) {
  const { theme, themeName, setTheme, isDark, toggleDark } = useTheme()
  const [categories, setCategories] = useState(() => loadCategories())
  const [editingIdx, setEditingIdx] = useState(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('box')
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null)
  const [addingCategory, setAddingCategory] = useState(false)

  function persist(cats) {
    setCategories(cats)
    saveCategories(cats)
  }

  function handleDelete(idx) {
    persist(categories.filter((_, i) => i !== idx))
    setConfirmDeleteIdx(null)
  }

  function startEdit(idx) {
    setConfirmDeleteIdx(null)
    setEditingIdx(idx)
    setEditName(categories[idx].name)
    setEditIcon(categories[idx].icon ?? 'box')
  }

  function handleEditSave(idx) {
    const name = editName.trim()
    if (!name) { setEditingIdx(null); return }
    const updated = [...categories]
    // Preserve the stable id so categoryId references in expenses remain valid.
    updated[idx] = { ...categories[idx], name, icon: editIcon }
    persist(updated)
    setEditingIdx(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.pageBg }}>

      {confirmDeleteIdx !== null && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 51 }}
          onClick={() => setConfirmDeleteIdx(null)}
        />
      )}

      <div className="max-w-[480px] w-full mx-auto flex flex-col flex-1 min-h-0">

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-8 pb-4"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>HeathLedger</p>
            <h2 className="text-2xl font-bold mt-1" style={{ color: theme.heading }}>Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-close w-9 h-9 flex items-center justify-center rounded-full"
            style={{ border: `1px solid ${theme.border}`, color: theme.textMuted }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Appearance */}
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: theme.textFaint }}>
              Appearance
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark
                  ? <Moon size={18} color={theme.primary} />
                  : <Sun size={18} color={theme.primary} />
                }
                <span className="text-sm font-medium" style={{ color: theme.text }}>Dark Mode</span>
              </div>
              <button
                onClick={toggleDark}
                className="relative w-12 h-6 rounded-full transition-colors active:scale-95"
                style={{ background: isDark ? theme.primary : theme.border }}
                aria-label="Toggle dark mode"
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{
                    left: '2px',
                    transform: isDark ? 'translateX(24px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Color theme picker */}
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: theme.textFaint }}>
              Color Theme
            </p>
            <div className="flex gap-4">
              {THEME_META.map(({ id, label, swatch }) => {
                const isActive = themeName === id
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className="flex flex-col items-center gap-1.5"
                    aria-label={`${label} theme`}
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        background: swatch,
                        boxShadow: isActive
                          ? `0 0 0 3px ${theme.cardBg}, 0 0 0 5px ${swatch}`
                          : '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      {isActive && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5L13 5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: isActive ? theme.primary : theme.textFaint }}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Categories list */}
          <div className="px-6 pt-5 pb-3" style={{ borderTop: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide font-medium" style={{ color: theme.textFaint }}>
                Categories
              </p>
              <button
                onClick={() => setAddingCategory(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
                style={{
                  borderRadius: 'var(--r-element)',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: '#ffffff',
                }}
                aria-label="Add category"
              >
                <Plus size={13} />
                Add
              </button>
            </div>
          </div>

          <ul className="px-6 pb-2 flex flex-col gap-2">
            {categories.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: theme.textFaint }}>
                No categories yet. Tap Add to create one.
              </p>
            )}
            {categories.map((cat, idx) => (
              <li
                key={idx}
                className="flex flex-col px-4 py-3 rounded-2xl"
                style={{
                  background: theme.cardBg,
                  boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.08)`,
                  position: 'relative',
                  zIndex: confirmDeleteIdx === idx ? 52 : 'auto',
                }}
              >
                {editingIdx === idx ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <InlineIconPicker selected={editIcon} onSelect={setEditIcon} theme={theme} />
                    <input
                      type="text"
                      className="flex-1 outline-none text-sm font-medium bg-transparent min-w-0"
                      style={{ color: theme.text, borderBottom: `1px solid ${theme.border}`, padding: '4px 0' }}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEditSave(idx)
                        if (e.key === 'Escape') setEditingIdx(null)
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleEditSave(idx)}
                      className="action-btn w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 active:scale-95 transition-transform"
                      style={{ background: '#22c55e', color: '#ffffff' }}
                      aria-label="Save"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="action-btn w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 active:scale-95 transition-transform"
                      style={{ background: theme.inputBg, color: theme.textMuted }}
                      aria-label="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: theme.surface }}
                    >
                      {getIcon(cat.icon ?? 'box', { size: 18, color: theme.primary })}
                    </span>
                    <span className="flex-1 text-sm font-medium" style={{ color: theme.text }}>{cat.name}</span>

                    {confirmDeleteIdx === idx ? (
                      <div className="confirm-popup flex gap-2">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
                          style={{ background: '#22c55e', color: '#ffffff' }}
                          aria-label="Confirm delete"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(null)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
                          style={{ background: theme.inputBg, color: theme.textMuted }}
                          aria-label="Cancel delete"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(idx)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
                          style={{ background: theme.surface, color: theme.secondary }}
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(idx)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
                          style={{ background: theme.dangerSurface, color: '#ef4444' }}
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <RecurringManager
            rules={recurringRules ?? []}
            categories={categories}
            onChange={onRecurringRulesChange}
          />

          <BackupSection onRestoreComplete={onRestoreComplete} />
        </div>

      </div>

      {addingCategory && (
        <AddCategoryModal
          existingNames={categories.map(c => c.name)}
          onSave={({ name, icon }) => {
            persist([...categories, { id: crypto.randomUUID(), name, icon }])
            setAddingCategory(false)
          }}
          onClose={() => setAddingCategory(false)}
        />
      )}
    </div>
  )
}
