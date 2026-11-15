import { expect, test } from "@playwright/test";

test("the demo page renders and the sample note enables matching", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/Field photos demo/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/right note on the right job/i);
  await expect(page.getByRole("textbox", { name: /today’s open jobs/i })).toHaveValue(/JOB-4471/);

  const submit = page.getByRole("button", { name: /match it to a job/i });
  await expect(submit).toBeDisabled();
  await page.getByRole("button", { name: /sample field note/i }).click();
  await expect(page.getByRole("textbox", { name: /field note/i })).toHaveValue(/millbrook site/);
  await expect(submit).toBeEnabled();

  expect(errors).toEqual([]);
});
