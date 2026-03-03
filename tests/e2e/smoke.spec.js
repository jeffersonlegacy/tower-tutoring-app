import { expect, test } from '@playwright/test';

test('landing starts a new tutoring session', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('landing-page')).toBeVisible();

  await page.getByTestId('landing-session-input').fill('e2e-smoke-start');
  await page.getByTestId('landing-start-button').click();

  await expect(page).toHaveURL(/\/session\/e2e-smoke-start$/);
  await expect(page.getByTestId('session-shell')).toBeVisible();
  await expect(page.getByTestId('whiteboard-stage')).toBeVisible();
});

test('landing resumes an existing session from local cache', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('last_tower_session', 'resume-smoke-session');
  });

  await page.goto('/');
  await expect(page.getByTestId('resume-session-button')).toBeVisible();
  await page.getByTestId('resume-session-button').click();

  await expect(page).toHaveURL(/\/session\/resume-smoke-session$/);
  await expect(page.getByTestId('session-shell')).toBeVisible();
});

test('arcade route launches connect4 menu', async ({ page }) => {
  await page.goto('/arcade');
  await expect(page.getByTestId('brainbreak-page')).toBeVisible();

  await page.getByTestId('game-card-connect4').click();
  await expect(page).toHaveURL(/\/game\/connect4$/);

  await expect(page.getByTestId('connect4-menu')).toBeVisible();
  await page.getByTestId('connect4-vs-computer').click();
  await expect(page.getByText('SELECT AI LEVEL')).toBeVisible();
});

test('swipe fight launches and enters active match', async ({ page }) => {
  await page.goto('/game/swipe-fight');
  await expect(page.getByTestId('swipefight-page')).toBeVisible();
  await expect(page.getByTestId('swipefight-menu')).toBeVisible();

  await page.getByTestId('swipefight-start').click();
  await expect(page.getByTestId('swipefight-playing')).toBeVisible();
});

test('session rail opens AI panel without whiteboard controls blocking clicks', async ({ page }) => {
  await page.goto('/session/e2e-rail-ai');
  await expect(page.getByTestId('session-shell')).toBeVisible();

  await page.getByTestId('rail-ai').click();
  await expect(page.getByTestId('chat-container')).toBeVisible();
  await expect(page.getByTestId('chat-input')).toBeVisible();
});

test('chat shows graceful fallback when API fails', async ({ page }) => {
  await page.route('**/api/chat/completions', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: { code: 'gemini_error', message: 'Injected test failure', retryable: true },
        traceId: 'trace-e2e-failure',
      }),
    });
  });

  await page.goto('/session/e2e-chat-failure?mode=guide');
  await expect(page.getByTestId('session-shell')).toBeVisible();
  await expect(page.getByTestId('chat-container')).toBeVisible();

  await page.getByTestId('chat-input').fill('Can you help me solve 2x + 3 = 11?');
  await page.getByTestId('chat-send').click();

  await expect(
    page.getByText("I'm having trouble connecting right now. Please try again in a moment."),
  ).toBeVisible();
});
