import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import WebSocket from "ws";

const repoRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api";
const mobileUrl = process.env.MOBILE_URL ?? "http://127.0.0.1:3002";
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const screenshotDir = join(repoRoot, ".planning/v1-agentic-build/evals/phase25/screenshots");
const profileDir = join("/tmp", `phase25e-chrome-${Date.now()}`);
const port = 9400 + Math.floor(Math.random() * 500);
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
  const prepared = await prepareProofData();
  proof.api = prepared.summary;

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

  await loadSession(prepared.contractorSession);
  await waitForText("Ramesh", "contractor dashboard");
  await clickText("Selected site and site management");
  await waitForText("Your sites", "sites list");
  await waitForText(prepared.contractorSite.clientName, "sites list data");
  await clickText(prepared.contractorSite.clientName);
  await waitForText(prepared.contractorSite.clientName, "selected site dashboard");
  assertText(await pageText(), ["Selected site and site management", prepared.contractorSite.clientName, "Scan QR"], "contractor selected-site dashboard");
  await captureMatrix("phase25e-contractor-dashboard-selected");

  await clickText("Scan");
  await waitForText("Select or change site", "scan screen");
  if (prepared.qrToken) {
    await submitQrToken(prepared.qrToken);
    await waitForAnyText(["Scan recorded successfully", "Ready to add"], "scan reservation");
    const afterScanText = await pageText();
    if (normalizeText(afterScanText).includes(normalizeText("Scan Another QR"))) {
      await evaluate("history.back()");
      await sleep(1000);
      if (normalizeText(await pageText()).includes(normalizeText("Scan Another QR"))) {
        await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "BrowserBack", windowsVirtualKeyCode: 166, nativeVirtualKeyCode: 166 });
        await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "BrowserBack", windowsVirtualKeyCode: 166, nativeVirtualKeyCode: 166 });
        await sleep(1000);
      }
      await waitForText("Select or change site", "scan screen after success");
    }
  }
  await waitForText("Ready to add", "reserved scan cart");
  assertText(await pageText(), ["Scan cart", "Ready to add", "Reserved in cart", "Add to account"], "contractor reserved cart");
  await captureMatrix("phase25e-contractor-scan-cart");

  await clickText("Rewards");
  await waitForText("Add reserved points first", "cart navigation guard");
  assertText(await pageText(), ["Add reserved points first", "Add to account", "Stay on Scan"], "reserved-cart navigation guard");
  await captureMatrix("phase25e-contractor-cart-guard");

  await clickText("Add to account");
  await waitForText("Points added to account", "cart commit success");
  assertText(await pageText(), ["Points added to account"], "cart commit success");
  await captureMatrix("phase25e-contractor-commit-success");

  await loadSession(prepared.teamNoSiteSession);
  await waitForText("Mahesh Patil", "team member no-site landing");
  assertText(
    await pageText(),
    ["Logged in for contractor", "Mahesh Patil", "No site available", "Ask the contractor to create a site first."],
    "team member no-site guidance",
  );
  await captureMatrix("phase25e-team-no-site");

  if (proof.runtimeExceptions.length > 0 || proof.consoleErrors.length > 0) {
    proof.assertions.push({
      name: "runtime console",
      status: "FLAG",
      detail: "Console errors or runtime exceptions were observed; inspect proof JSON.",
    });
  } else {
    proof.assertions.push({ name: "runtime console", status: "PASS", detail: "No console errors or runtime exceptions captured." });
  }

  await writeFile(join(screenshotDir, "phase25e-proof.json"), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ status: "PASS", ...proof }, null, 2));
} catch (error) {
  if (cdp) {
    await captureFailureState("phase25e-failure").catch(() => undefined);
  }
  proof.assertions.push({ name: "phase25e proof harness", status: "FAIL", detail: error instanceof Error ? error.message : String(error) });
  await mkdir(screenshotDir, { recursive: true });
  await writeFile(join(screenshotDir, "phase25e-proof.json"), JSON.stringify(proof, null, 2));
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

async function prepareProofData() {
  const contractorLogin = await postJson("/auth/contractor/login", { mobileNumber: "9000001001", mpin: "1234" });
  const contractorToken = contractorLogin.session.token;
  const contractorSites = await getJson("/contractor/sites", contractorToken);
  const contractorSite = contractorSites.find((site) => site.status === "ACTIVE");
  if (!contractorSite) {
    throw new Error("No active contractor site is available for proof.");
  }
  const existingCart = await getJson(`/scan/cart?siteId=${encodeURIComponent(contractorSite.siteId)}`, contractorToken);

  let qrToken;
  let printedQr;
  if (existingCart.items.length > 0) {
    printedQr = {
      invoiceNumber: "existing reserved cart",
      productName: existingCart.items[0]?.productSku ?? "reserved QR",
      qrUnitId: existingCart.items[0]?.qrUnitId,
      points: existingCart.cartTotalPoints,
      existingReservedItems: existingCart.items.length,
    };
  } else {
    const adminLogin = await postJson("/auth/admin/login", { mobileNumber: "9000000091", pin: "1111", role: "OWNER" });
    const adminHeaders = {
      "x-actor-role": adminLogin.session.actor.role,
      "x-actor-user-id": adminLogin.session.actor.userId,
    };
    const invoices = await getJson("/admin-web/invoices", undefined, adminHeaders);
    let selectedInvoice;
    let selectedLine;
    for (const invoice of invoices) {
      if (invoice.notPrintedUnitCount <= 0) {
        continue;
      }
      const detail = await getJson(`/admin-web/invoices/${encodeURIComponent(invoice.invoiceId)}`, undefined, adminHeaders);
      const line = detail.lines.find((candidate) => candidate.notPrintedQuantity > 0);
      if (line) {
        selectedInvoice = detail;
        selectedLine = line;
        break;
      }
    }
    if (!selectedInvoice || !selectedLine) {
      throw new Error("No not-printed QR unit is available for proof.");
    }
    const printResult = await postJson(
      "/admin-web/qr/print",
      {
        invoiceId: selectedInvoice.invoiceId,
        lines: [{ invoiceLineId: selectedLine.invoiceLineId, quantity: 1 }],
        now: new Date().toISOString(),
      },
      undefined,
      adminHeaders,
    );
    const printedUnit = printResult.printedUnits[0];
    if (!printedUnit?.tokenValue) {
      throw new Error("QR print did not return a token.");
    }
    qrToken = printedUnit.tokenValue;
    printedQr = {
      invoiceNumber: selectedInvoice.invoiceNumber,
      productName: selectedLine.productName,
      qrUnitId: printedUnit.qrUnitId,
      points: printedUnit.points,
    };
  }

  const teamOtp = await postJson("/auth/team-member/request-otp", {
    contractorMobileNumber: "9000001002",
    teamMemberMobile: "9000011111",
    deviceContext: { surface: "volt-rewards-phase25e-proof" },
  });
  const teamAuth = await postJson("/auth/team-member/verify-otp", {
    challengeId: teamOtp.challengeId,
    otp: teamOtp.delivery?.mockOtp,
    teamMemberMobile: "9000011111",
  });
  const teamSites = await getJson("/team-member/sites", teamAuth.session.token);
  if (teamSites.length !== 0) {
    throw new Error("Expected Mahesh Patil to have no active sites for Team Member no-site proof.");
  }

  return {
    contractorSite,
    ...(qrToken ? { qrToken } : {}),
    contractorSession: toStoredSession("CONTRACTOR", contractorLogin.contractor, contractorLogin.session),
    teamNoSiteSession: toStoredSession("TEAM_MEMBER", teamAuth.contractor, teamAuth.session, "9000011111"),
    summary: {
      contractor: contractorLogin.contractor.name,
      contractorSite: {
        siteId: contractorSite.siteId,
        clientName: contractorSite.clientName,
      },
      printedQr: {
        ...printedQr,
      },
      teamMemberNoSiteContractor: teamAuth.contractor.name,
    },
  };
}

function toStoredSession(role, contractor, session, teamMemberMobile) {
  return {
    token: session.token,
    role,
    contractorId: contractor.contractorId,
    ...(teamMemberMobile ? { teamMemberMobile } : {}),
    expiresAt: session.expiresAt,
    contractor: {
      name: contractor.name,
      mobileNumber: contractor.mobileNumber,
      ...(contractor.photoUrl ? { photoUrl: contractor.photoUrl } : {}),
      ...(contractor.tier ? { tier: contractor.tier } : {}),
      totalAccumulatedPoints: contractor.totalAccumulatedPoints,
      availablePoints: contractor.availablePoints,
    },
  };
}

async function loadSession(session) {
  await setViewport(390, 844);
  await cdp.send("Page.navigate", { url: mobileUrl });
  await waitForLoad();
  await evaluate(`
    localStorage.clear();
    localStorage.setItem("volt-rewards:language", "en");
    localStorage.setItem("volt-rewards:end-user-session", ${JSON.stringify(JSON.stringify(session))});
    location.reload();
  `);
  await waitForLoad();
}

async function submitQrToken(token) {
  await evaluate(`
    (() => {
      const inputs = [...document.querySelectorAll("input, textarea")].filter((input) => !input.disabled);
      const input = inputs[inputs.length - 1];
      if (!input) {
        return false;
      }
      const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, "value")?.set
        ?? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter.call(input, ${JSON.stringify(token)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()
  `);
  await clickText("Submit scan");
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

async function waitForText(text, label) {
  await waitFor(() => pageText().then((body) => normalizeText(body).includes(normalizeText(text))), label);
}

async function waitForAnyText(texts, label) {
  await waitFor(() => pageText().then((body) => texts.some((text) => normalizeText(body).includes(normalizeText(text)))), label);
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

async function waitFor(predicate, label, timeoutMs = 10000) {
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
