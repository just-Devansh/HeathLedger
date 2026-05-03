import { useState } from 'react'
import { loadCategories, saveCategories } from '../utils/storage'
import { useTheme } from '../context/ThemeContext'
import { THEME_META } from '../utils/theme'

export default function CategoryManager({ onClose }) {
  const { theme, themeName, setTheme } = useTheme()
  const [categories, setCategories] = useState(() => loadCategories())
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null)

  function persist(cats) {
    setCategories(cats)
    saveCategories(cats)
  }

  function handleAdd() {
    const name = newName.trim()
    if (!name || categories.some(c => c.name === name)) return
    persist([...categories, { name, emoji: newEmoji.trim() || '📦' }])
    setNewName('')
    setNewEmoji('')
  }

  function handleDelete(idx) {
    persist(categories.filter((_, i) => i !== idx))
    setConfirmDeleteIdx(null)
  }

  function startEdit(idx) {
    setConfirmDeleteIdx(null)
    setEditingIdx(idx)
    setEditName(categories[idx].name)
    setEditEmoji(categories[idx].emoji)
  }

  function handleEditSave(idx) {
    const name = editName.trim()
    if (!name) { setEditingIdx(null); return }
    const updated = [...categories]
    updated[idx] = { name, emoji: editEmoji.trim() || '📦' }
    persist(updated)
    setEditingIdx(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.pageBg }}>

      {/* Click-outside backdrop for confirmation popup */}
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
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>HeathLedger</p>
            <h2 className="text-2xl font-bold mt-1" style={{ color: theme.heading }}>Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-close w-9 h-9 flex items-center justify-center rounded-full text-xl leading-none"
            style={{ border: '1px solid #e2e8f0' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Color theme picker */}
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: '#94a3b8' }}>
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
                          ? `0 0 0 3px #ffffff, 0 0 0 5px ${swatch}`
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
                      style={{ color: isActive ? theme.primary : '#94a3b8' }}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Categories list */}
          <div className="px-6 pt-4">
            <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: '#94a3b8' }}>
              Categories
            </p>
          </div>

          <ul className="px-6 pb-4 flex flex-col gap-2">
            {categories.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#94a3b8' }}>
                No categories yet. Add one below.
              </p>
            )}
            {categories.map((cat, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{
                  background: '#ffffff',
                  boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.10)`,
                  position: 'relative',
                  zIndex: confirmDeleteIdx === idx ? 52 : 'auto',
                }}
              >
                {editingIdx === idx ? (
                  <>
                    <input
                      type="text"
                      placeholder="😀"
                      value={editEmoji}
                      onChange={e => setEditEmoji(e.target.value)}
                      className="w-10 text-center text-lg outline-none rounded-lg bg-transparent"
                      style={{ border: '1px solid #e2e8f0', padding: '2px' }}
                    />
                    <input
                      type="text"
                      className="flex-1 outline-none text-sm font-medium bg-transparent"
                      style={{ color: '#0f172a' }}
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
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                      style={{ background: theme.primary, color: '#ffffff' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                      style={{ background: theme.surface, color: theme.accent }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-lg flex-shrink-0"
                      style={{ background: theme.surface }}
                    >
                      {cat.emoji}
                    </span>
                    <span className="flex-1 text-sm font-medium" style={{ color: '#0f172a' }}>{cat.name}</span>

                    {confirmDeleteIdx === idx ? (
                      <div className="confirm-popup flex gap-2">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl font-bold"
                          style={{ background: '#22c55e', color: '#ffffff', fontSize: '18px' }}
                          aria-label="Confirm delete"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(null)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl font-bold"
                          style={{ background: '#ef4444', color: '#ffffff', fontSize: '18px' }}
                          aria-label="Cancel delete"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(idx)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl text-base"
                          style={{ background: theme.surface, color: theme.secondary }}
                          aria-label={`Edit ${cat.name}`}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(idx)}
                          className="action-btn w-9 h-9 flex items-center justify-center rounded-xl text-base"
                          style={{ background: '#fef2f2', color: '#ef4444' }}
                          aria-label={`Delete ${cat.name}`}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add new category */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff' }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="😀"
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              className="w-14 text-center text-lg outline-none rounded-xl"
              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
            />
            <input
              type="text"
              placeholder="Category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            >
              Add
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
