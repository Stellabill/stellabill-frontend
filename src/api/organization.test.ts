import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { organization, type OrganizationProfile } from './client'

class MockXHR {
  static instances: MockXHR[] = []
  status = 200
  responseText = '{"avatarUrl":"/avatars/persisted.png"}'
  timeout = 0
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeout: (() => void) | null = null
  onabort: (() => void) | null = null
  open = vi.fn()
  send = vi.fn<(body: FormData) => void>()
  setRequestHeader = vi.fn()
  abort = vi.fn(() => this.onabort?.())
  constructor() { MockXHR.instances.push(this) }
}
const file = new File(['image'], 'avatar.png', { type: 'image/png' })
const lastXHR = () => MockXHR.instances[MockXHR.instances.length - 1]

beforeEach(() => { MockXHR.instances = []; vi.stubGlobal('XMLHttpRequest', MockXHR) })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('organization API contract', () => {
  it('loads and updates profile/member responses, deletes the organization and removes the avatar', async () => {
    const profile: OrganizationProfile = { name: 'Studio', email: 'ops@studio.example', domain: 'studio.example', currency: 'USD', language: 'en-US', timezone: 'UTC' }
    const record = { ...profile, id: 'org-1', avatarUrl: null, members: [] }
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(record), { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(record), { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await organization.get()).toEqual(record)
    expect(await organization.update(profile)).toEqual(record)
    await expect(organization.removeAvatar()).resolves.toBeUndefined()
    await expect(organization.delete()).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/organization', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/organization', expect.objectContaining({ method: 'PUT', body: JSON.stringify(profile) }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/organization/avatar', expect.objectContaining({ method: 'DELETE' }))
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/organization', expect.objectContaining({ method: 'DELETE' }))
  })

  it('sends the actual file as multipart data with real progress and no forced JSON content type', async () => {
    const progress = vi.fn()
    const controller = new AbortController()
    const pending = organization.uploadAvatar(file, { onProgress: progress, signal: controller.signal })
    const xhr = lastXHR()
    expect(xhr.open).toHaveBeenCalledWith('POST', '/api/organization/avatar')
    expect(xhr.timeout).toBe(15000)
    const body = xhr.send.mock.calls[0][0] as FormData
    expect(body.get('avatar')).toBe(file)
    expect(xhr.setRequestHeader).not.toHaveBeenCalled()
    xhr.upload.onprogress?.({ lengthComputable: false } as ProgressEvent)
    expect(progress).not.toHaveBeenCalled()
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 2, total: 5 } as ProgressEvent)
    expect(progress).toHaveBeenCalledWith(40)
    xhr.onload?.()
    await expect(pending).resolves.toEqual({ avatarUrl: '/avatars/persisted.png' })
    controller.abort()
    expect(xhr.abort).not.toHaveBeenCalled()
  })

  it.each([
    ['HTTP failure', 'http', (xhr: MockXHR) => { xhr.status = 403; xhr.onload?.() }],
    ['network failure', 'network', (xhr: MockXHR) => xhr.onerror?.()],
    ['timeout', 'timeout', (xhr: MockXHR) => xhr.ontimeout?.()],
    ['invalid JSON', 'parse', (xhr: MockXHR) => { xhr.responseText = 'broken'; xhr.onload?.() }],
    ['missing URL', 'parse', (xhr: MockXHR) => { xhr.responseText = '{}'; xhr.onload?.() }],
    ['temporary URL', 'parse', (xhr: MockXHR) => { xhr.responseText = '{"avatarUrl":"blob:temporary"}'; xhr.onload?.() }],
  ])('rejects %s without retrying the upload', async (_label, kind, finish) => {
    const pending = organization.uploadAvatar(file)
    const rejected = expect(pending).rejects.toMatchObject({ kind })
    finish(lastXHR())
    await rejected
    expect(MockXHR.instances).toHaveLength(1)
    expect(lastXHR().send).toHaveBeenCalledTimes(1)
  })

  it('cancels an in-flight request and removes the abort listener', async () => {
    const controller = new AbortController()
    const remove = vi.spyOn(controller.signal, 'removeEventListener')
    const pending = organization.uploadAvatar(file, { signal: controller.signal, timeoutMs: 2500 })
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(lastXHR().timeout).toBe(2500)
    controller.abort()
    await rejected
    expect(lastXHR().abort).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  })

  it('does not start an already-cancelled request', async () => {
    const controller = new AbortController(); controller.abort()
    await expect(organization.uploadAvatar(file, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(MockXHR.instances).toHaveLength(0)
  })
})
