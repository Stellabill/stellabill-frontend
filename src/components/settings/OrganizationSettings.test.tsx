import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { organization, type Organization, type OrganizationAvatar, type AvatarUploadOptions } from '@/api/client'
import OrganizationSettings from './OrganizationSettings'

const initial: Organization = {
  id: 'org-1', name: 'Northstar Studio', domain: 'northstar.example', email: 'ops@northstar.example',
  timezone: 'UTC', currency: 'USD', language: 'en-US', avatarUrl: '/avatars/original.png',
  members: [{ id: 'member-1', name: 'Riley Chen', email: 'riley@northstar.example', role: 'admin', joinedAt: '2025-01-15' }],
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
let stored: Organization
let wasDeleted: boolean
const fetchMock = vi.fn<typeof fetch>()
const createPreview = vi.fn(() => 'blob:organization-preview')
const revokePreview = vi.fn()

beforeEach(() => {
  stored = structuredClone(initial)
  wasDeleted = false
  fetchMock.mockReset().mockImplementation(async (url, options) => {
    const method = options?.method ?? 'GET'
    if (url === '/api/organization/avatar' && method === 'DELETE') {
      stored.avatarUrl = null
      return new Response(null, { status: 204 })
    }
    if (url !== '/api/organization') return json({}, 404)
    if (method === 'PUT') stored = { ...stored, ...JSON.parse(String(options?.body)) }
    if (method === 'DELETE') {
      wasDeleted = true
      return new Response(null, { status: 204 })
    }
    return json(stored)
  })
  vi.stubGlobal('fetch', fetchMock)
  createPreview.mockClear()
  revokePreview.mockClear()
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createPreview
    static revokeObjectURL = revokePreview
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const loaded = () => screen.findByRole('button', { name: /^edit$/i })
const nameField = () => screen.getByLabelText(/^organization name$/i)
const emailField = () => screen.getByLabelText(/^contact email$/i)
const file = () => new File(['avatar'], 'logo.png', { type: 'image/png' })
const mutations = (method: string) => fetchMock.mock.calls.filter(([, options]) => options?.method === method)

async function openDelete() {
  await userEvent.click(screen.getByRole('button', { name: /delete organization/i }))
  return screen.getByRole('alertdialog')
}

describe('OrganizationSettings API persistence', () => {
  it('loads server profile and members before allowing edits', async () => {
    const pending = deferred<Response>()
    fetchMock.mockReturnValueOnce(pending.promise)
    render(<OrganizationSettings />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading organization')
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
    await act(async () => pending.resolve(json(stored)))
    await loaded()
    expect(nameField()).toHaveValue(initial.name)
    for (const label of [/^organization name$/i, /^domain$/i, /^contact email$/i, /^timezone$/i, /^currency$/i, /^language$/i]) {
      expect(screen.getByLabelText(label)).toBeDisabled()
    }
    expect(screen.getByText('Riley Chen')).toBeInTheDocument()
    expect(screen.getByText('riley@northstar.example')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText(/Joined /)).toBeInTheDocument()
  }, 15000)

  it('shows load failure and retries the API', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 500))
    render(<OrganizationSettings />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load organization')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await loaded()
    expect(nameField()).toHaveValue(initial.name)
  }, 15000)

  it('saves all profile fields and reloads the persisted profile and member list', async () => {
    const user = userEvent.setup()
    const view = render(<OrganizationSettings />)
    await user.click(await loaded())
    fireEvent.change(nameField(), { target: { value: '  Stellar Labs  ' } })
    fireEvent.change(emailField(), { target: { value: 'billing@stellar.example' } })
    const domain = screen.getByLabelText(/^domain$/i)
    fireEvent.change(domain, { target: { value: 'stellar.example' } })
    await user.selectOptions(screen.getByLabelText(/^timezone$/i), 'Europe/London')
    await user.selectOptions(screen.getByLabelText(/^currency$/i), 'EUR')
    await user.selectOptions(screen.getByLabelText(/^language$/i), 'en-GB')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByText('Organization saved.')).toBeInTheDocument()
    expect(nameField()).toBeDisabled()
    expect(stored).toMatchObject({ name: 'Stellar Labs', domain: 'stellar.example', email: 'billing@stellar.example', timezone: 'Europe/London', currency: 'EUR', language: 'en-GB' })
    expect(JSON.parse(String(mutations('PUT')[0][1]?.body))).not.toHaveProperty('members')
    view.unmount()
    render(<OrganizationSettings />); await loaded()
    expect(nameField()).toHaveValue('Stellar Labs')
    expect(emailField()).toHaveValue('billing@stellar.example')
    expect(screen.getByText('Riley Chen')).toBeInTheDocument()
  }, 15000)

  it('rejects blank names and invalid emails inline without sending a save', async () => {
    const user = userEvent.setup()
    render(<OrganizationSettings />); await user.click(await loaded())
    fireEvent.change(nameField(), { target: { value: '   ' } })
    fireEvent.change(emailField(), { target: { value: 'invalid-email' } })
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(nameField()).toHaveAttribute('aria-invalid', 'true')
    expect(emailField()).toHaveAttribute('aria-invalid', 'true')
    expect(nameField()).toHaveAccessibleDescription('Organization name is required.')
    expect(emailField()).toHaveAccessibleDescription('Enter a valid contact email.')
    expect(mutations('PUT')).toHaveLength(0)
  }, 15000)

  it('keeps edits after a save failure and restores the saved fields on Cancel', async () => {
    const user = userEvent.setup()
    render(<OrganizationSettings />); await user.click(await loaded())
    await user.clear(nameField()); await user.type(nameField(), 'Draft name')
    fetchMock.mockResolvedValueOnce(json({}, 500))
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save organization')
    expect(nameField()).toHaveValue('Draft name')
    expect(nameField()).toBeEnabled()
    await user.click(screen.getAllByRole('button', { name: /^cancel$/i })[0])
    expect(nameField()).toHaveValue(initial.name)
    expect(nameField()).toBeDisabled()
  }, 15000)

  it('requires the saved organization name and explicit confirmation, and waits for deletion', async () => {
    render(<OrganizationSettings />); await loaded()
    let dialog = await openDelete()
    await userEvent.type(within(dialog).getByPlaceholderText(initial.name), 'DELETE')
    expect(within(dialog).getByRole('button', { name: /^delete organization$/i })).toBeDisabled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(mutations('DELETE')).toHaveLength(0)
    dialog = await openDelete()
    const pending = deferred<Response>()
    fetchMock.mockReturnValueOnce(pending.promise)
    await userEvent.type(within(dialog).getByPlaceholderText(initial.name), initial.name)
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete organization$/i }))
    expect(within(dialog).getByRole('button', { name: 'Deleting...' })).toBeDisabled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await act(async () => pending.resolve(new Response(null, { status: 204 })))
    expect(await screen.findByRole('status')).toHaveTextContent('Organization deleted.')
    expect(screen.queryByLabelText(/^organization name$/i)).not.toBeInTheDocument()
  }, 15000)

  it('keeps a failed deletion open for retry and sends exactly one successful deletion', async () => {
    render(<OrganizationSettings />); await loaded()
    const dialog = await openDelete()
    await userEvent.type(within(dialog).getByPlaceholderText(initial.name), initial.name)
    fetchMock.mockResolvedValueOnce(json({}, 500))
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete organization$/i }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Unable to delete organization')
    await userEvent.click(within(dialog).getByRole('button', { name: /^delete organization$/i }))
    expect(await screen.findByRole('status')).toHaveTextContent('Organization deleted.')
    expect(wasDeleted).toBe(true)
    expect(mutations('DELETE')).toHaveLength(2)
  }, 15000)

  it('uses the saved name for confirmation even while a new name is unsaved', async () => {
    render(<OrganizationSettings />); await userEvent.click(await loaded())
    await userEvent.clear(nameField()); await userEvent.type(nameField(), 'Unsaved name')
    const dialog = await openDelete()
    expect(within(dialog).getByPlaceholderText(initial.name)).toBeInTheDocument()
  }, 15000)

  it('shows real upload progress, disables concurrent actions and releases the preview on success', async () => {
    const pending = deferred<OrganizationAvatar>()
    vi.spyOn(organization, 'uploadAvatar').mockImplementation((_file, options) => {
      options?.onProgress?.(42)
      return pending.promise
    })
    const view = render(<OrganizationSettings />); await loaded()
    await userEvent.upload(screen.getByTestId('avatar-uploader-input'), file())
    expect(screen.getByRole('progressbar')).toHaveValue(42)
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeDisabled()
    expect(screen.getByTestId('avatar-uploader-input')).toBeDisabled()
    fireEvent.drop(screen.getByTestId('avatar-uploader-area'), { dataTransfer: { files: [file()] } })
    expect(organization.uploadAvatar).toHaveBeenCalledTimes(1)
    stored.avatarUrl = '/avatars/uploaded.png'
    await act(async () => pending.resolve({ avatarUrl: stored.avatarUrl! }))
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())
    expect(screen.getByRole('img', { name: initial.name + ' avatar' })).toHaveAttribute('src', '/avatars/uploaded.png')
    expect(revokePreview).toHaveBeenCalledExactlyOnceWith('blob:organization-preview')
    expect(revokePreview).not.toHaveBeenCalledWith(initial.avatarUrl)
    view.unmount(); render(<OrganizationSettings />); await loaded()
    expect(screen.getByRole('img', { name: initial.name + ' avatar' })).toHaveAttribute('src', '/avatars/uploaded.png')
  }, 15000)

  it('restores the persisted avatar and releases the preview after upload failure', async () => {
    vi.spyOn(organization, 'uploadAvatar').mockRejectedValue(new Error('network'))
    render(<OrganizationSettings />); await loaded()
    await userEvent.upload(screen.getByTestId('avatar-uploader-input'), file())
    expect(await screen.findByRole('alert')).toHaveTextContent('Avatar upload failed')
    expect(screen.getByRole('img', { name: initial.name + ' avatar' })).toHaveAttribute('src', initial.avatarUrl)
    expect(revokePreview).toHaveBeenCalledExactlyOnceWith('blob:organization-preview')
    expect(screen.getByTestId('avatar-uploader-input')).toBeEnabled()
  }, 15000)

  it('aborts an upload and releases its preview on unmount', async () => {
    const pending = deferred<OrganizationAvatar>()
    let options: AvatarUploadOptions | undefined
    vi.spyOn(organization, 'uploadAvatar').mockImplementation((_file, received) => { options = received; return pending.promise })
    const view = render(<OrganizationSettings />); await loaded()
    await userEvent.upload(screen.getByTestId('avatar-uploader-input'), file())
    view.unmount()
    expect(options?.signal?.aborted).toBe(true)
    expect(revokePreview).toHaveBeenCalledExactlyOnceWith('blob:organization-preview')
    await act(async () => pending.resolve({ avatarUrl: '/avatars/uploaded.png' }))
    expect(revokePreview).toHaveBeenCalledTimes(1)
  }, 15000)

  it('persists avatar removal across reload and retains the avatar on removal failure', async () => {
    const view = render(<OrganizationSettings />); await loaded()
    fetchMock.mockResolvedValueOnce(json({}, 500))
    await userEvent.click(screen.getByRole('button', { name: 'Remove avatar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to remove avatar')
    expect(screen.getByRole('img', { name: initial.name + ' avatar' })).toHaveAttribute('src', initial.avatarUrl)
    await userEvent.click(screen.getByRole('button', { name: 'Remove avatar' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove avatar' })).not.toBeInTheDocument())
    view.unmount(); render(<OrganizationSettings />); await loaded()
    expect(screen.queryByRole('button', { name: 'Remove avatar' })).not.toBeInTheDocument()
    expect(stored.avatarUrl).toBeNull()
    expect(revokePreview).not.toHaveBeenCalled()
  }, 15000)

  it('rejects oversized images before starting an upload or allocating a preview', async () => {
    const upload = vi.spyOn(organization, 'uploadAvatar')
    render(<OrganizationSettings />); await loaded()
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
    await userEvent.upload(screen.getByTestId('avatar-uploader-input'), oversized)
    expect(await screen.findByRole('alert')).toHaveTextContent('File too large')
    expect(upload).not.toHaveBeenCalled()
    expect(createPreview).not.toHaveBeenCalled()
  }, 15000)
})
