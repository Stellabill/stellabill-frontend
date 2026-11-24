import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingHeader from './LandingHeader'
import { useWallet, type WalletContextValue } from '../../wallet/WalletContext'

vi.mock('../../wallet/WalletContext', () => ({
  useWallet: vi.fn(),
}))

vi.mock('../ConnectButton', () => ({
  default: () => <button type="button" data-testid="connect-button">Connect wallet</button>,
}))

vi.mock('../WalletPill', () => ({
  default: ({ address, onDisconnect }: { address: string; onDisconnect: () => void }) => (
    <div data-testid="wallet-pill">
      <span>{address}</span>
      <button type="button" onClick={onDisconnect}>
        Disconnect
      </button>
    </div>
  ),
}))

const mockedUseWallet = vi.mocked(useWallet)

const createWalletState = (
  overrides: Partial<WalletContextValue> = {}
): WalletContextValue => ({
  status: 'disconnected',
  address: null,
  network: null,
  error: null,
  connect: vi.fn(),
  signTransaction: vi.fn(),
  clearError: vi.fn(),
  cancelConnect: vi.fn(),
  disconnect: vi.fn(),
  ...overrides,
})

describe('LandingHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseWallet.mockReturnValue(createWalletState())
  })

  it('renders the logo anchor linking to / with Stellabill text', () => {
    render(<LandingHeader />)

    const logoLink = screen.getByRole('link', { name: /stellabill/i })
    expect(logoLink).toHaveAttribute('href', '/')
    expect(logoLink).toHaveTextContent('Stellabill')
  })

  it('renders the navigation anchors with expected labels and hrefs', () => {
    render(<LandingHeader />)

    const nav = screen.getByRole('navigation')
    const expectedLinks = [
      { label: 'Product', href: '#product' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'My Subscriptions', href: '#subscriptions' },
      { label: 'Docs', href: '#docs' },
      { label: 'Contact', href: '#contact' },
    ]

    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(expectedLinks.length)

    for (const { label, href } of expectedLinks) {
      const link = within(nav).getByRole('link', { name: label })
      expect(link).toHaveAttribute('href', href)
    }
  })

  it('renders the Subscribe with USDC text', () => {
    render(<LandingHeader />)

    expect(screen.getByText('Subscribe with USDC')).toBeInTheDocument()
  })

  it('renders ConnectButton and no WalletPill when wallet is disconnected', () => {
    mockedUseWallet.mockReturnValue(createWalletState({ status: 'disconnected', address: null }))

    render(<LandingHeader />)

    expect(screen.getByTestId('connect-button')).toBeInTheDocument()
    expect(screen.queryByTestId('wallet-pill')).not.toBeInTheDocument()
  })

  it('renders WalletPill with address and calls disconnect onDisconnect when wallet is connected', async () => {
    const user = userEvent.setup()
    const disconnect = vi.fn()
    const address = 'GABC1234567890XYZ9'

    mockedUseWallet.mockReturnValue(
      createWalletState({
        status: 'connected',
        address,
        disconnect,
      })
    )

    render(<LandingHeader />)

    expect(screen.queryByTestId('connect-button')).not.toBeInTheDocument()

    const pill = screen.getByTestId('wallet-pill')
    expect(pill).toHaveTextContent(address)

    await user.click(within(pill).getByRole('button', { name: /disconnect/i }))
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('falls back to an empty string address in WalletPill when connected with null address', () => {
    mockedUseWallet.mockReturnValue(
      createWalletState({
        status: 'connected',
        address: null,
      })
    )

    render(<LandingHeader />)

    const pill = screen.getByTestId('wallet-pill')
    expect(pill).toBeInTheDocument()
    expect(screen.queryByTestId('connect-button')).not.toBeInTheDocument()
  })
})
