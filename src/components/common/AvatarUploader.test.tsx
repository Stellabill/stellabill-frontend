import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvatarUploader } from './AvatarUploader'

function makeFile(name = 'avatar.png', type = 'image/png', sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('AvatarUploader', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls onUpload with a valid image and clears the input value', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn()
    const file = makeFile()
    render(<AvatarUploader name="Acme Corporation" onUpload={onUpload} />)
    const input = screen.getByTestId('avatar-uploader-input') as HTMLInputElement

    await user.upload(input, file)

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1)
      expect(onUpload).toHaveBeenCalledWith(file)
      expect(input).toHaveValue('')
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an image type error without calling onUpload for a non-image file', async () => {
    const onUpload = vi.fn()
    const file = makeFile('notes.txt', 'text/plain')
    render(<AvatarUploader name="Acme Corporation" onUpload={onUpload} />)
    const input = screen.getByTestId('avatar-uploader-input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please upload an image (png, jpeg, webp).',
    )
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows the configured size limit for an oversized image', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn()
    const maxSizeBytes = 2 * 1024 * 1024
    const file = makeFile('large.png', 'image/png', maxSizeBytes + 1)
    render(
      <AvatarUploader
        name="Acme Corporation"
        onUpload={onUpload}
        maxSizeBytes={maxSizeBytes}
      />,
    )
    const input = screen.getByTestId('avatar-uploader-input') as HTMLInputElement

    await user.upload(input, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'File too large. Maximum size is 2 MB.',
    )
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows an error when the upload handler rejects', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn().mockRejectedValue(new Error('Network error'))
    const file = makeFile()
    render(<AvatarUploader name="Acme Corporation" onUpload={onUpload} />)
    const input = screen.getByTestId('avatar-uploader-input') as HTMLInputElement

    await user.upload(input, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Upload failed. Please try again.',
    )
    expect(onUpload).toHaveBeenCalledWith(file)
    expect(input).toHaveValue('')
  })

  it('opens the file chooser when the change overlay is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<AvatarUploader name="Acme Corporation" />)
    const input = screen.getByTestId('avatar-uploader-input') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    const overlay = container.querySelector('.avatar-uploader__overlay') as HTMLElement

    await user.click(overlay)

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('opens the file chooser when Enter or Space is pressed on the dropzone', async () => {
    const user = userEvent.setup()
    render(<AvatarUploader name="Acme Corporation" />)
    const input = screen.getByTestId('avatar-uploader-input') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    const dropzone = screen.getByTestId('avatar-uploader-area')

    dropzone.focus()
    await user.keyboard('{Enter}')
    expect(clickSpy).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(clickSpy).toHaveBeenCalledTimes(2)
  })

  it('shows drag styling on drag over and restores the change overlay on drag leave', () => {
    const { container } = render(<AvatarUploader name="Acme Corporation" />)
    const dropzone = screen.getByTestId('avatar-uploader-area')
    const changeOverlay = container.querySelector('.avatar-uploader__overlay')
    expect(changeOverlay).toBeInTheDocument()

    fireEvent.dragOver(dropzone)

    expect(container.querySelector('.avatar-uploader__overlay')).not.toBeInTheDocument()
    expect(dropzone.querySelector('svg')?.parentElement).toHaveStyle({
      background: 'rgba(34, 211, 238, 0.25)',
    })

    fireEvent.dragLeave(dropzone)

    expect(container.querySelector('.avatar-uploader__overlay')).toBeInTheDocument()
  })

  it('processes only the first file dropped on the dropzone', async () => {
    const onUpload = vi.fn()
    const firstFile = makeFile('first.png')
    const secondFile = makeFile('second.png')
    render(<AvatarUploader name="Acme Corporation" onUpload={onUpload} />)
    const dropzone = screen.getByTestId('avatar-uploader-area')

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [firstFile, secondFile] },
    })

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1))
    expect(onUpload).toHaveBeenCalledWith(firstFile)
  })

  it('calls onRemove when the remove button is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(
      <AvatarUploader
        name="Acme Corporation"
        currentSrc="https://example.com/avatar.png"
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove avatar' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
