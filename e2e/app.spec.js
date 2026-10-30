import { test, expect } from '@playwright/test';

const KEY = 'belajar-ceria-v1';

// Open the app with a fresh (or seeded) save. `?test` turns on window.__test.
async function open(page, seed) {
  await page.goto('/?test');
  if (seed) {
    await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, seed]);
    await page.reload();
  }
}

const choices = (page) => page.locator('.choice');
const correctIndex = (page) => page.evaluate(() => window.__test.correctIndex());

async function answerRight(page) {
  await choices(page).nth(await correctIndex(page)).click();
  // Wait for the feedback animation to finish and the next screen to render.
  await expect(page.locator('.choice.right, .choice.picked')).toHaveCount(0);
}

async function answerWrong(page) {
  const i = await correctIndex(page);
  const n = await choices(page).count();
  await choices(page).nth((i + 1) % n).click();
  await expect(page.locator('.choice.picked')).toHaveCount(0);
}

const coins = (page) => page.locator('.coins');
const placed = { placed: { math: true } };

test('home: Math is open, other subjects are coming soon', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('button', { name: /Matematik/ })).toBeEnabled();
  await expect(page.locator('.tile.locked')).toHaveCount(6);
  await expect(coins(page)).toHaveText('🪙 0');
});

test('placement: a child who gets everything right starts at the top level', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Matematik/ }).click();
  for (let i = 0; i < 20; i++) await answerRight(page); // 10 levels × 2 questions
  await expect(page.locator('.level:not(.locked)')).toHaveCount(10);
});

test('placement: a child who misses early starts at level 1, with no "wrong" shown', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Matematik/ }).click();
  await answerWrong(page);
  await expect(page.locator('.choice.wrong')).toHaveCount(0);
  await answerWrong(page);
  await expect(page.locator('.level:not(.locked)')).toHaveCount(1);
});

test('perfect first round: coins, sticker, mastery progress, next level unlocked', async ({ page }) => {
  await open(page, placed);
  await page.getByRole('button', { name: /Matematik/ }).click();
  await page.locator('.level').first().click();
  for (let i = 0; i < 5; i++) await answerRight(page);

  const results = page.locator('.results');
  await expect(results.locator('h1')).toContainText('Hebat! Semua betul!');
  await expect(results).toContainText('+10 syiling');
  await expect(results).toContainText('Pelekat baru!');
  await expect(results).toContainText('Mahir: 1/3');

  await page.getByRole('button', { name: /Seterusnya/ }).click();
  await expect(page.locator('.level:not(.locked)')).toHaveCount(2);
  await expect(coins(page)).toHaveText('🪙 10');
});

test('replaying for the same score earns no coins (no farming)', async ({ page }) => {
  await open(page, placed);
  await page.getByRole('button', { name: /Matematik/ }).click();
  await page.locator('.level').first().click();
  for (let i = 0; i < 5; i++) await answerRight(page);
  await page.getByRole('button', { name: /Main lagi/ }).click();
  for (let i = 0; i < 5; i++) await answerRight(page);

  await expect(page.locator('.results')).not.toContainText('syiling');
  await page.getByRole('button', { name: /Seterusnya/ }).click();
  await expect(coins(page)).toHaveText('🪙 10');
});

test('wrong answer: child can retry, but it does not count toward the score', async ({ page }) => {
  await open(page, placed);
  await page.getByRole('button', { name: /Matematik/ }).click();
  await page.locator('.level').first().click();

  const i = await correctIndex(page);
  const wrong = choices(page).nth((i + 1) % 3);
  await wrong.click();
  await expect(wrong).toHaveClass(/wrong/);
  await expect(wrong).toBeDisabled();
  for (let k = 0; k < 5; k++) await answerRight(page);

  await expect(page.locator('.results .stars')).toHaveText('★★★★☆');
  await expect(page.locator('.results')).toContainText('Kamu terus mencuba');
});

test('progress survives closing and reopening the app', async ({ page }) => {
  await open(page, placed);
  await page.getByRole('button', { name: /Matematik/ }).click();
  await page.locator('.level').first().click();
  for (let i = 0; i < 5; i++) await answerRight(page);
  await page.reload();
  await expect(coins(page)).toHaveText('🪙 10');
  await expect(page.getByRole('button', { name: /Pelekat/ })).toContainText('1');
});

test('shop: asks to save up when short, buys and wears when affordable', async ({ page }) => {
  await open(page, { coins: 20 });
  await page.getByRole('button', { name: /Kedai/ }).click();

  await page.locator('[data-arg="h-crown"]').click();
  await expect(page.locator('.sheet')).toContainText('Kumpul lagi 🪙 20 dulu!');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(coins(page)).toHaveText('🪙 20');

  await page.locator('[data-arg="h-cap"]').click();
  await page.getByRole('button', { name: 'Beli!' }).click();
  await expect(coins(page)).toHaveText('🪙 5');
  await expect(page.locator('[data-arg="h-cap"]')).toContainText('Dipakai');
  await expect(page.locator('.avatar .hat')).toHaveText('🧢');
});

test('time limit: avatar sleeps when time is up; parent can end the rest', async ({ page }) => {
  await page.goto('/?test');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({
    session: { usedMs: 21 * 60000, lastActive: Date.now(), restUntil: 0 },
  })), KEY);
  await page.reload();
  await expect(page.locator('.sleepy h1')).toHaveText('Masa rehat!');

  await page.getByRole('button', { name: 'Ibu bapa' }).click();
  const [a, b] = (await page.locator('.gate h1').textContent()).match(/\d+/g).map(Number);
  await page.locator('.gate input').fill(String(a * b));
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.getByRole('button', { name: /Tamatkan rehat/ }).click();
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(page.getByRole('button', { name: /Matematik/ })).toBeVisible();
});

test('parent gate rejects a wrong answer', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Ibu bapa' }).click();
  await page.locator('.gate input').fill('1');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.gate input')).toHaveAttribute('placeholder', 'Cuba lagi');
  await expect(page.locator('.panel')).toHaveCount(0);
});

const levelButton = (page, title) => page.locator('.level', { hasText: title });

test('number bonds: a pair with a ten frame, choices are other pairs, can be completed', async ({ page }) => {
  await open(page, { placed: { math: true }, frontier: { math: 'math-bond10' } });
  await page.getByRole('button', { name: /Matematik/ }).click();
  await levelButton(page, 'Pasangan 10').click();

  await expect(page.locator('.qtext')).toHaveText(/^\d \+ \d$/);
  await expect(page.locator('.speak')).toContainText('Mana yang sama dengan');
  await expect(page.locator('.frame .cell')).toHaveCount(10);
  await expect(page.locator('.choice .pair')).toHaveCount(3);
  for (let i = 0; i < 5; i++) await answerRight(page);
  await expect(page.locator('.results h1')).toContainText('Hebat! Semua betul!');
});

test('number recognition: choices are picture groups', async ({ page }) => {
  await open(page, { placed: { math: true }, frontier: { math: 'math-numerals' } });
  await page.getByRole('button', { name: /Matematik/ }).click();
  await levelButton(page, 'Kenal nombor').click();
  await expect(page.locator('.numeral')).toBeVisible();
  await expect(page.locator('.choice .items')).toHaveCount(3);
});

test('old saves keep the same level open after the new levels were added', async ({ page }) => {
  // Old format: highest unlocked level saved by position. 3 was "Tambah hingga 5".
  await open(page, { placed: { math: true }, unlocked: { math: 3 } });
  await page.getByRole('button', { name: /Matematik/ }).click();
  await expect(levelButton(page, 'Tambah hingga 5')).toBeEnabled();
  await expect(levelButton(page, 'Tolak hingga 5')).toBeDisabled();
  await expect(levelButton(page, 'Pasangan 5')).toBeEnabled(); // new level before it is open too
});
