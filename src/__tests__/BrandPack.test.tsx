import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BrandPack from '../pages/BrandPack';

class MockImage {
  width = 1024;
  height = 1024;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

describe('BrandPack uploader', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-image'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('Image', MockImage as unknown as typeof Image);
    vi.stubGlobal('document', document);
  });

  it('renders the uploader guidance and preview tiles before selection', () => {
    render(<BrandPack />);

    expect(screen.getByText(/merchant brand asset uploader/i)).toBeInTheDocument();
    expect(screen.getByText(/transparent png or svg/i)).toBeInTheDocument();
    expect(screen.getByText(/header/i)).toBeInTheDocument();
    expect(screen.getByText(/receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/social share/i)).toBeInTheDocument();
  });

  it('shows the crop stage and preview tiles after a valid png upload', async () => {
    render(<BrandPack />);
    const input = screen.getByTestId('brandpack-file-input');
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'logo.png', { type: 'image/png' });

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/crop your logo/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/safe-area/i)).toBeInTheDocument();
    expect(screen.getByText(/preview tiles/i)).toBeInTheDocument();
  });

  it('shows an error for undersized png files', async () => {
    const mockImage = new MockImage();
    mockImage.width = 256;
    mockImage.height = 256;
    vi.stubGlobal('Image', class {
      width = 256;
      height = 256;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    } as unknown as typeof Image);

    render(<BrandPack />);
    const input = screen.getByTestId('brandpack-file-input');
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'small.png', { type: 'image/png' });

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/at least 512x512/i);
    });
  });
});
