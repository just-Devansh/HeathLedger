// Google Drive REST API helpers.
// All files stored in appDataFolder — hidden from user, app-private.

import { exportBackup } from './storage'
import { recordBackupTime } from './driveAuth'

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const FILENAME = 'heath-ledger-backup-latest.json'

async function driveRequest(url, method, accessToken, headers = {}, body = undefined) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...headers },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('auth_expired')
    throw new Error(`Drive ${res.status}: ${text.slice(0, 120)}`)
  }
  return res
}

function buildMultipart(metadata, content) {
  const boundary = 'hl_' + Math.random().toString(36).slice(2)
  const nl = '\r\n'
  const body =
    `--${boundary}${nl}Content-Type: application/json; charset=UTF-8${nl}${nl}` +
    `${JSON.stringify(metadata)}${nl}` +
    `--${boundary}${nl}Content-Type: application/json${nl}${nl}` +
    `${content}${nl}` +
    `--${boundary}--`
  return { body, contentType: `multipart/related; boundary=${boundary}` }
}

async function findFileId(accessToken) {
  const res = await driveRequest(
    `${API}/files?spaces=appDataFolder&fields=files(id)&q=name%3D'${encodeURIComponent(FILENAME)}'`,
    'GET', accessToken,
  )
  const { files } = await res.json()
  return files?.[0]?.id ?? null
}

export async function uploadBackup(accessToken, jsonString) {
  const existingId = await findFileId(accessToken)

  if (existingId) {
    const { body, contentType } = buildMultipart({}, jsonString)
    await driveRequest(
      `${UPLOAD_API}/files/${existingId}?uploadType=multipart`,
      'PATCH', accessToken,
      { 'Content-Type': contentType },
      body,
    )
  } else {
    const { body, contentType } = buildMultipart(
      { name: FILENAME, parents: ['appDataFolder'] },
      jsonString,
    )
    await driveRequest(
      `${UPLOAD_API}/files?uploadType=multipart`,
      'POST', accessToken,
      { 'Content-Type': contentType },
      body,
    )
  }

  await recordBackupTime()
}

export async function downloadLatestBackup(accessToken) {
  const fileId = await findFileId(accessToken)
  if (!fileId) throw new Error('No backup found in your Drive')
  const res = await driveRequest(`${API}/files/${fileId}?alt=media`, 'GET', accessToken)
  return res.text()
}

export async function performBackup(accessToken) {
  const json = await exportBackup()
  await uploadBackup(accessToken, json)
}
