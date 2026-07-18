import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { spawn } from "node:child_process";
import WebSocket from "ws";

const execFileAsync = promisify(execFile);
const repoRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api";
const mobileUrl = process.env.MOBILE_URL ?? "http://127.0.0.1:3002";
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const screenshotDir = join(repoRoot, ".planning/v1-agentic-build/evals/phase26/screenshots");
const profileDir = join("/tmp", `phase26c-chrome-${Date.now()}`);
const port = 9600 + Math.floor(Math.random() * 500);
const viewports = [
  [360, 740],
  [390, 844],
  [430, 932],
  [480, 900],
];

const proof = {
  screenshots: [],
  assertions: [],
  consoleErrors: [],
  runtimeExceptions: [],
  api: {},
};

let chrome;
let cdp;

async function main() {
  try {
    await mkdir(screenshotDir, { recursive: true });
    const context = await prepareDemoContext();
    proof.api = summarizeContext(context);

    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-dev-shm-usage",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profileDir}`,
        "about:blank",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const wsUrl = await waitForChromeWebSocket(port);
    cdp = new CdpClient(wsUrl);
    await cdp.open();
    cdp.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error") {
        proof.consoleErrors.push(event.args?.map((arg) => arg.value ?? arg.description ?? "").join(" "));
      }
    });
    cdp.on("Runtime.exceptionThrown", (event) => {
      proof.runtimeExceptions.push(event.exceptionDetails?.text ?? "Runtime exception");
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable").catch(() => undefined);

    await contractorVisibleProof(context);
    await teamMemberVisibleProof(context);
    await apiReadback(context);

    if (proof.runtimeExceptions.length > 0 || proof.consoleErrors.length > 0) {
      proof.assertions.push({
        name: "runtime console",
        status: "FAIL",
        detail: "Console errors or runtime exceptions were observed.",
      });
      throw new Error("Console errors or runtime exceptions were observed.");
    }
    proof.assertions.push({ name: "runtime console", status: "PASS", detail: "No console errors or runtime exceptions captured." });

    await writeFile(join(screenshotDir, "phase26c-proof.json"), JSON.stringify(proof, null, 2));
    console.log(JSON.stringify({ status: "PASS", ...proof }, null, 2));
  } catch (error) {
    if (cdp) {
      await captureFailureState("phase26c-failure").catch(() => undefined);
    }
    proof.assertions.push({ name: "phase26c proof harness", status: "FAIL", detail: error instanceof Error ? error.message : String(error) });
    await mkdir(screenshotDir, { recursive: true });
    await writeFile(join(screenshotDir, "phase26c-proof.json"), JSON.stringify(proof, null, 2));
    console.error(JSON.stringify({ status: "FAIL", ...proof }, null, 2));
    process.exitCode = 1;
  } finally {
    if (cdp) {
      await cdp.close().catch(() => undefined);
    }
    if (chrome) {
      chrome.kill("SIGTERM");
    }
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function contractorVisibleProof(context) {
  const contractorFirstName = firstName(context.logins.contractor.name);
  await openFreshApp();
  await waitForText("Welcome Back", "contractor login");
  await typeByLabel("Mobile number", context.logins.contractor.mobileNumber);
  await typeByLabel("4-digit MPIN", context.logins.contractor.mpin);
  await clickText("Login");
  await waitForText(`Namaste, ${contractorFirstName}`, "contractor dashboard after visible login");

  await clickText("Selected site and site management");
  await waitForText("Your sites", "contractor site list");
  await waitForText(context.activeSite.clientName, "contractor site list data");
  await clickText(context.activeSite.clientName);
  await waitForText("Selected site and site management", "contractor dashboard after site selection");
  assertText(await pageText(), [context.activeSite.clientName, "Scan QR"], "contractor selected site on dashboard");

  await clickText("Scan QR");
  await waitForText("Select or change site", "contractor fresh scan entry");
  assertText(await pageText(), ["Select a site before scanning.", "Select a site to start scanning."], "contractor fresh scan starts without site");
  assertAbsent(await pageText(), ["QR token"], "contractor qr token field hidden before site");
  await assertExactVisibleTextAbsent("Scan Product QR", "contractor scanner title hidden before site");
  await captureMatrix("phase26c-contractor-fresh-scan-no-site");

  await clickText(context.activeSite.clientName);
  await waitForText("Scan Product QR", "contractor scan controls after site selection");
  assertText(await pageText(), [context.activeSite.clientName, "Scan Product QR", "QR token"], "contractor scanner visible after site");
  await captureMatrix("phase26c-contractor-site-selected-scanner");

  await submitQrToken(context.qrTokens[0].token);
  await waitForText("Scan Another QR", "contractor scan success result");
  await clickText("Scan Another QR");
  await waitForText("Ready to add", "contractor reserved cart after scan");
  assertText(await pageText(), ["Scan cart", "Ready to add", "Reserved in cart", "Add to account"], "contractor reserved cart visible");
  await captureMatrix("phase26c-contractor-reserved-cart");

  await clickText("Add to account");
  await waitForText("Points added to account", "contractor commit success");
  assertText(await pageText(), ["Points added to account", "Select a site before scanning.", "Select a site to start scanning."], "contractor commit clears scan site");
  assertAbsent(await pageText(), ["QR token", "Ready to add"], "contractor qr token and cart hidden after commit");
  await assertExactVisibleTextAbsent("Scan Product QR", "contractor scanner title hidden after commit");
  await captureMatrix("phase26c-contractor-post-commit-site-cleared");

  await clickText(context.activeSite.clientName);
  await waitForText("Scan Product QR", "contractor failure-path site selection");
  await submitQrToken(context.qrTokens[1].token);
  await waitForText("Scan Another QR", "contractor second scan success result");
  await clickText("Scan Another QR");
  await waitForText("Ready to add", "contractor reserved cart before forced failure");

  await forceCommitFailure();
  await clickText("Add to account");
  await waitForText("phase26c forced commit failure", "contractor forced commit failure toast");
  assertText(await pageText(), [context.activeSite.clientName, "Ready to add", "Add to account"], "contractor failed commit preserves site and cart");
  await captureMatrix("phase26c-contractor-commit-failure-preserves-cart");
  await restoreFetch();

  await clickText("Add to account");
  await waitForText("Points added to account", "contractor cleanup commit after forced failure");
  assertText(await pageText(), ["Select a site before scanning.", "Select a site to start scanning."], "contractor cleanup commit clears site");
}

async function teamMemberVisibleProof(context) {
  const contractorFirstName = firstName(context.logins.contractor.name);
  await openFreshApp();
  await waitForText("Team Member", "team member persona option");
  await clickText("Team Member");
  await waitForText("Contractor mobile number", "team member login");
  await typeByLabel("Contractor mobile number", context.logins.teamMember.contractorMobileNumber);
  await typeByLabel("Your mobile number", context.logins.teamMember.teamMemberMobile);
  await clickText("Send OTP to Contractor");
  await waitForText("Dev OTP", "team member dev otp");
  const otp = await waitForPattern(/Dev OTP:\s*(\d{6})/, "team member otp value");
  await typeByLabel("OTP", otp[1]);
  await clickText("Verify OTP");
  await waitForText("Select or change site", "team member fresh scan after visible login");
  await waitForText(context.activeSite.clientName, "team member site list data");
  assertText(await pageText(), ["Logged in for contractor", contractorFirstName, "Select a site before scanning.", "Select a site to start scanning."], "team member fresh scan starts without site");
  assertAbsent(await pageText(), ["QR token"], "team member qr token field hidden before site");
  await assertExactVisibleTextAbsent("Scan Product QR", "team member scanner title hidden before site");
  await captureMatrix("phase26c-team-fresh-scan-no-site");

  await clickText(context.activeSite.clientName);
  await waitForText("Scan Product QR", "team member scan controls after site selection");
  assertText(await pageText(), [context.activeSite.clientName, "Scan Product QR", "QR token"], "team member scanner visible after site");

  await submitQrToken(context.qrTokens[2].token);
  await waitForText("Scan Another QR", "team member scan success result");
  assertText(await pageText(), ["Team Member", "Reserved in cart"], "team member scan success hides point total");
  assertAbsent(await pageText(), ["Points in cart"], "team member scan result hides points");
  await clickText("Scan Another QR");
  await waitForText("Ready to add", "team member reserved cart");
  assertText(await pageText(), ["Scan cart", "Ready to add", "Reserved in cart", "Add to account"], "team member reserved cart visible");
  assertAbsent(await pageText(), ["Points in cart"], "team member cart hides point total");
  await captureMatrix("phase26c-team-reserved-cart-no-points");

  await clickText("Add to account");
  await waitForText("Points added to account", "team member commit success");
  assertText(await pageText(), ["Select a site before scanning.", "Select a site to start scanning."], "team member commit clears scan site");
  assertAbsent(await pageText(), ["QR token", "Ready to add"], "team member qr token and cart hidden after commit");
  await assertExactVisibleTextAbsent("Scan Product QR", "team member scanner title hidden after commit");
  await captureMatrix("phase26c-team-post-commit-site-cleared");
}

async function apiReadback(context) {
  const login = await postJson("/auth/contractor/login", {
    mobileNumber: context.logins.contractor.mobileNumber,
    mpin: context.logins.contractor.mpin,
  });
  const history = await getJson(`/scan/history?siteId=${encodeURIComponent(context.activeSite.siteId)}&limit=20`, login.session.token);
  const recentProducts = history
    .map((entry) => entry.productSku)
    .filter(Boolean)
    .slice(0, 10);
  const expectedSkus = ["WIPRO-LED-BULB-DEMO", "HAVELLS-WIRE-DEMO", "ANCHOR-SWITCH-DEMO"];
  const missing = expectedSkus.filter((sku) => !recentProducts.includes(sku));
  if (missing.length > 0) {
    throw new Error(`API readback did not include expected scan products: ${missing.join(", ")}`);
  }
  proof.api.readback = {
    siteId: context.activeSite.siteId,
    recentProducts,
    expectedSkus,
  };
  proof.assertions.push({ name: "api scan history readback", status: "PASS", detail: expectedSkus.join(", ") });
}

async function prepareDemoContext() {
  const { stdout } = await execFileAsync(process.execPath, ["tools/prepare-client-demo.mjs"], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
  });
  const lines = stdout.split(/\r?\n/);
  const jsonStart = lines.findIndex((line) => line.trim().startsWith("{"));
  if (jsonStart < 0) {
    throw new Error(`Could not parse prepare-client-demo output: ${stdout}`);
  }
  return JSON.parse(lines.slice(jsonStart).join("\n"));
}

function summarizeContext(context) {
  return {
    activeSite: context.activeSite,
    contractor: context.logins.contractor.name,
    teamMemberMobile: context.logins.teamMember.teamMemberMobile,
    qrTokensPrepared: context.qrTokens.map((token) => ({
      label: token.label,
      product: token.product,
      points: token.points,
      invoiceNumber: token.invoiceNumber,
    })),
  };
}

function firstName(name) {
  return String(name).trim().split(/\s+/)[0] ?? name;
}

async function openFreshApp() {
  await setViewport(390, 844);
  await cdp.send("Page.navigate", { url: mobileUrl });
  await waitForLoad();
  await evaluate(`
    localStorage.clear();
    localStorage.setItem("volt-rewards:language", "en");
    location.reload();
  `);
  await waitForLoad();
}

async function typeByLabel(label, value) {
  const didType = await evaluate(`
    (() => {
      const label = ${JSON.stringify(label)};
      const value = ${JSON.stringify(value)};
      const input = [...document.querySelectorAll("input, textarea")]
        .find((candidate) => candidate.getAttribute("aria-label") === label);
      if (!input) {
        return false;
      }
      input.scrollIntoView({ block: "center", inline: "center" });
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, "value")?.set
        ?? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()
  `);
  if (!didType) {
    throw new Error(`Could not type into field: ${label}`);
  }
  await sleep(250);
}

async function submitQrToken(token) {
  await typeByLabel("QR token", token);
  await clickText("Submit scan");
}

async function forceCommitFailure() {
  await evaluate(`
    (() => {
      window.__phase26cOriginalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === "string" ? input : input?.url ?? "";
        if (String(url).includes("/scan/cart/commit")) {
          return Promise.reject(new Error("phase26c forced commit failure"));
        }
        return window.__phase26cOriginalFetch(input, init);
      };
      return true;
    })()
  `);
}

async function restoreFetch() {
  await evaluate(`
    (() => {
      if (window.__phase26cOriginalFetch) {
        window.fetch = window.__phase26cOriginalFetch;
        delete window.__phase26cOriginalFetch;
      }
      return true;
    })()
  `);
}

async function captureMatrix(prefix) {
  for (const [width, height] of viewports) {
    await setViewport(width, height);
    await sleep(250);
    const fileName = `${prefix}-${width}x${height}.png`;
    const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(join(screenshotDir, fileName), Buffer.from(result.data, "base64"));
    proof.screenshots.push(`screenshots/${fileName}`);
  }
}

async function captureFailureState(prefix) {
  const stamp = Date.now();
  const text = await pageText().catch((error) => `Could not read page text: ${error instanceof Error ? error.message : String(error)}`);
  const fileName = `${prefix}-${stamp}.png`;
  const textFileName = `${prefix}-${stamp}.txt`;
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(join(screenshotDir, fileName), Buffer.from(result.data, "base64"));
  await writeFile(join(screenshotDir, textFileName), text);
  proof.screenshots.push(`screenshots/${fileName}`);
  proof.screenshots.push(`screenshots/${textFileName}`);
}

async function setViewport(width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: width,
    screenHeight: height,
  });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
}

async function clickText(text) {
  const clicked = await evaluate(`
    (() => {
      const wanted = ${JSON.stringify(text)};
      const normalizedWanted = wanted.replace(/\\s+/g, " ").trim().toLowerCase();
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      const elements = [...document.querySelectorAll("*")]
        .filter((element) => visible(element))
        .filter((element) => (element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim().toLowerCase().includes(normalizedWanted))
        .sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return (ar.width * ar.height) - (br.width * br.height);
        });
      const match = elements[0];
      if (!match) {
        return false;
      }
      const clickable = match.closest('[role="button"], button, a, input, textarea') ?? match;
      clickable.scrollIntoView({ block: "center", inline: "center" });
      const rect = clickable.getBoundingClientRect();
      clickable.click();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()
  `);
  if (!clicked) {
    throw new Error(`Could not click visible text: ${text}`);
  }
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: clicked.x, y: clicked.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: clicked.x, y: clicked.y, button: "left", clickCount: 1 });
  await sleep(500);
}

async function pageText() {
  return evaluate(`document.body.innerText || ""`);
}

function assertText(text, expected, name) {
  const normalizedText = normalizeText(text);
  const missing = expected.filter((item) => !normalizedText.includes(normalizeText(item)));
  if (missing.length > 0) {
    proof.assertions.push({ name, status: "FAIL", detail: `Missing: ${missing.join(", ")}` });
    throw new Error(`${name} missing expected text: ${missing.join(", ")}`);
  }
  proof.assertions.push({ name, status: "PASS", detail: expected.join(" | ") });
}

function assertAbsent(text, forbidden, name) {
  const normalizedText = normalizeText(text);
  const present = forbidden.filter((item) => normalizedText.includes(normalizeText(item)));
  if (present.length > 0) {
    proof.assertions.push({ name, status: "FAIL", detail: `Unexpected: ${present.join(", ")}` });
    throw new Error(`${name} found unexpected text: ${present.join(", ")}`);
  }
  proof.assertions.push({ name, status: "PASS", detail: `Absent: ${forbidden.join(", ")}` });
}

async function assertExactVisibleTextAbsent(text, name) {
  const present = await evaluate(`
    (() => {
      const wanted = ${JSON.stringify(text)}.replace(/\\s+/g, " ").trim().toLowerCase();
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      return [...document.querySelectorAll("*")]
        .filter((element) => visible(element))
        .some((element) => (element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim().toLowerCase() === wanted);
    })()
  `);
  if (present) {
    proof.assertions.push({ name, status: "FAIL", detail: `Unexpected exact text: ${text}` });
    throw new Error(`${name} found unexpected exact text: ${text}`);
  }
  proof.assertions.push({ name, status: "PASS", detail: `Exact text absent: ${text}` });
}

async function waitForText(text, label) {
  await waitFor(() => pageText().then((body) => normalizeText(body).includes(normalizeText(text))), label);
}

async function waitForPattern(pattern, label) {
  let latestText = "";
  await waitFor(async () => {
    latestText = await pageText();
    return pattern.test(latestText);
  }, label);
  return latestText.match(pattern);
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

async function waitFor(predicate, label, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) {
      return;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}. Current text: ${(await pageText()).slice(0, 1000)}`);
}

async function waitForLoad() {
  await cdp.send("Page.loadEventFired").catch(() => undefined);
  await sleep(1000);
}

async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return response.result?.value;
}

async function getJson(path, bearerToken, extraHeaders = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
      ...extraHeaders,
    },
  });
  return readJsonResponse(response, path);
}

async function postJson(path, body, bearerToken, extraHeaders = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  return readJsonResponse(response, path);
}

async function readJsonResponse(response, path) {
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

async function waitForChromeWebSocket(debugPort) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome is still starting.
    }
    await sleep(200);
  }
  throw new Error("Chrome DevTools endpoint did not become available.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CdpClient {
  #id = 0;
  #pending = new Map();
  #handlers = new Map();
  #ws;

  constructor(url) {
    this.#ws = new WebSocket(url);
  }

  open() {
    return new Promise((resolve, reject) => {
      this.#ws.once("open", resolve);
      this.#ws.once("error", reject);
      this.#ws.on("message", (data) => this.#handleMessage(data));
    });
  }

  on(method, handler) {
    this.#handlers.set(method, handler);
  }

  send(method, params = {}) {
    const id = ++this.#id;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#ws.send(payload);
    });
  }

  close() {
    return new Promise((resolve) => {
      this.#ws.once("close", resolve);
      this.#ws.close();
      setTimeout(resolve, 500);
    });
  }

  #handleMessage(data) {
    const message = JSON.parse(String(data));
    if (message.id) {
      const pending = this.#pending.get(message.id);
      if (!pending) {
        return;
      }
      this.#pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result ?? {});
      }
      return;
    }
    const handler = this.#handlers.get(message.method);
    if (handler) {
      handler(message.params ?? {});
    }
  }
}

await main();
