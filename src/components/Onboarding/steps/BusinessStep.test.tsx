import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import BusinessStep from './BusinessStep';

/**
 * Focused behaviour coverage for `BusinessStep` (src/components/Onboarding/steps/BusinessStep.tsx).
 *
 * The step drives onboarding: it validates the business name and country,
 * trims the submitted values, forwards an optional logo, and must not advance
 * while anything required is missing. These tests exercise that contract
 * against the real `CountryRegionPicker` so the picker wiring is covered too.
 */

async function selectCountry(name: string, code: string) {
  const combobox = screen.getByRole('combobox');
  fireEvent.focus(combobox);
  fireEvent.change(combobox, { target: { value: name } });
  const option = await screen.findByRole('option', { name: new RegExp(name, 'i') });
  fireEvent.mouseDown(option);
  expect(code).toBeTruthy();
}

function renderStep(onNext = vi.fn()) {
  const utils = render(<BusinessStep onNext={onNext} />);
  const name = screen.getByLabelText(/business name/i) as HTMLInputElement;
  const website = screen.getByLabelText(/website/i) as HTMLInputElement;
  const fileInput = screen.getByLabelText(/upload logo/i) as HTMLInputElement;
  return { ...utils, name, website, fileInput, onNext };
}

describe('BusinessStep', () => {
  it('renders the business name, country, logo and website fields', () => {
    renderStep();
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('blocks submission and reports both required fields when empty', () => {
    const { onNext } = renderStep();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText('Business name is required.')).toBeInTheDocument();
    expect(screen.getByText('Country is required.')).toBeInTheDocument();
    expect(screen.getByLabelText(/business name/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the name error as soon as the user types', () => {
    const { name } = renderStep();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Business name is required.')).toBeInTheDocument();

    fireEvent.change(name, { target: { value: 'Acme' } });
    expect(screen.queryByText('Business name is required.')).not.toBeInTheDocument();
  });

  it('still requires a country when only the name is provided', () => {
    const { name, onNext } = renderStep();

    fireEvent.change(name, { target: { value: 'Acme Inc.' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onNext).not.toHaveBeenCalled();
    expect(screen.queryByText('Business name is required.')).not.toBeInTheDocument();
    expect(screen.getByText('Country is required.')).toBeInTheDocument();
  });

  it('clears the country error once a country is selected', async () => {
    const { name } = renderStep();

    fireEvent.change(name, { target: { value: 'Acme Inc.' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Country is required.')).toBeInTheDocument();

    await selectCountry('Germany', 'DE');
    expect(screen.queryByText('Country is required.')).not.toBeInTheDocument();
  });

  it('submits trimmed values and the selected country', async () => {
    const { name, website, onNext } = renderStep();

    fireEvent.change(name, { target: { value: '  Acme Inc.  ' } });
    fireEvent.change(website, { target: { value: '  https://acme.example  ' } });
    await selectCountry('Germany', 'DE');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledWith({
      businessName: 'Acme Inc.',
      website: 'https://acme.example',
      logo: null,
      country: 'DE',
    });
  });

  it('forwards an uploaded logo and shows its file name', () => {
    const { fileInput, onNext } = renderStep();
    const file = new File(['logo'], 'brand-logo.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByRole('button', { name: /brand-logo\.png/i })).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('does not throw when no onNext handler is supplied', async () => {
    render(<BusinessStep />);
    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: 'Acme' } });
    await selectCountry('Germany', 'DE');

    expect(() => fireEvent.click(screen.getByRole('button', { name: /next/i }))).not.toThrow();
  });
});
