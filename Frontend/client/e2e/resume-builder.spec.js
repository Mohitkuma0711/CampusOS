import { test, expect } from '@playwright/test';

/**
 * Resume Builder E2E Tests
 *
 * Runs with VITE_TEST_MODE=true — Firebase Auth is mocked with a user
 * that has displayName='Test User' and email='test@example.com', so
 * buildSections skips the name and email questions.
 *
 * Question flow (fresher basics): targetRole (required) → phone (optional) → location (optional)
 *   - Required questions show "Clear answer" (skips) and "Next"
 *   - Optional questions show "Skip for now" and "Next"
 *   - The LAST question's primary button says "Review section" instead of "Next"
 *
 * After Basics recap → Education → Projects → Internships (optional) → Skills → Preview
 */

async function mockFirestore(page) {
  await page.route('**/firestore.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
}

async function goToResume(page) {
  await mockFirestore(page);
  await page.goto('/resume');
}

async function startFresher(page) {
  await goToResume(page);
  await page.locator('button:has-text("I\'m a fresher")').click();
  await expect(page.locator('#resume-answer')).toBeVisible({ timeout: 5000 });
}

async function startExperienced(page) {
  await goToResume(page);
  await page.locator('button:has-text("I have work experience")').click();
  await expect(page.locator('#resume-answer')).toBeVisible({ timeout: 5000 });
}

/**
 * Complete the basics section: fill targetRole, skip phone and location.
 * After this, the page is in recap mode for Basics.
 */
async function completeBasics(page, role = 'Frontend Developer') {
  await page.locator('#resume-answer').fill(role);
  await page.locator('button:has-text("Next")').click();
  await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
  await page.locator('button:has-text("Skip for now")').click(); // skip phone (optional)
  await expect(page.locator('button:has-text("Review section")')).toBeVisible({ timeout: 3000 });
  await page.locator('button:has-text("Review section")').click();
}

/**
 * From Basics recap, continue to Education and complete it.
 */
async function completeEducation(page, school = 'MIT', degree = 'B.Tech CS, 2026') {
  await page.locator('button:has-text("Continue to Education")').click();
  await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
  await page.locator('#resume-answer').fill(school);
  await page.locator('button:has-text("Next")').click();
  await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
  await page.locator('#resume-answer').fill(degree);
  await page.locator('button:has-text("Review section")').click(); // gpa is Q3 (last, optional)
  // Actually, degree is Q2, but we need to check — degree is Q2, gpa is Q3 (last)
  // After filling degree and clicking Next we should be on Q3 (gpa)
}

/**
 * Skip Education section entirely (all questions empty, click Review section).
 */
async function skipEducationSection(page) {
  await page.locator('button:has-text("Continue to Education")').click();
  await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
  // School is required, so we must fill it to pass validation
  await page.locator('#resume-answer').fill('Test University');
  await page.locator('button:has-text("Next")').click();
  await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
  await page.locator('#resume-answer').fill('B.S., 2026');
  await page.locator('button:has-text("Next")').click();
  // Q3 is gpa (optional) — last question shows "Review section"
  await page.locator('button:has-text("Review section")').click();
}

// ─── 1. Experience gate ──────────────────────────────────────────────

test.describe('Experience gate', () => {
  test('shows gate with fresher and experienced options', async ({ page }) => {
    await goToResume(page);
    await expect(page.locator('text=Before we start, one important question.')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("I\'m a fresher")')).toBeVisible();
    await expect(page.locator('button:has-text("I have work experience")')).toBeVisible();
  });

  test('clicking fresher enters question flow', async ({ page }) => {
    await goToResume(page);
    await expect(page.locator('text=Before we start, one important question.')).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("I\'m a fresher")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
  });

  test('clicking experienced enters question flow', async ({ page }) => {
    await goToResume(page);
    await expect(page.locator('text=Before we start, one important question.')).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("I have work experience")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
  });
});

// ─── 2. Question flow ─────────────────────────────────────────────────

test.describe('Question flow', () => {
  test('shows question counter and Basics section', async ({ page }) => {
    await startFresher(page);
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible();
    await expect(page.locator('text=Basics').first()).toBeVisible();
  });

  test('shows textarea for answer input', async ({ page }) => {
    await startFresher(page);
    await expect(page.locator('#resume-answer')).toBeVisible();
  });

  test('shows skip and next buttons', async ({ page }) => {
    await startFresher(page);
    // targetRole is required → "Clear answer" + "Next"
    await expect(page.locator('button:has-text("Clear answer")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
  });

  test('validates required fields on empty answer', async ({ page }) => {
    await startFresher(page);
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Add an answer or choose Skip to continue.')).toBeVisible();
  });

  test('advances to next question after typing answer', async ({ page }) => {
    await startFresher(page);
    await page.locator('#resume-answer').fill('Frontend Developer');
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=QUESTION 2 OF')).toBeVisible({ timeout: 3000 });
  });

  test('skip button advances without validation', async ({ page }) => {
    await startFresher(page);
    await page.locator('button:has-text("Clear answer")').click();
    await expect(page.locator('text=QUESTION 2 OF')).toBeVisible({ timeout: 3000 });
  });

  test('progress bar shows complete text', async ({ page }) => {
    await startFresher(page);
    await expect(page.locator('text=complete')).toBeVisible();
  });

  test('shows Review section on last question', async ({ page }) => {
    await startFresher(page);
    // Q1: targetRole (required) → fill + Next
    await page.locator('#resume-answer').fill('Frontend Developer');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    // Q2: phone (optional) → "Skip for now"
    await page.locator('button:has-text("Skip for now")').click();
    // Q3: location (last) → button should say "Review section"
    await expect(page.locator('button:has-text("Review section")')).toBeVisible({ timeout: 3000 });
  });

  test('can go back to previous section', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);
    // Basics recap → Education
    await page.locator('button:has-text("Continue to Education")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
    // Click Back → should return to basics questions
    await page.locator('.back-button').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 3000 });
  });
});

// ─── 3. Recap screen ──────────────────────────────────────────────────

test.describe('Recap screen', () => {
  test('shows recap with CAPTURED tag', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);
    await expect(page.locator('text=CAPTURED')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Basics looks good.')).toBeVisible();
  });

  test('shows captured values', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);
    await expect(page.locator('text=Test User')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Frontend Developer')).toBeVisible();
  });

  test('has Continue to Education button', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);
    await expect(page.locator('button:has-text("Continue to Education")')).toBeVisible();
  });

  test('has Add more detail button on education recap', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);
    // Go to Education and complete it
    await page.locator('button:has-text("Continue to Education")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
    await page.locator('#resume-answer').fill('MIT');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    await page.locator('#resume-answer').fill('B.Tech CS, 2026');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    await page.locator('button:has-text("Review section")').click();
    // Education recap has "Add more detail" because education has details config
    await expect(page.locator('button:has-text("Add more detail")')).toBeVisible({ timeout: 5000 });
  });

  test('can continue to next section', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);
    await page.locator('button:has-text("Continue to Education")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
  });
});

// ─── 4. Section navigation ───────────────────────────────────────────

test.describe('Section navigation', () => {
  test('shows branding and Fresher label', async ({ page }) => {
    await startFresher(page);
    await expect(page.locator('.builder-brand')).toBeVisible();
    await expect(page.locator('text=Resume builder').first()).toBeVisible();
    await expect(page.locator('text=Fresher')).toBeVisible();
  });

  test('shows Saved status after answering', async ({ page }) => {
    await startFresher(page);
    await page.locator('#resume-answer').fill('Frontend Developer');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });
  });

  test('reset button returns to gate', async ({ page }) => {
    await startFresher(page);
    await expect(page.locator('.reset-button')).toBeVisible();
    await page.locator('.reset-button').click();
    await expect(page.locator('text=Before we start, one important question.')).toBeVisible({ timeout: 5000 });
  });
});

// ─── 5. Experienced flow ──────────────────────────────────────────────

test.describe('Experienced flow', () => {
  test('shows Experienced label in header', async ({ page }) => {
    await startExperienced(page);
    await expect(page.locator('text=Experienced')).toBeVisible();
  });

  test('has Experience section (not Internships)', async ({ page }) => {
    await startExperienced(page);
    await page.locator('#resume-answer').fill('Senior Engineer');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    await page.locator('button:has-text("Skip for now")').click();
    await expect(page.locator('button:has-text("Review section")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Review section")').click();
    await expect(page.locator('button:has-text("Continue to Experience")')).toBeVisible({ timeout: 5000 });
  });
});

// ─── 6. Validation ────────────────────────────────────────────────────

test.describe('Field validation', () => {
  test('rejects empty required field', async ({ page }) => {
    await startFresher(page);
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Add an answer or choose Skip to continue.')).toBeVisible();
  });

  test('error clears when user types', async ({ page }) => {
    await startFresher(page);
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Add an answer or choose Skip to continue.')).toBeVisible();
    await page.locator('#resume-answer').fill('J');
    await expect(page.locator('text=Add an answer or choose Skip to continue.')).not.toBeVisible();
  });
});

// ─── 7. Full flow to preview ──────────────────────────────────────────

test.describe('Full resume flow', () => {
  test('completes all sections and reaches preview', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);

    // Basics recap → Education
    await page.locator('button:has-text("Continue to Education")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
    // Q1: school
    await page.locator('#resume-answer').fill('MIT');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    // Q2: degree
    await page.locator('#resume-answer').fill('B.Tech CS, 2026');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    // Q3: gpa (optional, last) → "Review section"
    await page.locator('button:has-text("Review section")').click();

    // Education recap → Projects
    await page.locator('button:has-text("Continue to Projects")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
    // Q1: project name
    await page.locator('#resume-answer').fill('Portfolio Website');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    // Q2: description
    await page.locator('#resume-answer').fill('Personal portfolio');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    // Q3: link (optional, last) → "Review section"
    await page.locator('button:has-text("Review section")').click();

    // Projects recap → Internships (optional, skip all questions)
    await page.locator('button:has-text("Continue to Internships")').click();
    await expect(page.locator('button:has-text("Clear answer")')).toBeVisible({ timeout: 5000 });
    // Skip all 4 Internships questions (all required) to reach recap
    await page.locator('button:has-text("Clear answer")').click();
    await page.locator('button:has-text("Clear answer")').click();
    await page.locator('button:has-text("Clear answer")').click();
    await page.locator('button:has-text("Clear answer")').click();
    // Internships recap shows "Skip to Skills" (empty optional section)
    await page.locator('button:has-text("Skip to Skills")').click();

    // Skills: Q1 skills (required)
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
    await page.locator('#resume-answer').fill('JavaScript, React, Node.js');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    // Q2: certifications (optional) → "Skip for now"
    await page.locator('button:has-text("Skip for now")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    // Q3: coursework (optional) → "Skip for now"
    await page.locator('button:has-text("Skip for now")').click();
    // Q4: links (optional, last) → "Review section"
    await page.locator('button:has-text("Review section")').click();

    // Skills recap → Preview
    await page.locator('button:has-text("Continue to preview")').click();

    // Verify preview
    await expect(page.locator('.resume-paper')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.resume-header h1')).toHaveText('Test User');
    await expect(page.locator('.resume-header p')).toHaveText('Frontend Developer');
    await expect(page.locator('.resume-header small')).toContainText('test@example.com');
    await expect(page.locator('.paper-section:has-text("Education")')).toBeVisible();
    await expect(page.locator('text=MIT')).toBeVisible();
    await expect(page.locator('.paper-section:has-text("Projects")')).toBeVisible();
    await expect(page.locator('text=Portfolio Website')).toBeVisible();
    await expect(page.locator('.paper-section:has-text("Skills")')).toBeVisible();
    await expect(page.locator('text=JavaScript, React, Node.js')).toBeVisible();
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Tailor by job title")')).toBeVisible();
    await expect(page.locator('button:has-text("Check ATS score")')).toBeVisible();
    await expect(page.locator('.section-chip:has-text("Basics")')).toBeVisible();
    await expect(page.locator('.section-chip:has-text("Education")')).toBeVisible();
    await expect(page.locator('.section-chip:has-text("Projects")')).toBeVisible();
    await expect(page.locator('.section-chip:has-text("Skills")')).toBeVisible();
  });

  test('clicking section chip goes back to that section', async ({ page }) => {
    await startFresher(page);
    await completeBasics(page);

    // Basics recap → Education
    await page.locator('button:has-text("Continue to Education")').click();
    await page.locator('#resume-answer').fill('MIT');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    await page.locator('#resume-answer').fill('B.Tech CS, 2026');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    await page.locator('button:has-text("Review section")').click();

    // Education recap → Projects
    await page.locator('button:has-text("Continue to Projects")').click();
    await page.locator('#resume-answer').fill('Portfolio Website');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    await page.locator('#resume-answer').fill('Personal portfolio');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    await page.locator('button:has-text("Review section")').click();

    // Projects recap → Internships (skip all 4 questions)
    await page.locator('button:has-text("Continue to Internships")').click();
    await expect(page.locator('button:has-text("Clear answer")')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Clear answer")').click();
    await page.locator('button:has-text("Clear answer")').click();
    await page.locator('button:has-text("Clear answer")').click();
    await page.locator('button:has-text("Clear answer")').click();
    // Internships recap → Skip to Skills
    await page.locator('button:has-text("Skip to Skills")').click();

    // Skills
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
    await page.locator('#resume-answer').fill('JavaScript, React, Node.js');
    await page.locator('button:has-text("Next")').click();
    await page.locator('text=QUESTION 2 OF').waitFor({ timeout: 3000 });
    await page.locator('button:has-text("Skip for now")').click();
    await page.locator('text=QUESTION 3 OF').waitFor({ timeout: 3000 });
    await page.locator('button:has-text("Skip for now")').click();
    await page.locator('button:has-text("Review section")').click();

    // Skills recap → Preview
    await page.locator('button:has-text("Continue to preview")').click();
    await expect(page.locator('.resume-paper')).toBeVisible({ timeout: 5000 });

    // Click Basics chip → should go back to basics questions
    await page.locator('.section-chip:has-text("Basics")').click();
    await expect(page.locator('text=QUESTION 1 OF')).toBeVisible({ timeout: 5000 });
  });
});
