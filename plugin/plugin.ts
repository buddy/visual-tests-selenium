import { WebDriver, IWebDriverOptionsCookie } from "selenium-webdriver";
import { Snapshot, SnapshotOptions } from "./types";
/**
 * Plugin for capturing snapshots of web pages for visual testing.
 */
export class VisualTestsPlugin {
  private driver: WebDriver;
  private suppressErrors: boolean;
  private parseDomScript?: string;

  /**
   * Creates a new instance of VisualTestsPlugin
   * @param {WebDriver} driver - The Selenium WebDriver instance
   * @param {boolean} [suppressErrors=true] - Whether to suppress errors from plugin methods
   * @throws {Error} When driver is not provided
   */
  constructor(driver: WebDriver, suppressErrors = true) {
    if (!driver) {
      throw new Error("WebDriver instance is required");
    }
    this.driver = driver;
    this.suppressErrors = suppressErrors;
  }

  /**
   * Fetches and caches the parseDom script
   * @private
   * @returns {Promise<void>}
   */
  private async fetchParseDom(): Promise<void> {
    if (this.parseDomScript) return;

    try {
      const response = await fetch("http://localhost:1337/parseDom.js");
      if (!response.ok) {
        throw new Error(`Failed to fetch parseDom.js: ${response.status}`);
      }
      this.parseDomScript = await response.text();
    } catch (error) {
      if (!this.suppressErrors) {
        const error_ =
          error instanceof Error
            ? new Error(`Failed to fetch parseDom.js: ${error.message}`)
            : new Error(`Failed to fetch parseDom.js: ${String(error)}`);
        throw error_;
      }
    }
  }

  /**
   * Takes a snapshot of the current page
   * @param {string} name - The name of the snapshot
   * @param {SnapshotOptions} [options={}] - The snapshot options
   * @returns {Promise<Snapshot|void>} The snapshot data or void if suppressed error occurred
   * @throws {Error} When name is not provided or is not a string
   * @throws {Error} When parseDom.js fails to load and suppressErrors is false
   * @throws {Error} When snapshot fails to be sent to server
   */
  async takeSnap(
    name: string,
    {
      devices,
      fullPage,
      colorScheme,
      enableJavaScript,
      injectStyles,
      resourceDiscoveryTimeout,
      cloneCookies,
      cssIgnores,
      xpathIgnores,
    }: SnapshotOptions = {},
  ): Promise<Snapshot | void> {
    if (!name || typeof name !== "string") {
      throw new Error("Snapshot name is required and must be a string");
    }

    await this.fetchParseDom();

    if (!this.parseDomScript && this.suppressErrors) {
      return;
    }

    const isScriptInjected = await this.driver.executeScript(
      `return typeof window.SNAPSHOT !== "undefined"`,
    );

    if (!isScriptInjected) {
      await this.driver.executeScript(this.parseDomScript!);
    }

    const url = await this.driver.getCurrentUrl();
    const title = await this.driver.getTitle();

    let cookies: IWebDriverOptionsCookie[] = [];
    if (cloneCookies) {
      cookies = await this.driver.manage().getCookies();
    }

    const result = (await this.driver.executeScript(`
      return window.SNAPSHOT.parseDom(document, ${enableJavaScript});
    `)) as { html: string; resources: Record<string, unknown>[] };
    const { html, resources } = result;

    const snapshot: Snapshot = {
      name,
      url,
      title,
      html,
      resources,
      devices,
      colorScheme,
      resourceDiscoveryTimeout,
      fullPage,
      enableJavaScript,
      injectStyles,
      cookies: cloneCookies ? cookies : [],
      cssIgnores,
      xpathIgnores,
      version: 1,
    };

    const response = await fetch("http://localhost:1337/snapshot", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    return snapshot;
  }
}
