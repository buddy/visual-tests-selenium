# Visual Test Selenium Plugin

A Selenium WebDriver (JavaScript) plugin for performing visual testing using Buddy Works Visual Testing. This plugin allows automatic capturing of website snapshots across different screen resolutions and comparing them with reference versions to detect visual regressions.

## Requirements

- **Node.js** `>=20`
- **Selenium WebDriver** `>=4.16.0`
- **[bdy CLI](https://www.npmjs.com/package/bdy)** — tests must be run through the CLI within a visual testing session, e.g. `bdy tests visual session create "node index.js"`

## Installation

```bash
npm install @buddy-works/visual-tests-selenium
```

## Usage

### ESM (`import`)

```javascript
import { Builder } from "selenium-webdriver";
import VisualTestsPlugin from "@buddy-works/visual-tests-selenium";

const driver = await new Builder().forBrowser("chrome").build();
const visualTests = new VisualTestsPlugin(driver);

try {
  await driver.get("https://example.com");

  await visualTests.takeSnap("homepage", {
    devices: [{ viewport: { width: 1366, height: 768 } }],
    colorScheme: "DARK",
    cloneCookies: true,
  });
} finally {
  await driver.quit();
}
```

### CommonJS (`require`)

```javascript
const { Builder } = require("selenium-webdriver");
const { default: VisualTestsPlugin } = require("@buddy-works/visual-tests-selenium");

(async () => {
  const driver = await new Builder().forBrowser("chrome").build();
  const visualTests = new VisualTestsPlugin(driver);

  try {
    await driver.get("https://example.com");

    await visualTests.takeSnap("homepage", {
      devices: [{ viewport: { width: 1366, height: 768 } }],
      colorScheme: "DARK",
      cloneCookies: true,
    });
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
# Create link for plugin
pnpm link
# Go to examples folder
cd examples
# Link plugin
pnpm link @buddy-works/visual-tests-selenium
# Install examples dependencies
pnpm i
# Add enviroment variables with token
export BUDDY_VT_TOKEN=****
# Run an example
pnpm run test
```

## License

MIT
