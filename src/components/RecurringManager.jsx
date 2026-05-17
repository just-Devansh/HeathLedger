import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Repeat } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'
import { recurrenceLabel } from '../utils/recurringExpenses'
import AddRecurringModal from './AddRecurringModal'

function RuleCard({ rule, categories, onToggle, onEdit, onDelete, confirmDeleting, onConfirmDelete, onCancelDelete }) {
  const { theme } = useTheme()
  const cat = categories.find(c => c.id === rule.categoryId)

  return (
    <li
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: theme.cardBg,
        boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.08)`,
        opacity: rule.active ? 1 : 0.55,
        position: 'relative',
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Category icon */}
      <span
        className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: theme.surface }}
      >
        {getIcon(cat?.icon ?? 'box', { size: 17, color: theme.primary })}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
          {rule.note || cat?.name || 'Recurring expense'}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: theme.textMuted }}>
          ₹{rule.amount.toLocaleString('en-IN')} · {recurrenceLabel(rule)}
        </p>
      </div>

      {/* Actions */}
      {confirmDeleting ? (
        <div className="confirm-popup flex gap-2 flex-shrink-0">
          <button
            onClick={onConfirmDelete}
            className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: '#22c55e', color: '#ffffff' }}
            aria-label="Confirm delete"
          >
            <Check size={18} />
          </button>
          <button
            onClick={onCancelDelete}
            className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: theme.inputBg, color: theme.textMuted }}
            aria-label="Cancel delete"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Enable / disable toggle */}
          <button
            onClick={onToggle}
            className="relative rounded-full transition-colors active:scale-95 flex-shrink-0"
            style={{ width: 40, height: 22, background: rule.active ? theme.primary : theme.border }}
            aria-label={rule.active ? 'Pause rule' : 'Enable rule'}
          >
            <span
              className="absolute rounded-full bg-white"
              style={{
                top: 3,
                left: 3,
                width: 16,
                height: 16,
                transform: rule.active ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}
            />
          </button>

          <button
            onClick={onEdit}
            className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: theme.surface, color: theme.secondary }}
            aria-label={`Edit ${rule.note || 'rule'}`}
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={onDelete}
            className="action-btn w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: theme.dangerSurface, color: '#ef4444' }}
            aria-label={`Delete ${rule.note || 'rule'}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </li>
  )
}

export default function RecurringManager({ rules, categories, onChange }) {
  const { theme } = useTheme()
  const [editingRule, setEditingRule] = useState(null)
  const [addingNew, setAddingNew]     = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function handleSave(ruleData) {
    if (editingRule) {
      onChange(rules.map(r =>
        r.id === editingRule.id
          ? { ...editingRule, ...ruleData, updatedAt: new Date().toISOString() }
          : r
      ))
    } else {
      onChange([...rules, {
        ...ruleData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
    }
    setEditingRule(null)
    setAddingNew(false)
  }

  function handleDelete(id) {
    onChange(rules.filter(r => r.id !== id))
    setConfirmDeleteId(null)
  }

  function handleToggle(id) {
    onChange(rules.map(r =>
      r.id === id ? { ...r, active: !r.active, updatedAt: new Date().toISOString() } : r
    ))
  }

  return (
    <>
      {/* Backdrop to close delete confirmation */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 51 }}
          onClick={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Section header */}
      <div className="px-6 pt-5 pb-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat size={13} color={theme.textFaint} />
            <p className="text-xs uppercase tracking-wide font-medium" style={{ color: theme.textFaint }}>
              Recurring Expenses
            </p>
          </div>
          <button
            onClick={() => { setEditingRule(null); setAddingNew(true) }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
            style={{
              borderRadius: 'var(--r-element)',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: '#ffffff',
            }}
            aria-label="Add recurring expense"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>

      {/* Rules list */}
      <ul className="px-6 pb-4 flex flex-col gap-2">
        {rules.length === 0 ? (
          <li
            className="flex flex-col items-center justify-center py-8 rounded-2xl"
            style={{ background: theme.inputBg }}
          >
            <Repeat size={28} style={{ color: theme.textFaint, marginBottom: 8 }} />
            <p className="text-sm font-medium" style={{ color: theme.textFaint }}>
              No recurring expenses yet
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textFaint, opacity: 0.7 }}>
              Add subscriptions, rent, EMIs — set once, forget forever
            </p>
          </li>
        ) : (
          rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              categories={categories}
              onToggle={() => handleToggle(rule.id)}
              onEdit={() => { setConfirmDeleteId(null); setEditingRule(rule) }}
              onDelete={() => setConfirmDeleteId(rule.id)}
              confirmDeleting={confirmDeleteId === rule.id}
              onConfirmDelete={() => handleDelete(rule.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))
        )}
      </ul>

      {/* Add / edit modal */}
      {(addingNew || editingRule) && (
        <AddRecurringModal
          categories={categories}
          editRule={editingRule}
          onSave={handleSave}
          onClose={() => { setAddingNew(false); setEditingRule(null) }}
        />
      )}
    </>
  )
}
