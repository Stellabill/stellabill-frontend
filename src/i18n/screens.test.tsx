import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from './config';
import { LOCALE_STORAGE_KEY } from './locales';
import LocaleSwitcher from '../components/LocaleSwitcher';
import Hero from '../components/Landing/Hero';
import FAQ from '../components/Landing/FAQ';
import KeyMetrics from '../components/Landing/KeyMetrics';
import Pricing from '../pages/Pricing';
import Subscriptions from '../pages/Subscriptions';
import { WalletProvider } from '../wallet/WalletContext';
import { subscriptions } from '../api/client';

// The navbar is outside this issue's screen-copy scope. Keep its real switcher;
// wallet/navigation behavior has its own tests.
vi.mock('../components/LandingNavbar', () => ({ default: () => <LocaleSwitcher /> }));
vi.mock('../hooks/useFlip', () => ({
  useFlip: () => ({ containerRef: { current: null }, getItemProps: () => ({}) }),
}));

function chooseLanguage(search: string) {
  fireEvent.click(screen.getByRole('button', { name: /language:/i }));
  fireEvent.change(screen.getByRole('combobox', { name: /search languages/i }), {
    target: { value: search },
  });
  fireEvent.keyDown(screen.getByRole('combobox', { name: /search languages/i }), { key: 'Enter' });
}

describe('translated user-facing screens', () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en-US');
    window.history.replaceState(null, '', '/');
    await i18n.changeLanguage('en');
  });

  afterEach(async () => {
    cleanup();
    vi.mocked(subscriptions.list).mockRestore?.();
    await i18n.changeLanguage('en');
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('switches live Landing copy, rich headings, FAQ answers, and accessible labels', () => {
    render(<><LocaleSwitcher /><Hero /><FAQ /><KeyMetrics /></>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Recurring USDC Billing');
    chooseLanguage('es-ES');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Facturación recurrente en USDC');
    expect(screen.getByTestId('hero-primary-cta')).toHaveTextContent('Empieza a aceptar suscripciones');
    expect(screen.getByRole('group', { name: 'Acciones principales' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeInTheDocument();
    const question = screen.getByRole('button', { name: '¿Qué es el saldo de prepago?' });
    fireEvent.click(question);
    expect(screen.getByRole('region', { name: '¿Qué es el saldo de prepago?' })).toHaveTextContent('El saldo de prepago es un crédito');
    expect(screen.getByRole('region', { name: 'Indicadores clave de rendimiento' })).toHaveTextContent('Facturación de alta fiabilidad para SaaS de Web3');
    expect(screen.getByText('99,9 %')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es-ES');
    chooseLanguage('en-US');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Recurring USDC Billing');
  });

  it('translates Pricing plans, comparison cells, seat controls, plurals, and persisted selection', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'es-ES');
    render(<WalletProvider><MemoryRouter><Pricing /></MemoryRouter></WalletProvider>);
    expect(screen.getByRole('heading', { name: 'Planes y precios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empieza gratis' })).toBeInTheDocument();
    expect(screen.getByText('Más popular')).toBeInTheDocument();
    const comparison = screen.getByRole('region', { name: 'Tabla comparativa de funciones' });
    expect(within(comparison).getByRole('columnheader', { name: 'Empresas' })).toBeInTheDocument();
    expect(within(comparison).getByText('Básico')).toBeInTheDocument();
    expect(within(comparison).getAllByLabelText('Incluido').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('radio', { name: 'Por usuario' }));
    const seats = screen.getByRole('spinbutton', { name: 'Número de usuarios' });
    expect(screen.getByText('5 usuarios seleccionados')).toBeInTheDocument();
    expect(screen.getByText(/245.*mes en total por 5 usuarios/)).toBeInTheDocument();
    fireEvent.change(seats, { target: { value: '1' } });
    fireEvent.blur(seats);
    expect(screen.getByText('1 usuario seleccionado')).toBeInTheDocument();
    expect(screen.getByText(/49.*mes en total por 1 usuario/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar un usuario' })).toBeDisabled();
    chooseLanguage('en-US');
    expect(screen.getByRole('heading', { name: 'Plans & pricing' })).toBeInTheDocument();
    expect(screen.getByText('$49 / mo total for 1 seat')).toBeInTheDocument();
  });

  it('translates subscription headers while loading and after the sample rows load', async () => {
    await i18n.changeLanguage('es');
    let finishLoading!: (value: Awaited<ReturnType<typeof subscriptions.list>>) => void;
    vi.spyOn(subscriptions, 'list').mockReturnValue(new Promise((resolve) => { finishLoading = resolve; }));
    render(<MemoryRouter><Subscriptions /></MemoryRouter>);
    const loadingTable = screen.getByRole('table', { name: 'Cargando suscripciones' });
    expect(within(loadingTable).getByRole('columnheader', { name: 'Próximo cargo' })).toBeInTheDocument();
    await act(async () => {
      finishLoading({ subscriptions: [{
        id: 'translation-test', planName: 'Pro', merchantName: 'Demo', status: 'Active',
        price: 49, currency: 'USDC', interval: 'month', lastPayment: '2026-11-01',
        nextCharge: '2026-12-01', subscribedSince: '2026-11-01',
      }] });
    });
    const table = await screen.findByTestId('subscriptions-table');
    expect(within(table).getByRole('columnheader', { name: 'Etiquetas' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Saldo de prepago' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
  });
});
