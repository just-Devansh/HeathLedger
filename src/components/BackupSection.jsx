import { useState, useRef } from 'react'
import { Download, Upload, Shield } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { exportBackup, validateBackup, applyBackup } from '../utils/storage'

export default function BackupSection({ onRestoreComplete }) {
  const { theme } = useTheme()
  const fileInputRef = useRef(null)
  const [pendingData, setPendingData] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', error: false })

  function showToast(message, error = false) {
    setToast({ visible: true, message, error })
    setTimeout(() => setToast({ visible: false, message: '', error: false }), 2500)
  }

  function handleExport() {
    try {
      const json = exportBackup()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const today = new Date().toISOString().split('T')[0]
      const a = document.createElement('a')
      a.href = url
      a.download = `heath-ledger-backup-${today}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Backup exported.')
    } catch {
      showToast('Could not export backup.', true)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        if (!text?.trim()) throw new Error()
        const data = JSON.parse(text)
        validateBackup(data)
        setPendingData(data)
      } catch {
        showToast('Invalid backup file.', true)
      }
    }
    reader.onerror = () => showToast('Invalid backup file.', true)
    reader.readAsText(file)
  }

  function handleConfirmRestore() {
    try {
      applyBackup(pendingData)
      onRestoreComplete(pendingData)
      setPendingData(null)
    } catch {
      setPendingData(null)
      showToast('Could not restore backup.', true)
    }
  }

  return (
    <div
      className="px-6 pt-5 pb-8"
      style={{ borderTop: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield size={13} color={theme.textFaint} />
        <p className="text-xs uppercase tracking-wide font-medium" style={{ color: theme.textFaint }}>
          Data & Backup
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.07)`,
        }}
      >
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-4 px-5 py-4 transition-opacity active:opacity-60"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <span
            className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: theme.surface }}
          >
            <Download size={18} color={theme.primary} />
          </span>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Export Backup</p>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Download all data as JSON</p>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-4 px-5 py-4 transition-opacity active:opacity-60"
        >
          <span
            className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: theme.surface }}
          >
            <Upload size={18} color={theme.primary} />
          </span>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Import Backup</p>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Restore from a backup file</p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Confirm restore modal */}
      {pendingData && (
        <div
          className="fixed inset-0 flex items-end justify-center z-[60] px-4 pb-8"
          style={{ background: theme.modalBg }}
          onClick={e => { if (e.target === e.currentTarget) setPendingData(null) }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              background: theme.cardBg,
              boxShadow: `0 -4px 48px rgba(${theme.shadowRgb},0.28), 0 0 0 1px ${theme.border}`,
            }}
          >
            <p className="text-lg font-bold mb-1.5" style={{ color: theme.heading }}>
              Restore backup?
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: theme.textMuted }}>
              This will replace your current app data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingData(null)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-opacity active:opacity-70"
                style={{ background: theme.inputBg, color: theme.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-70"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  boxShadow: `0 4px 16px rgba(${theme.shadowRgb},0.35)`,
                }}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local toast for export/import feedback */}
      {toast.visible && (
        <div
          className="fixed left-0 right-0 flex justify-center pointer-events-none"
          style={{ bottom: 40, zIndex: 65 }}
        >
          <div
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white toast-slide-up"
            style={{
              background: toast.error
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
              boxShadow: toast.error
                ? '0 4px 20px rgba(239,68,68,0.45)'
                : `0 4px 20px rgba(${theme.shadowRgb},0.45)`,
            }}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
