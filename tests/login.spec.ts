import { expect, test } from "@playwright/test";

test.describe("ログインページ", () => {
  test("日本語ページが正しく表示される", async ({ page }) => {
    // ログインページにアクセス
    await page.goto("/ja-JP/login");

    // 3Dキャンバスが表示されている
    await expect(page.locator("canvas")).toBeVisible();

    // Google・GitHubログインボタンが表示されている
    await expect(page.getByText("Googleで続行")).toBeVisible();
    await expect(page.getByText("GitHubで続行")).toBeVisible();
  });

  test("英語ページが正しく表示される", async ({ page }) => {
    // ログインページにアクセス
    await page.goto("/en-US/login");

    // 3Dキャンバスが表示されている
    await expect(page.locator("canvas")).toBeVisible();

    // Google・GitHubログインボタンが表示されている
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByText("Continue with GitHub")).toBeVisible();
  });
});
