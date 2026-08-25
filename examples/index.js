import { Builder } from "selenium-webdriver";
import VisualTestsPlugin from "@buddy-works/visual-tests-selenium";

const driver = await new Builder().forBrowser("chrome").build(),
  visualTests = new VisualTestsPlugin(driver);

try {
  await driver.get("https://buddy.works");
  await visualTests.takeSnap("home", {
    colorScheme: "LIGHT",
    cssIgnores: [".cookie-notice", ".ad-banner"],
    devices: [
      {
        viewport: {
          height: 768,
          width: 1024,
        },
      },
    ],
    enableJavaScript: true,
    fullPage: true,
  });
} finally {
  await driver.quit();
}
