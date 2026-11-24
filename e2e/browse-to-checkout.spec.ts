import { expect, test, type Page } from 'playwright/test';

const MOCK_WALLET_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

/**
 * Block external network calls and stub local `/api/subscriptions` so tests run
 * deterministically without any backend or external network dependency.
 */
async function setupDeterministicEnvironment(page: Page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      return route.abort();
    }
    if (url.pathname === '/api/subscriptions') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [
            {
              id: 'SUB-001',
              planName: 'Premium Access',
              merchantName: 'Stellar News',
              status: 'Active',
              price: 10,
              currency: 'USDC',
              interval: 'month',
              prepaidBalance: 50,
              nextCharge: 'Dec 23, 2026',
              lastPayment: 'Nov 23, 2026',
              subscribedSince: 'Nov 23, 2026',
            },
          ],
        }),
      });
    }
    return route.continue();
  });

  // Stub Freighter browser extension postMessage protocol so WalletContext can connect deterministically
  await page.addInitScript((walletAddress: string) => {
    (window as unknown as { freighter?: boolean }).freighter = true;
    window.addEventListener('message', (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'FREIGHTER_EXTERNAL_MSG_REQUEST') return;

      const respond = (payload: Record<string, unknown>) => {
        window.postMessage(
          {
            source: 'FREIGHTER_EXTERNAL_MSG_RESPONSE',
            messagedId: data.messageId,
            ...payload,
          },
          window.location.origin
        );
      };

      switch (data.type) {
        case 'REQUEST_CONNECTION_STATUS':
          respond({ isConnected: true });
          break;
        case 'REQUEST_ALLOWED_STATUS':
        case 'SET_ALLOWED_STATUS':
          respond({ isAllowed: true });
          break;
        case 'REQUEST_ACCESS':
        case 'REQUEST_PUBLIC_KEY':
          respond({ publicKey: walletAddress });
          break;
        case 'REQUEST_NETWORK':
          respond({ network: 'TESTNET' });
          break;
        case 'REQUEST_NETWORK_DETAILS':
          respond({
            networkDetails: {
              network: 'TESTNET',
              networkName: 'TESTNET',
              networkUrl: 'https://horizon-testnet.stellar.org',
              networkPassphrase: 'Test SDF Network ; September 2015',
            },
          });
          break;
      }
    });
  }, MOCK_WALLET_ADDRESS);
}

test.describe('Browse plans to checkout journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupDeterministicEnvironment(page);
  });

  test('browses plans, filters catalog, connects wallet, and confirms checkout subscription', async ({
    page,
  }) => {
    await page.goto('/browse-plans');
    await expect(page.getByRole('heading', { name: 'Browse Plans' })).toBeVisible();

    // Wait for catalog plans to finish loading
    const planList = page.getByRole('list', { name: 'Available subscription plans' });
    await expect(planList).toBeVisible();
    await expect(page.getByText('6 plans found')).toBeVisible();

    // Filter plans by search query and billing interval
    const searchInput = page.getByRole('searchbox', {
      name: /search plans by name, merchant, or description/i,
    });
    await searchInput.fill('Premium Access');
    await expect(page.getByText('2 plans found')).toBeVisible();

    const intervalSelect = page.getByLabel('Filter plans by billing interval');
    await intervalSelect.selectOption('Monthly');
    await expect(page.getByText('1 plan found')).toBeVisible();

    // Clicking Subscribe while disconnected opens the WalletConnectModal
    const subscribeButton = page.getByRole('button', { name: /subscribe to premium access plan/i });
    await subscribeButton.click();

    const walletDialog = page.getByRole('dialog');
    await expect(walletDialog).toBeVisible();
    await expect(walletDialog.getByRole('heading', { name: 'Connect your wallet' })).toBeVisible();

    // Connect Freighter wallet via modal
    await walletDialog.getByRole('button', { name: 'Connect' }).click();
    await expect(walletDialog).toBeHidden();

    // Now that wallet is connected, clicking Subscribe navigates to /checkout/1
    await subscribeButton.click();
    await expect(page).toHaveURL(/\/checkout\/1$/);

    // Verify checkout plan summary details
    await expect(page.getByRole('heading', { name: 'Confirm subscription' })).toBeVisible();
    await expect(page.getByText('Premium Access')).toBeVisible();
    await expect(page.getByText('by Stellar News')).toBeVisible();
    await expect(page.getByText('10 USDC per month')).toBeVisible();

    // Submitting without a deposit shows validation error
    const confirmButton = page.getByRole('button', { name: 'Confirm subscription' });
    await confirmButton.click();
    await expect(page.getByText('Enter a valid initial deposit.')).toBeVisible();

    // Enter valid initial prepaid deposit and confirm subscription
    const depositInput = page.getByLabel(/initial prepaid deposit/i);
    await depositInput.fill('50');
    await confirmButton.click();

    // Navigates to /subscriptions after confirmation
    await expect(page).toHaveURL(/\/subscriptions$/);
    await expect(page.getByRole('heading', { name: 'My subscriptions' })).toBeVisible();
    await expect(page.getByText('Premium Access').first()).toBeVisible();
  });

  test('renders Plan not found recovery state for an unknown checkout planId', async ({
    page,
  }) => {
    await page.goto('/checkout/unknown-plan-999');
    await expect(page.getByRole('heading', { name: 'Plan not found' })).toBeVisible();

    const backLink = page.getByRole('link', { name: 'Back to Browse Plans' });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL(/\/browse-plans$/);
    await expect(page.getByRole('heading', { name: 'Browse Plans' })).toBeVisible();
  });
});
