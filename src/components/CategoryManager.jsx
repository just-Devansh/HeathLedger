import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Check, X, Moon, Sun, Plus, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { saveCategory, deleteCategory, saveQuickActions } from '../utils/storage'
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
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
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

export default function CategoryManager({
  initialCategories,
  initialQuickActions,
  onCategoriesChange,
  onQuickActionsChange,
  onClose,
  onRestoreComplete,
  recurringRules,
  onRecurringRulesChange,
}) {
  const { theme, themeName, setTheme, isDark, toggleDark } = useTheme()

  // Local state initialized from parent's already-loaded data.
  const [categories, setCategories] = useState(initialCategories)
  const [editingIdx, setEditingIdx]             = useState(null)
  const [editName, setEditName]                 = useState('')
  const [editIcon, setEditIcon]                 = useState('box')
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null)
  const [openMenuIdx, setOpenMenuIdx]           = useState(null)
  const [addingCategory, setAddingCategory]     = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const [quickActions, setQuickActions] = useState(initialQuickActions)
  const [addingQuick, setAddingQuick]   = useState(false)
  const [quickFormName, setQuickFormName]   = useState('')
  const [quickFormCatId, setQuickFormCatId] = useState('')
  const [catPickerOpen, setCatPickerOpen]   = useState(false)
  const catPickerRef = useRef(null)

  useEffect(() => {
    if (!catPickerOpen) return
    function handleOutside(e) {
      if (catPickerRef.current && !catPickerRef.current.contains(e.target)) setCatPickerOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [catPickerOpen])

  const CATEGORY_PREVIEW = 3
  const visibleCategories = showAllCategories ? categories : categories.slice(0, CATEGORY_PREVIEW)
  const hiddenCount = categories.length - CATEGORY_PREVIEW

  // Sync local state to parent and persist to DB.
  function updateCategories(newCats) {
    setCategories(newCats)
    onCategoriesChange?.(newCats)
  }

  function updateQuickActions(newActions) {
    const normalized = newActions.slice(0, 4)
    setQuickActions(normalized)
    onQuickActionsChange?.(normalized)
    saveQuickActions(normalized)
  }

  function submitQuickForm() {
    const name = quickFormName.trim()
    if (!name || !quickFormCatId) return
    updateQuickActions([...quickActions, { name, categoryId: quickFormCatId }])
    setAddingQuick(false)
    setQuickFormName('')
    setCatPickerOpen(false)
  }

  function handleDelete(idx) {
    const toDelete = categories[idx]
    const newCats = categories.filter((_, i) => i !== idx)
    updateCategories(newCats)
    deleteCategory(toDelete.id)
    setConfirmDeleteIdx(null)
  }

  function startEdit(idx) {
    setConfirmDeleteIdx(null)
    setOpenMenuIdx(null)
    setEditingIdx(idx)
    setEditName(categories[idx].name)
    setEditIcon(categories[idx].icon ?? 'box')
  }

  function handleEditSave(idx) {
    const name = editName.trim()
    if (!name) { setEditingIdx(null); return }
    const updatedCat = { ...categories[idx], name, icon: editIcon }
    const newCats = [...categories]
    newCats[idx] = updatedCat
    updateCategories(newCats)
    saveCategory(updatedCat)
    setEditingIdx(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.pageBg }}>

      {(confirmDeleteIdx !== null || openMenuIdx !== null) && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 51 }}
          onClick={() => { setConfirmDeleteIdx(null); setOpenMenuIdx(null) }}
        />
      )}

      <div className="max-w-[480px] w-full mx-auto flex flex-col flex-1 min-h-0">

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-8 pb-4"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: theme.accent, letterSpacing: '0.13em' }}>Heath Ledger ✦</p>
            <h2
              className="font-display mt-2"
              style={{ color: theme.heading, fontSize: '2.35rem', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.035em' }}
            >Settings</h2>
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
                {isDark ? <Moon size={18} color={theme.primary} /> : <Sun size={18} color={theme.primary} />}
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
            <div className="flex flex-wrap gap-4">
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
            {visibleCategories.map((cat, idx) => (
              <li
                key={cat.id}
                className="flex flex-col px-4 py-3 rounded-2xl"
                style={{
                  background: theme.cardBg,
                  boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.08)`,
                  position: 'relative',
                  zIndex: confirmDeleteIdx === idx || openMenuIdx === idx ? 52 : 'auto',
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
                        if (e.key === 'Enter')  handleEditSave(idx)
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
                      <div className="confirm-popup flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ background: '#22c55e', color: '#ffffff' }}
                          aria-label="Confirm delete"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(null)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ background: theme.inputBg, color: theme.textMuted }}
                          aria-label="Cancel delete"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }} className="flex-shrink-0">
                        <button
                          onClick={() => setOpenMenuIdx(openMenuIdx === idx ? null : idx)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{
                            color: theme.textMuted,
                            background: openMenuIdx === idx ? theme.inputBg : 'transparent',
                          }}
                          aria-label={`Options for ${cat.name}`}
                        >
                          <MoreVertical size={17} />
                        </button>
                        {openMenuIdx === idx && (
                          <div
                            className="absolute right-0 rounded-2xl overflow-hidden"
                            style={{
                              top: 'calc(100% + 6px)',
                              background: theme.cardBg,
                              boxShadow: `0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px ${theme.border}`,
                              zIndex: 20,
                              minWidth: '130px',
                            }}
                          >
                            <button
                              onClick={() => startEdit(idx)}
                              className="expense-menu-item w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium"
                              style={{ color: theme.text }}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <div style={{ height: '1px', background: theme.border }} />
                            <button
                              onClick={() => { setConfirmDeleteIdx(idx); setOpenMenuIdx(null) }}
                              className="expense-menu-item danger w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {categories.length > CATEGORY_PREVIEW && (
            <button
              onClick={() => setShowAllCategories(v => {
                if (v) { setEditingIdx(null); setConfirmDeleteIdx(null); setOpenMenuIdx(null) }
                return !v
              })}
              className="w-full flex items-center justify-center gap-1.5 py-2 mb-1 active:opacity-60 transition-opacity"
              style={{ color: theme.textFaint }}
            >
              {showAllCategories ? (
                <><ChevronUp size={13} /><span className="text-xs font-medium">Show less</span></>
              ) : (
                <><ChevronDown size={13} /><span className="text-xs font-medium">See all {categories.length} categories</span></>
              )}
            </button>
          )}

          {/* Quick Actions */}
          <div className="px-6 pt-5 pb-5" style={{ borderTop: `1px solid ${theme.border}` }}>
            <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: theme.textFaint }}>
              Quick Actions
            </p>

            <div className="flex flex-col gap-2">
              {quickActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => {
                    const cat = categories.find(c => c.id === action.categoryId)
                    if (!cat) return null
                    const label = action.name ?? cat.name
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full"
                        style={{ background: theme.primary, color: '#fff' }}
                      >
                        {getIcon(cat.icon, { size: 13, color: '#fff' })}
                        <span className="text-sm font-medium" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                        <button
                          onClick={() => updateQuickActions(quickActions.filter((_, i) => i !== idx))}
                          className="flex items-center justify-center active:scale-75 transition-transform"
                          style={{ color: 'rgba(255,255,255,0.75)', marginLeft: 2, flexShrink: 0 }}
                          aria-label={`Remove ${label}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {quickActions.length < 4 && !addingQuick && (
                <div>
                  <button
                    onClick={() => { setAddingQuick(true); setQuickFormName(''); setQuickFormCatId(categories[0]?.id ?? ''); setCatPickerOpen(false) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform"
                    style={{ border: `1.5px dashed ${theme.border}`, color: theme.textMuted, background: 'transparent' }}
                  >
                    <Plus size={13} />
                    Add shortcut
                  </button>
                </div>
              )}

              {addingQuick && (
                <div
                  className="flex flex-col gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: theme.cardBg, boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.08)` }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. Lunch)"
                      value={quickFormName}
                      onChange={e => setQuickFormName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitQuickForm(); if (e.key === 'Escape') setAddingQuick(false) }}
                      className="flex-1 outline-none text-sm font-medium bg-transparent min-w-0"
                      style={{ color: theme.text, borderBottom: `1px solid ${theme.border}`, padding: '4px 0' }}
                      autoFocus
                    />
                    <button
                      onClick={submitQuickForm}
                      disabled={!quickFormName.trim() || !quickFormCatId}
                      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 active:scale-95 transition-transform disabled:opacity-40"
                      style={{ background: '#22c55e', color: '#ffffff' }}
                      aria-label="Add shortcut"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => { setAddingQuick(false); setCatPickerOpen(false) }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 active:scale-95 transition-transform"
                      style={{ background: theme.inputBg, color: theme.textMuted }}
                      aria-label="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: theme.textFaint }}>Category</span>
                    <div ref={catPickerRef} className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setCatPickerOpen(v => !v)}
                        className="w-full flex items-center gap-2 text-left outline-none"
                        style={{
                          borderBottom: `1px solid ${catPickerOpen ? theme.primary : theme.border}`,
                          padding: '4px 0',
                          background: 'transparent',
                          transition: 'border-color 0.15s ease',
                        }}
                        aria-haspopup="listbox"
                        aria-expanded={catPickerOpen}
                      >
                        {(() => {
                          const cat = categories.find(c => c.id === quickFormCatId)
                          return cat ? (
                            <>
                              <span className="flex-shrink-0" style={{ color: theme.primary }}>
                                {getIcon(cat.icon, { size: 14 })}
                              </span>
                              <span className="flex-1 text-sm font-medium min-w-0 truncate" style={{ color: theme.text }}>
                                {cat.name}
                              </span>
                            </>
                          ) : (
                            <span className="flex-1 text-sm" style={{ color: theme.textFaint }}>Select category</span>
                          )
                        })()}
                        <ChevronDown
                          size={14}
                          style={{
                            flexShrink: 0,
                            color: theme.textMuted,
                            transform: catPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </button>

                      <div
                        role="listbox"
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 10px)',
                          left: 0,
                          right: 0,
                          zIndex: 60,
                          borderRadius: '1rem',
                          border: `1px solid ${theme.border}`,
                          boxShadow: `0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)`,
                          overflow: 'hidden',
                          opacity: catPickerOpen ? 1 : 0,
                          transform: catPickerOpen ? 'scale(1) translateY(0px)' : 'scale(0.96) translateY(6px)',
                          pointerEvents: catPickerOpen ? 'auto' : 'none',
                          transition: 'opacity 0.16s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                          transformOrigin: 'bottom center',
                        }}
                      >
                        <div style={{ maxHeight: 220, overflowY: 'auto', background: theme.cardBg }}>
                          {categories.map((cat, i) => {
                            const isSelected = cat.id === quickFormCatId
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => { setQuickFormCatId(cat.id); setCatPickerOpen(false) }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left active:opacity-70 transition-opacity"
                                style={{
                                  background: isSelected ? `${theme.primary}18` : 'transparent',
                                  borderTop: i > 0 ? `1px solid ${theme.border}` : 'none',
                                  color: isSelected ? theme.primary : theme.text,
                                  fontWeight: isSelected ? 600 : 400,
                                }}
                              >
                                <span style={{ flexShrink: 0, color: isSelected ? theme.primary : theme.textMuted }}>
                                  {getIcon(cat.icon, { size: 15 })}
                                </span>
                                <span className="flex-1 min-w-0 truncate">{cat.name}</span>
                                {isSelected && <Check size={13} style={{ flexShrink: 0, color: theme.primary }} />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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
            const newCat = { id: crypto.randomUUID(), name, icon }
            const newCats = [...categories, newCat]
            updateCategories(newCats)
            saveCategory(newCat)
            setAddingCategory(false)
          }}
          onClose={() => setAddingCategory(false)}
        />
      )}
    </div>
  )
}
