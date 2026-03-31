import { defineFn } from "@browserbasehq/sdk-functions";
import { chromium } from "playwright-core";

defineFn("browserbase-function", async (context) => {
  const { session, params } = context;

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = browser.contexts()[0]!.pages()[0]!;

  await page.goto((params?.url as string) || "https://example.com");
  const title = await page.title();

  return { success: true, title };
});
