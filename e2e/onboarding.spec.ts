import { expect, test, type Page } from 'playwright/test';

const VALID_STELLAR_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

/**
 * Block any external network calls so tests remain 100% deterministic offline.
 */
async function blockExternalNetwork(page: Page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return route.continue();
    }
    return route.abort();
  });
}

test.describe('Merchant onboarding journey', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalNetwork(page);
  });

  test('redirects /onboarding and guarded /onboarding/payout to /onboarding/business when session storage is empty', async ({
    page,
  }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding\/business$/);
    await expect(page.getByRole('heading', { name: 'Tell us about your business' })).toBeVisible();

    // Direct navigation to /onboarding/payout without stored business data triggers OnboardingPayoutGuard
    await page.goto('/onboarding/payout');
    await expect(page).toHaveURL(/\/onboarding\/business$/);
    await expect(page.getByRole('heading', { name: 'Tell us about your business' })).toBeVisible();
  });

  test('redirects direct access to /onboarding/review when prerequisite steps are missing', async ({
    page,
  }) => {
    // No business data in sessionStorage -> redirect to /onboarding/business with notice
    await page.goto('/onboarding/review');
    await expect(page).toHaveURL(/\/onboarding\/business$/);
    await expect(
      page.getByRole('status').filter({ hasText: /complete your business information before reviewing/i })
    ).toBeVisible();

    // Seed valid business data but omit payout data -> redirect to /onboarding/payout
    await page.evaluate(() => {
      sessionStorage.setItem(
        'onboardingBusiness',
        JSON.stringify({
          businessName: 'Stellar Labs',
          website: 'https://stellar.example',
          country: 'US',
        })
      );
      sessionStorage.removeItem('onboardingPayout');
    });

    await page.goto('/onboarding/review');
    await expect(page).toHaveURL(/\/onboarding\/payout$/);
    await expect(page.getByRole('heading', { name: 'Payout details' })).toBeVisible();
  });

  test('completes full onboarding happy path: business -> payout -> review -> success', async ({
    page,
  }) => {
    // Step 1: Business details
    await page.goto('/onboarding/business');
    await expect(page.getByRole('heading', { name: 'Tell us about your business' })).toBeVisible();

    // Verify required field validation on Step 1
    await page.getByRole('button', { name: /^next$/i }).click();
    await expect(page.getByText('Business name is required.')).toBeVisible();
    await expect(page.getByText('Country is required.')).toBeVisible();

    await page.getByLabel(/business name/i).fill('Acme Stellar Corp');
    const countryCombobox = page.getByRole('combobox', { name: /country \/ region/i });
    await countryCombobox.click();
    await countryCombobox.fill('United States');
    await page.getByRole('option', { name: /United States/i }).first().click();

    await page.getByLabel(/website/i).fill('https://acme.stellar.example');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2: Payout details
    await expect(page).toHaveURL(/\/onboarding\/payout$/);
    await expect(page.getByRole('heading', { name: 'Payout details' })).toBeVisible();

    // Verify Stellar address validation
    const walletInput = page.getByLabel(/stellar wallet address/i);
    await walletInput.fill('S' + 'A'.repeat(55));
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('alert')).toContainText(/never paste your secret key/i);

    await walletInput.fill(VALID_STELLAR_ADDRESS);
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Review and confirm
    await expect(page).toHaveURL(/\/onboarding\/review$/);
    await expect(page.getByRole('heading', { name: 'Review and confirm' })).toBeVisible();
    await expect(
      page.getByText('Acme Stellar Corp — https://acme.stellar.example — United States')
    ).toBeVisible();
    await expect(page.getByText('GAAZI4TCR3...VKOCCWN7')).toBeVisible();

    const completeButton = page.getByRole('button', { name: 'Complete setup' });
    await expect(completeButton).toBeEnabled();
    await completeButton.click();

    // Step 4: Onboarding success
    await expect(page).toHaveURL(/\/onboarding-success$/);
    await expect(page.getByRole('heading', { name: "You're all set!" })).toBeVisible();
    await expect(page.getByRole('link', { name: /create plan/i })).toHaveAttribute('href', '/plans/new');
    await expect(page.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard');

    // Confirm onboarding session storage was cleared after completion
    const storageCleared = await page.evaluate(() => ({
      business: sessionStorage.getItem('onboardingBusiness'),
      payout: sessionStorage.getItem('onboardingPayout'),
    }));
    expect(storageCleared).toEqual({ business: null, payout: null });
  });
});
