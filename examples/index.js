import { Builder } from "selenium-webdriver";
import VisualTestsPlugin from "../dist/index.mjs";

(async function simpleTest() {
  const driver = await new Builder().forBrowser("chrome").build();
  const visualTests = new VisualTestsPlugin(driver);

  try {
    await driver.get("https://buddy.works/blog");
    await visualTests.takeSnap("blog", {
      devices: [
        {
          viewport: {
            width: 1024,
            height: 768,
          },
        },
      ],
      fullPage: true,
      colorScheme: "LIGHT",
      enableJavaScript: true,
      cssIgnores: [".cookie-notice", ".ad-banner"],
    });
  } finally {
    await driver.quit();
  }
})();
