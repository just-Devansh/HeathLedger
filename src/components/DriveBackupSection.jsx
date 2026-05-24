import { useState, useEffect } from 'react'
import { Cloud, CloudOff, RefreshCw, RotateCcw, Unlink } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import {
  requestToken,
  getStoredToken, storeToken, clearDriveData,
  isTokenValid,
  setDriveEnabled, getDriveEnabled,
  getLastBackupTime,
} from '../utils/driveAuth'
import { performBackup, downloadLatestBackup } from '../utils/driveBackup'
import { validateBackup, applyBackup } from '../utils/storage'

function relativeTime(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString()
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors active:scale-95 disabled:opacity-40"
      style={{ background: on ? 'var(--toggle-on)' : 'var(--border)' }}
      aria-label={on ? 'Disable Google Drive backup' : 'Enable Google Drive backup'}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
        style={{
          left: '2px',
          transform: on ? 'translateX(24px)' : 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      />
    </button>
  )
}

function ActionRow({ icon, title, subtitle, onClick, disabled, danger, last, spinning }) {
  const { theme } = useTheme()
  const iconColor = danger ? '#ef4444' : theme.primary
  const titleColor = danger ? '#ef4444' : theme.text

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-4 px-5 py-4 transition-opacity active:opacity-60 disabled:opacity-40"
      style={last ? {} : { borderBottom: `1px solid ${theme.border}` }}
    >
      <span
        className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: theme.surface }}
      >
        {spinning
          ? <RefreshCw size={18} color={iconColor} className="animate-spin" />
          : icon(iconColor)}
      </span>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold" style={{ color: titleColor }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{subtitle}</p>
      </div>
    </button>
  )
}

export default function DriveBackupSection({ onRestoreComplete }) {
  const { theme } = useTheme()

  // Override --toggle-on CSS variable to use theme primary
  const toggleOnStyle = { '--toggle-on': theme.primary }

  const [initDone, setInitDone] = useState(false)
  const [enabled, setEnabled] = useState(false)
  // status: 'idle' | 'connected' | 'reconnect-needed'
  const [status, setStatus] = useState('idle')
  const [lastBackup, setLastBackup] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [backing, setBacking] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [confirmRestoreJson, setConfirmRestoreJson] = useState(null)
  const [inlineError, setInlineError] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', error: false })

  function showToast(message, isError = false) {
    setToast({ visible: true, message, error: isError })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }

  useEffect(() => {
    loadInitialState()
  }, []) // eslint-disable-line

  async function loadInitialState() {
    try {
      const [isEnabled, lastBt, token] = await Promise.all([
        getDriveEnabled(),
        getLastBackupTime(),
        getStoredToken(),
      ])
      setEnabled(isEnabled)
      setLastBackup(lastBt)
      if (isEnabled) {
        setStatus(isTokenValid(token) ? 'connected' : 'reconnect-needed')
      }
    } catch {
      // Non-critical
    } finally {
      setInitDone(true)
    }
  }

  async function runConnect(promptMode = 'select_account') {
    setConnecting(true)
    setInlineError(null)
    try {
      const response = await requestToken(promptMode)
      await storeToken(response)
      await setDriveEnabled(true)
      setEnabled(true)
      setBacking(true)
      await performBackup(response.access_token)
      const now = new Date().toISOString()
      setLastBackup(now)
      setStatus('connected')
      showToast('Connected to Drive')
    } catch (err) {
      const msg = err.message
      if (msg === 'not-configured') {
        setInlineError('Add VITE_GOOGLE_CLIENT_ID to your .env file to enable Drive backup.')
      } else if (msg !== 'cancelled') {
        setInlineError('Could not connect to Google Drive. Please try again.')
      }
      // On error, revert to previous state
      const enabled = await getDriveEnabled()
      setEnabled(enabled)
      const token = await getStoredToken()
      setStatus(enabled ? (isTokenValid(token) ? 'connected' : 'reconnect-needed') : 'idle')
    } finally {
      setConnecting(false)
      setBacking(false)
    }
  }

  async function handleToggle() {
    if (enabled) {
      await setDriveEnabled(false)
      setEnabled(false)
      setStatus('idle')
      setInlineError(null)
      return
    }
    // Enabling — reuse existing valid token if available
    const token = await getStoredToken()
    if (isTokenValid(token)) {
      await setDriveEnabled(true)
      setEnabled(true)
      setStatus('connected')
      return
    }
    await runConnect()
  }

  async function getValidToken() {
    const token = await getStoredToken()
    if (isTokenValid(token)) return token.access_token
    // Need re-auth
    const response = await requestToken('select_account')
    await storeToken(response)
    setStatus('connected')
    return response.access_token
  }

  async function handleBackupNow() {
    setBacking(true)
    setInlineError(null)
    try {
      const accessToken = await getValidToken()
      await performBackup(accessToken)
      const now = new Date().toISOString()
      setLastBackup(now)
      showToast('Backed up to Drive')
    } catch (err) {
      if (err.message === 'cancelled') return
      showToast('Backup failed. Check your connection.', true)
    } finally {
      setBacking(false)
    }
  }

  async function handleRestoreStart() {
    setRestoring(true)
    setInlineError(null)
    try {
      const accessToken = await getValidToken()
      const json = await downloadLatestBackup(accessToken)
      // Validate before showing confirmation
      const data = JSON.parse(json)
      validateBackup(data)
      setConfirmRestoreJson(json)
    } catch (err) {
      if (err.message === 'cancelled') { setRestoring(false); return }
      const isNotFound = err.message?.includes('No backup')
      showToast(isNotFound ? 'No backup found in your Drive.' : 'Could not download backup.', true)
    } finally {
      setRestoring(false)
    }
  }

  async function handleConfirmRestore() {
    setRestoring(true)
    try {
      const data = JSON.parse(confirmRestoreJson)
      const processed = await applyBackup(data)
      setConfirmRestoreJson(null)
      onRestoreComplete(processed)
    } catch {
      setConfirmRestoreJson(null)
      showToast('Could not restore backup.', true)
    } finally {
      setRestoring(false)
    }
  }

  async function handleDisconnect() {
    const token = await getStoredToken()
    if (token?.access_token && window.google?.accounts?.oauth2) {
      try { window.google.accounts.oauth2.revoke(token.access_token, () => {}) } catch { /* ok */ }
    }
    await clearDriveData()
    setEnabled(false)
    setStatus('idle')
    setLastBackup(null)
    setInlineError(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const cardStyle = {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.07)`,
  }

  const headerRow = (icon, title, subtitle, toggleEnabled, toggleDisabled) => (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={(status === 'connected' || status === 'reconnect-needed') ? { borderBottom: `1px solid ${theme.border}` } : {}}
    >
      <span
        className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: theme.surface }}
      >
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: theme.text }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{subtitle}</p>
      </div>
      <Toggle on={toggleEnabled} onChange={handleToggle} disabled={toggleDisabled} />
    </div>
  )

  if (!initDone) return null

  return (
    <div style={toggleOnStyle}>
      <div className="flex items-center gap-2 mb-3 mt-5">
        <Cloud size={13} color={theme.textFaint} />
        <p className="text-xs uppercase tracking-wide font-medium" style={{ color: theme.textFaint }}>
          Google Drive
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>

        {/* ── Idle (disabled) ───────────────────────────────────────────────── */}
        {!enabled && !connecting && (
          <>
            {headerRow(
              <CloudOff size={18} color={theme.textMuted} />,
              'Drive Backup',
              'Auto-save to your own Google Drive',
              false,
              false,
            )}
            {inlineError && (
              <div className="px-5 py-3" style={{ borderTop: `1px solid ${theme.border}`, background: 'rgba(239,68,68,0.06)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#ef4444' }}>{inlineError}</p>
              </div>
            )}
          </>
        )}

        {/* ── Connecting (OAuth flow in progress) ───────────────────────────── */}
        {connecting && (
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0" style={{ background: theme.surface }}>
              <RefreshCw size={18} color={theme.primary} className="animate-spin" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: theme.text }}>
                {backing ? 'Backing up…' : 'Connecting to Drive…'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                {backing ? 'Uploading your data' : 'Sign in to your Google account'}
              </p>
            </div>
          </div>
        )}

        {/* ── Connected ─────────────────────────────────────────────────────── */}
        {enabled && !connecting && status === 'connected' && (
          <>
            {headerRow(
              <Cloud size={18} color={theme.primary} />,
              'Drive Backup',
              backing
                ? 'Backing up…'
                : lastBackup
                  ? `Backed up ${relativeTime(lastBackup)}`
                  : 'Ready',
              true,
              false,
            )}

            <ActionRow
              icon={c => <RefreshCw size={18} color={c} />}
              title="Backup Now"
              subtitle="Upload a snapshot to Drive"
              onClick={handleBackupNow}
              disabled={backing || restoring}
              spinning={backing}
            />

            <ActionRow
              icon={c => <RotateCcw size={18} color={c} />}
              title="Restore from Drive"
              subtitle="Download your latest backup"
              onClick={handleRestoreStart}
              disabled={backing || restoring}
              spinning={restoring}
            />

            <ActionRow
              icon={c => <Unlink size={18} color={c} />}
              title="Disconnect Drive"
              subtitle="Remove backup access from this device"
              onClick={handleDisconnect}
              disabled={backing || restoring}
              danger
              last
            />
          </>
        )}

        {/* ── Reconnect needed (token expired) ──────────────────────────────── */}
        {enabled && !connecting && status === 'reconnect-needed' && (
          <>
            {headerRow(
              <Cloud size={18} color={theme.textMuted} />,
              'Drive Backup',
              'Session expired — reconnect to resume',
              true,
              false,
            )}

            <ActionRow
              icon={c => <RefreshCw size={18} color={c} />}
              title="Reconnect to Drive"
              subtitle="Re-authenticate and back up now"
              onClick={() => runConnect('select_account')}
              disabled={connecting}
            />

            <ActionRow
              icon={c => <Unlink size={18} color={c} />}
              title="Disconnect Drive"
              subtitle="Remove backup access from this device"
              onClick={handleDisconnect}
              danger
              last
            />
          </>
        )}

      </div>

      {/* ── Restore confirmation sheet ──────────────────────────────────────── */}
      {confirmRestoreJson && (
        <div
          className="fixed inset-0 flex items-end justify-center z-[60] px-4 pb-8"
          style={{ background: theme.modalBg }}
          onClick={e => { if (e.target === e.currentTarget && !restoring) setConfirmRestoreJson(null) }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              background: theme.cardBg,
              boxShadow: `0 -4px 48px rgba(${theme.shadowRgb},0.28), 0 0 0 1px ${theme.border}`,
            }}
          >
            <p className="text-lg font-bold mb-1.5" style={{ color: theme.heading }}>
              Restore from Drive?
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: theme.textMuted }}>
              This will replace your current app data with the Drive backup.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestoreJson(null)}
                disabled={restoring}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
                style={{ background: theme.inputBg, color: theme.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  boxShadow: `0 4px 16px rgba(${theme.shadowRgb},0.35)`,
                }}
              >
                {restoring ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────────── */}
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
