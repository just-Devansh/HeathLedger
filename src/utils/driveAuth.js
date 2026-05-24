// Google Drive OAuth via Google Identity Services (GIS) token model.
// No backend required — access tokens obtained client-side.
// Scope: drive.appdata (private app folder only, invisible to user in Drive UI).

import { db } from './db'

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
export const DRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

// Returns a Promise resolving with the GIS token response.
// prompt='select_account' → interactive popup
// prompt='none'           → silent (no popup; rejects if auth required)
export function requestToken(prompt = 'select_account') {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google services not loaded. Please refresh the page.'))
      return
    }
    if (!DRIVE_CLIENT_ID) {
      reject(new Error('not-configured'))
      return
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: DRIVE_CLIENT_ID,
      scope: SCOPES,
      callback: response => {
        if (response.error) {
          reject(new Error(response.error === 'access_denied' ? 'cancelled' : (response.error_description || response.error)))
        } else {
          resolve(response)
        }
      },
      error_callback: err => {
        reject(typeof err === 'object' && err?.type === 'popup_closed' ? new Error('cancelled') : (err instanceof Error ? err : new Error(String(err))))
      },
    })
    client.requestAccessToken({ prompt })
  })
}

// ── Stored token ──────────────────────────────────────────────────────────────

export async function getStoredToken() {
  const row = await db.settings.get('driveToken')
  return row?.value ?? null
}

export async function storeToken(response) {
  const expiresAt = Date.now() + ((response.expires_in ?? 3600) * 1000) - 60_000
  await db.settings.put({ key: 'driveToken', value: { access_token: response.access_token, expiresAt } })
}

export async function clearDriveData() {
  await Promise.all([
    db.settings.delete('driveToken'),
    db.settings.delete('driveEnabled'),
    db.settings.delete('driveLastBackup'),
  ])
}

export function isTokenValid(token) {
  return !!(token?.access_token && Date.now() < (token.expiresAt ?? 0))
}

// ── Drive settings ─────────────────────────────────────────────────────────────

export async function setDriveEnabled(enabled) {
  await db.settings.put({ key: 'driveEnabled', value: enabled })
}

export async function getDriveEnabled() {
  const row = await db.settings.get('driveEnabled')
  return !!row?.value
}

export async function getLastBackupTime() {
  const row = await db.settings.get('driveLastBackup')
  return row?.value ?? null
}

export async function recordBackupTime() {
  await db.settings.put({ key: 'driveLastBackup', value: new Date().toISOString() })
}
