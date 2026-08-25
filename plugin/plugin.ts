import type { IWebDriverOptionsCookie, WebDriver } from "selenium-webdriver";
import type { Snapshot, SnapshotOptions, VisualTestsPluginOptions } from "./types";

interface ParseDomResult {
  html: string;
  resources: Record<string, unknown>[];
}

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
   * @param {VisualTestsPluginOptions} [options={}] - The plugin options
   * @throws {Error} When driver is not provided
   */
  constructor(driver: WebDriver, options: VisualTestsPluginOptions = {}) {
    if (!driver) {
      throw new Error("WebDriver instance is required");
    }
    this.driver = driver;
    this.suppressErrors = options.suppressErrors ?? true;
  }

  /**
   * Fetches and caches the parseDom script
   * @private
   * @returns {Promise<void>}
   */
  private async fetchParseDom(): Promise<void> {
    if (this.parseDomScript) {
      return;
    }

    try {
      const response = await fetch("http://localhost:1337/parseDom.js");
      if (!response.ok) {
        throw new Error(`Failed to fetch parseDom.js: ${response.status}`);
      }
      this.parseDomScript = await response.text();
    } catch (error) {
      if (!this.suppressErrors) {
        throw new Error(`Failed to fetch parseDom.js: ${String(error)}`, { cause: error });
      }
    }
  }

  /**
   * Injects the parseDom script into the page unless it is already present
   * @private
   * @returns {Promise<void>}
   */
  private async injectParseDom(): Promise<void> {
    const isScriptInjected = await this.driver.executeScript(
      `return typeof window.SNAPSHOT !== "undefined"`,
    );
    if (!isScriptInjected) {
      await this.driver.executeScript(this.parseDomScript!);
    }
  }

  /**
   * Reads the page cookies when cloning is requested
   * @private
   * @param {boolean} [cloneCookies] - Whether cookies should be cloned
   * @returns {Promise<IWebDriverOptionsCookie[]>} The page cookies, or an empty array
   */
  private collectCookies(cloneCookies?: boolean): Promise<IWebDriverOptionsCookie[]> {
    if (cloneCookies) {
      return this.driver.manage().getCookies();
    }
    return Promise.resolve([]);
  }

  /**
   * Builds the snapshot payload from the current page state
   * @private
   * @param {string} name - The name of the snapshot
   * @param {SnapshotOptions} options - The snapshot options
   * @returns {Promise<Snapshot>} The snapshot data
   */
  private async buildSnapshot(
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
    }: SnapshotOptions,
  ): Promise<Snapshot> {
    const { html, resources } = (await this.driver.executeScript(
      `return window.SNAPSHOT.parseDom(document, arguments[0]);`,
      enableJavaScript,
    )) as ParseDomResult;

    return {
      colorScheme,
      cookies: await this.collectCookies(cloneCookies),
      cssIgnores,
      devices,
      enableJavaScript,
      fullPage,
      html,
      injectStyles,
      name,
      resourceDiscoveryTimeout,
      resources,
      title: await this.driver.getTitle(),
      url: await this.driver.getCurrentUrl(),
      version: 1,
      xpathIgnores,
    };
  }

  /**
   * Sends the snapshot to the server
   * @private
   * @param {Snapshot} snapshot - The snapshot data
   * @returns {Promise<void>}
   * @throws {Error} When the server responds with a non-OK status
   */
  private async sendSnapshot(snapshot: Snapshot): Promise<void> {
    const response = await fetch("http://localhost:1337/snapshot", {
      body: JSON.stringify(snapshot),
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      redirect: "follow",
      referrerPolicy: "no-referrer",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
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
  async takeSnap(name: string, options: SnapshotOptions = {}): Promise<Snapshot | void> {
    if (!name || typeof name !== "string") {
      throw new Error("Snapshot name is required and must be a string");
    }

    await this.fetchParseDom();

    if (!this.parseDomScript && this.suppressErrors) {
      return;
    }

    await this.injectParseDom();

    const snapshot = await this.buildSnapshot(name, options);
    await this.sendSnapshot(snapshot);

    return snapshot;
  }
}
