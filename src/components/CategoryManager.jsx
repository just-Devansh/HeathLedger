import { useState } from 'react'
import { loadCategories, saveCategories } from '../utils/storage'

export default function CategoryManager({ onClose }) {
  const [categories, setCategories] = useState(() => loadCategories())
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

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
  }

  function startEdit(idx) {
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
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f1f5ff' }}>
      <div className="max-w-[480px] w-full mx-auto flex flex-col flex-1 min-h-0">

        <div
          className="flex items-center justify-between px-6 pt-8 pb-4"
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: '#6366f1' }}>HeathLedger</p>
            <h2 className="text-2xl font-bold mt-1" style={{ color: '#1e1b4b' }}>Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-xl leading-none"
            style={{ background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#94a3b8' }}>
              No categories yet. Add one below.
            </p>
          )}
          {categories.map((cat, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{ background: '#ffffff', boxShadow: '0 2px 12px rgba(79,70,229,0.10)' }}
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
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: '#4f46e5', color: '#ffffff' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingIdx(null)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: '#ede9fe', color: '#6366f1' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-lg flex-shrink-0"
                    style={{ background: '#ede9fe' }}
                  >
                    {cat.emoji}
                  </span>
                  <span className="flex-1 text-sm font-medium" style={{ color: '#0f172a' }}>{cat.name}</span>
                  <button
                    onClick={() => startEdit(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-base"
                    style={{ background: '#ede9fe', color: '#7c3aed' }}
                    aria-label={`Edit ${cat.name}`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-lg font-bold leading-none"
                    style={{ background: '#fef2f2', color: '#ef4444' }}
                    aria-label={`Delete ${cat.name}`}
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

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
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              Add
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
