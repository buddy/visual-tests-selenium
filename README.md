# Visual Test Selenium Plugin

A Selenium WebDriver (JavaScript) plugin for performing visual testing using Buddy Works Visual Testing. This plugin allows automatic capturing of website snapshots across different screen resolutions and comparing them with reference versions to detect visual regressions.

## Requirements

- Node.js >= 20
- Selenium WebDriver >= 4.16.0

## Installation

```bash
npm install @buddy-works/visual-tests-selenium
```

## Basic example

```javascript
import { Builder } from "selenium-webdriver";
import VisualTestsPlugin from "@buddy-works/visual-tests-selenium";

(async function simpleTest() {
  const driver = await new Builder().forBrowser("chrome").build();
  const visualTests = new VisualTestsPlugin(driver);

  try {
    await driver.get("https://buddy.works/blog");
    await visualTests.takeSnap("example-homepage");
  } finally {
    await driver.quit();
  }
})();
```

## Examples

Example usage of the plugin can be found in the `examples/` directory:

```bash
# Install dependencies
pnpm i
# Build plugin
pnpm run build
# Go to examples folder
cd examples
# Install examples dependencies
pnpm i
# Add enviroment variables with token
export BUDDY_VT_TOKEN=****
# Run an example
pnpm run test
```

## License

MIT
