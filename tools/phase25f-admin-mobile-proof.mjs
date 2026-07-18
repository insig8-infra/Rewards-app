import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import WebSocket from "ws";

const repoRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
let apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api";
const adminMobileUrl = process.env.ADMIN_MOBILE_URL ?? "http://127.0.0.1:3003";
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const screenshotDir = join(repoRoot, ".planning/v1-agentic-build/evals/phase25/screenshots");
const profileDir = join("/tmp", `phase25f-chrome-${Date.now()}`);
const chromePort = 9800 + Math.floor(Math.random() * 500);
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
let adminMobileServer;
let apiServer;

async function main() {
  try {
    await mkdir(screenshotDir, { recursive: true });
    await ensureApiServer();
    await ensureAdminMobileServer();
    const prepared = await prepareSessions();
    proof.api = prepared.summary;

    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-dev-shm-usage",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${profileDir}`,
        "about:blank",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const wsUrl = await waitForChromeWebSocket(chromePort);
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

    await loadAdminSession(prepared.ownerSession);
    await waitForText("Primary operation", "owner dashboard");
    await clickText("Contract");
    await waitForText("Register contractor", "contractor registration form");
    assertText(await pageText(), ["Register contractor", "Directory", "Upload photo"], "owner contractor registration surface");
    await captureMatrix("phase25f-owner-contractors-registration");

    await setInputByPlaceholder("Ramesh Sharma", prepared.contractorName);
    await setInputByPlaceholder("10 digit mobile", prepared.contractorMobile);
    await clickText("Register contractor");
    await waitForText(prepared.contractorMobile, "new contractor in directory");
    assertText(await pageText(), [prepared.contractorName, prepared.contractorMobile, "points available"], "owner contractor created in list");
    await clickText(prepared.contractorName);
    await waitForText("Owner actions", "contractor detail owner actions");
    assertText(await pageText(), ["Owner actions", "Upload contractor photo", "Reset MPIN", "Deactivate contractor"], "contractor detail owner actions");
    await clickText("Reset MPIN");
    await waitForText("Temporary MPIN issued", "contractor reset MPIN result");
    assertText(await pageText(), ["Temporary MPIN issued", "MPIN", "Expires"], "contractor reset MPIN proof");
    await captureMatrix("phase25f-owner-contractor-detail-actions");

    await loadAdminSession(prepared.ownerSession);
    await waitForText("Primary operation", "owner dashboard after contractor detail");
    await clickText("Reports");
    await waitForText("Report shortcuts", "reports landing");
    assertText(await pageText(), ["Report shortcuts", "QR status", "Contractor leaderboard"], "owner live reports landing");
    await captureMatrix("phase25f-owner-reports-landing");
    await clickText("QR status");
    await waitForText("Preview", "report preview");
    assertText(await pageText(), ["Preview", "QR status"], "owner report preview");
    await captureMatrix("phase25f-owner-report-preview");

    await clickText("Staff");
    await waitForText("Add staff", "staff management");
    assertText(await pageText(), ["Add staff", "Staff directory", "Create staff"], "owner staff management surface");
    await setInputByPlaceholder("Aarti Deshmukh", prepared.staffName);
    await setInputByPlaceholder("10 digit mobile", prepared.staffMobile);
    await clickText("Create staff");
    await waitForText("Temporary PIN issued", "staff create result");
    assertText(await pageText(), ["Temporary PIN issued", prepared.staffName, "Reset PIN", "Deactivate"], "owner staff created in list");
    await captureMatrix("phase25f-owner-staff-management");

    await loadAdminSession(prepared.staffSession);
    await waitForText("Staff access", "staff dashboard");
    await clickText("Contract");
    await waitForText("Read-only contractor directory", "staff contractor list");
    assertText(await pageText(), ["Read-only contractor directory", "cannot register", "Directory"], "staff contractor read-only list");
    await waitForText("Ramesh Sharma", "staff contractor directory data");
    await clickText("Ramesh Sharma");
    await waitForText("Read-only access", "staff contractor detail");
    assertText(await pageText(), ["Read-only access", "STAFF cannot edit"], "staff contractor detail read-only");
    await captureMatrix("phase25f-staff-contractor-readonly");

    if (proof.runtimeExceptions.length > 0 || proof.consoleErrors.length > 0) {
      proof.assertions.push({
        name: "runtime console",
        status: "FLAG",
        detail: "Console errors or runtime exceptions were observed; inspect proof JSON.",
      });
    } else {
      proof.assertions.push({ name: "runtime console", status: "PASS", detail: "No console errors or runtime exceptions captured." });
    }

    await writeFile(join(screenshotDir, "phase25f-admin-mobile-proof.json"), JSON.stringify(proof, null, 2));
    console.log(JSON.stringify({ status: "PASS", ...proof }, null, 2));
  } catch (error) {
    if (cdp) {
      await captureFailureState("phase25f-failure").catch(() => undefined);
    }
    proof.assertions.push({ name: "phase25f proof harness", status: "FAIL", detail: error instanceof Error ? error.message : String(error) });
    await mkdir(screenshotDir, { recursive: true });
    await writeFile(join(screenshotDir, "phase25f-admin-mobile-proof.json"), JSON.stringify(proof, null, 2));
    console.error(JSON.stringify({ status: "FAIL", ...proof }, null, 2));
    process.exitCode = 1;
  } finally {
    if (cdp) {
      await cdp.close().catch(() => undefined);
    }
    if (chrome) {
      chrome.kill("SIGTERM");
    }
    if (adminMobileServer) {
      try {
        process.kill(-adminMobileServer.pid, "SIGTERM");
      } catch {
        // Process already exited.
      }
    }
    if (apiServer) {
      try {
        process.kill(-apiServer.pid, "SIGTERM");
      } catch {
        // Process already exited.
      }
    }
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function ensureApiServer() {
  if (await adminMobileRoutesReady(apiBaseUrl)) {
    return;
  }
  const port = 3100 + Math.floor(Math.random() * 500);
  apiBaseUrl = `http://127.0.0.1:${port}/api`;
  apiServer = spawn("npm", ["run", "start", "--workspace", "@volt-rewards/api"], {
    cwd: repoRoot,
    detached: true,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitFor(() => adminMobileRoutesReady(apiBaseUrl), "updated API server with Admin Mobile parity routes", 30000);
}

async function adminMobileRoutesReady(baseUrl) {
  try {
    const [reports, staff] = await Promise.all([
      fetch(`${baseUrl}/admin-mobile/reports/landing`, { headers: ownerHeaders() }),
      fetch(`${baseUrl}/admin-mobile/staff`, { headers: ownerHeaders() }),
    ]);
    return reports.ok && staff.ok;
  } catch {
    return false;
  }
}

async function ensureAdminMobileServer() {
  if (await httpOk(adminMobileUrl)) {
    return;
  }
  adminMobileServer = spawn("npm", ["run", "web", "--workspace", "@volt-rewards/admin-mobile"], {
    cwd: repoRoot,
    detached: true,
    env: {
      ...process.env,
      EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitFor(() => httpOk(adminMobileUrl), "Admin Mobile web server", 45000);
}

async function prepareSessions() {
  const ownerLogin = await postJson("/auth/admin/login", { mobileNumber: "9000000091", pin: "1111", role: "OWNER" });
  const staffLogin = await postJson("/auth/admin/login", { mobileNumber: "9000000092", pin: "2222", role: "STAFF" });
  const stamp = String(Date.now()).slice(-8);
  const contractorName = `Vijay Kulkarni`;
  const staffName = `Priya Nair`;
  return {
    ownerSession: toStoredAdminSession(ownerLogin),
    staffSession: toStoredAdminSession(staffLogin),
    contractorName,
    contractorMobile: `91${stamp}`,
    staffName,
    staffMobile: `92${stamp}`,
    summary: {
      owner: ownerLogin.admin.name,
      staff: staffLogin.admin.name,
      contractorName,
      staffName,
    },
  };
}

function toStoredAdminSession(login) {
  return {
    token: login.session.token,
    expiresAt: login.session.expiresAt,
    role: login.admin.role,
    userId: login.admin.userId,
    name: login.admin.name,
    mobileNumber: login.admin.mobileNumber,
    ...(login.admin.staffId ? { staffId: login.admin.staffId } : {}),
  };
}

async function loadAdminSession(session) {
  await setViewport(390, 844);
  await cdp.send("Page.navigate", { url: adminMobileUrl });
  await waitForLoad();
  await evaluate(`
    localStorage.clear();
    localStorage.setItem("volt-admin-session-v1", ${JSON.stringify(JSON.stringify(session))});
    location.reload();
  `);
  await waitForLoad();
}

async function setInputByPlaceholder(placeholder, value) {
  const set = await evaluate(`
    (() => {
      const wanted = ${JSON.stringify(placeholder)};
      const input = [...document.querySelectorAll("input, textarea")]
        .find((candidate) => candidate.placeholder === wanted && !candidate.disabled);
      if (!input) {
        return false;
      }
      input.scrollIntoView({ block: "center", inline: "center" });
      const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, "value")?.set
        ?? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()
  `);
  if (!set) {
    throw new Error(`Could not set input with placeholder: ${placeholder}`);
  }
  await sleep(250);
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
  await sleep(700);
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
  const currentText = cdp ? (await pageText()).slice(0, 1000) : "";
  throw new Error(`Timed out waiting for ${label}. Current text: ${currentText}`);
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

async function postJson(path, body) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJsonResponse(response, path);
}

function ownerHeaders() {
  return {
    "x-actor-role": "OWNER",
    "x-actor-user-id": "owner_user_1",
  };
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

async function httpOk(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
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
