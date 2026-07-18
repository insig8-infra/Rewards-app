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
const adminMobileUrl = process.env.ADMIN_MOBILE_URL ?? "http://127.0.0.1:3003";
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const screenshotDir = join(repoRoot, ".planning/v1-agentic-build/evals/phase27/screenshots");
const profileDir = join("/tmp", `phase27-chrome-${Date.now()}`);
const chromePort = 9900 + Math.floor(Math.random() * 500);
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
    await cdp.send("Log.enable").catch(() => undefined);

    await proveEndUserLoginAndLanguage(prepared);
    await proveEndUserRewardsProfileAndBalanceBook(prepared);
    await proveTeamMemberRecentContractor(prepared);
    await proveAdminLoginAndRewards(prepared);

    if (proof.runtimeExceptions.length > 0 || proof.consoleErrors.length > 0) {
      proof.assertions.push({
        name: "runtime console",
        status: "FAIL",
        detail: "Console errors or runtime exceptions were observed.",
      });
      throw new Error("Console errors or runtime exceptions were observed.");
    }
    proof.assertions.push({ name: "runtime console", status: "PASS", detail: "No console errors or runtime exceptions captured." });

    await writeFile(join(screenshotDir, "phase27-mobile-readiness-proof.json"), JSON.stringify(proof, null, 2));
    console.log(JSON.stringify({ status: "PASS", ...proof }, null, 2));
  } catch (error) {
    if (cdp) {
      await captureFailureState("phase27-failure").catch(() => undefined);
    }
    proof.assertions.push({ name: "phase27 mobile readiness proof harness", status: "FAIL", detail: error instanceof Error ? error.message : String(error) });
    await mkdir(screenshotDir, { recursive: true });
    await writeFile(join(screenshotDir, "phase27-mobile-readiness-proof.json"), JSON.stringify(proof, null, 2));
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
  const demo = await prepareClientDemo();
  const ownerLogin = await postJson("/auth/admin/login", { mobileNumber: "9000000091", pin: "1111", role: "OWNER" });
  const proofReward = await createProofReward(ownerLogin.session.token);
  const contractorLogin = await postJson("/auth/contractor/login", {
    mobileNumber: demo.logins.contractor.mobileNumber,
    mpin: demo.logins.contractor.mpin,
  });
  let rewardCatalog = await getJson("/rewards/catalog", contractorLogin.session.token);
  let balanceBook = await getJson("/rewards/balance-book?limit=50", contractorLogin.session.token);
  const promotions = await getJson("/promotions/active", contractorLogin.session.token);

  const proofRewardCatalogItem = rewardCatalog.items.find((item) => item.rewardId === proofReward?.rewardId);
  let ensuredClaimId = proofRewardCatalogItem?.status === "CHOSEN" ? proofRewardCatalogItem.claimId : undefined;
  if (!ensuredClaimId && proofRewardCatalogItem?.status === "ELIGIBLE") {
    const redeemed = await postJson(`/rewards/${encodeURIComponent(proofRewardCatalogItem.rewardId)}/redeem`, {}, contractorLogin.session.token);
    ensuredClaimId = redeemed.claim?.claimId;
    rewardCatalog = await getJson("/rewards/catalog", contractorLogin.session.token);
    balanceBook = await getJson("/rewards/balance-book?limit=50", contractorLogin.session.token);
  }
  if (!ensuredClaimId) {
    ensuredClaimId = rewardCatalog.items.find((item) => item.status === "CHOSEN")?.claimId;
  }
  if (!ensuredClaimId) {
    const eligible = rewardCatalog.items.find((item) => item.status === "ELIGIBLE");
    if (eligible) {
      const redeemed = await postJson(`/rewards/${encodeURIComponent(eligible.rewardId)}/redeem`, {}, contractorLogin.session.token);
      ensuredClaimId = redeemed.claim?.claimId;
      rewardCatalog = await getJson("/rewards/catalog", contractorLogin.session.token);
      balanceBook = await getJson("/rewards/balance-book?limit=50", contractorLogin.session.token);
    }
  }

  const staffLogin = await postJson("/auth/admin/login", { mobileNumber: "9000000092", pin: "2222", role: "STAFF" });
  const ownerClaims = await getJson("/admin-mobile/rewards/claims", ownerLogin.session.token);
  const ownerHistory = await getJson("/admin-mobile/rewards/claims/history", ownerLogin.session.token);
  const ownerCatalog = await getJson("/admin-mobile/rewards/catalog", ownerLogin.session.token);
  const staffHistory = await getJson("/admin-mobile/rewards/claims/history", staffLogin.session.token);

  return {
    contractorLogin,
    demo,
    ownerLogin,
    staffLogin,
    ownerSession: toStoredAdminSession(ownerLogin),
    staffSession: toStoredAdminSession(staffLogin),
    contractorSession: toStoredSession("CONTRACTOR", contractorLogin.contractor, contractorLogin.session),
    firstPromotion: promotions[0],
    firstReward: rewardCatalog.items[0],
    firstVisibleReward: rewardCatalog.items.find((item) => !["CHOSEN", "FULFILLED"].includes(item.status)),
    firstBalanceEntry: balanceBook.entries[0],
    ensuredClaimId,
    summary: {
      contractor: contractorLogin.contractor.name,
      contractorMobile: demo.logins.contractor.mobileNumber,
      promotions: promotions.map((promotion) => promotion.title),
      proofReward: proofReward ? { code: proofReward.code, name: proofReward.name, status: proofReward.status } : null,
      rewardCount: rewardCatalog.items.length,
      rewardStatuses: rewardCatalog.items.map((item) => ({ name: item.name, status: item.status, claimId: item.claimId })),
      balanceBookEntries: balanceBook.entries.length,
      ensuredClaimId,
      adminOwnerClaims: ownerClaims.length,
      adminOwnerHistory: ownerHistory.length,
      adminOwnerCatalog: ownerCatalog.length,
      adminStaffHistory: staffHistory.length,
    },
  };
}

async function createProofReward(ownerToken) {
  const stamp = String(Date.now()).slice(-8);
  try {
    const existingCatalog = await getJson("/admin-mobile/rewards/catalog", ownerToken).catch(() => []);
    const existingProofDraft = existingCatalog.find((item) => item.code?.startsWith("P27-") && item.status === "DRAFT");
    const input = existingProofDraft
      ? {
          code: existingProofDraft.code,
          name: existingProofDraft.name,
          quickDescription: existingProofDraft.quickDescription,
          cashValueInr: existingProofDraft.cashValueInr,
          pointsRequired: existingProofDraft.pointsRequired,
          totalQuantity: existingProofDraft.totalQuantity,
          status: "DRAFT",
        }
      : {
          code: `P27-${stamp}`,
          name: `Phase 27 Proof Reward ${stamp}`,
          quickDescription: "Small proof reward for mobile readiness gate.",
          cashValueInr: 1,
          pointsRequired: 1,
          totalQuantity: 1,
          status: "DRAFT",
        };
    const created = existingProofDraft ?? await postJson(
      "/admin-mobile/rewards/catalog",
      input,
      ownerToken,
    );
    if (!created.images || created.images.length === 0) {
      await postJson(
        `/admin-mobile/rewards/catalog/${encodeURIComponent(created.rewardId)}/images`,
        {
          fileName: `${input.code}.png`,
          contentType: "image/png",
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
          altText: input.name,
        },
        ownerToken,
      );
    }
    return await patchJson(
      `/admin-mobile/rewards/catalog/${encodeURIComponent(created.rewardId)}`,
      {
        ...input,
        status: "ACTIVE",
      },
      ownerToken,
    );
  } catch (error) {
    proof.assertions.push({
      name: "phase27 proof reward seed",
      status: "FLAG",
      detail: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function prepareClientDemo() {
  const { stdout } = await execFileAsync(process.execPath, ["tools/prepare-client-demo.mjs"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
    },
    maxBuffer: 1024 * 1024,
  });
  const lines = stdout.split(/\r?\n/);
  const jsonStart = lines.findIndex((line) => line.trim().startsWith("{"));
  if (jsonStart < 0) {
    throw new Error(`Could not parse prepare-client-demo output: ${stdout}`);
  }
  return JSON.parse(lines.slice(jsonStart).join("\n"));
}

async function proveEndUserLoginAndLanguage(prepared) {
  await openFreshMobile();
  await waitForText("Welcome Back", "end-user contractor login");
  assertText(await pageText(), ["Volt Rewards", "Contractor", "Team Member", "Mobile number", "4-digit MPIN", "EN"], "end-user login shell");

  await typeByLabel("Mobile number", prepared.demo.logins.contractor.mobileNumber);
  await typeByLabel("4-digit MPIN", prepared.demo.logins.contractor.mpin);
  assertTextAbsent(await pageText(), [prepared.demo.logins.contractor.mpin], "contractor MPIN hidden before reveal");
  await clickText("Show");
  await waitForText("Hide", "contractor MPIN reveal toggled");
  await captureMatrix("phase27-mobile-login-reveal");

  await clickText("EN");
  await waitFor(() => pageText().then((body) => /[\u0900-\u097F]/.test(body) && !normalizeText(body).includes("welcome back")), "Hindi language toggle");
  proof.assertions.push({ name: "end-user Hindi language toggle", status: "PASS", detail: "Visible login copy switched to Devanagari text." });
  await captureMatrix("phase27-mobile-login-hindi");

  await clickText("EN");
  await waitForText("Welcome Back", "end-user language toggle back to English");
  await typeByLabel("Mobile number", prepared.demo.logins.contractor.mobileNumber);
  await typeByLabel("4-digit MPIN", prepared.demo.logins.contractor.mpin);
  await clickText("Login");
  await waitForText(`Namaste, ${firstName(prepared.contractorLogin.contractor.name)}`, "contractor dashboard after visible login");
}

async function proveEndUserRewardsProfileAndBalanceBook(prepared) {
  if (prepared.firstPromotion) {
    const promotionTitle = prepared.firstPromotion.overlayText || prepared.firstPromotion.title;
    await waitForText(promotionTitle, "dashboard promotion title");
    await waitForText(prepared.firstPromotion.body, "dashboard promotion body");
    assertText(await pageText(), [promotionTitle, prepared.firstPromotion.body], "dashboard promotion banner");
  }
  assertText(await pageText(), ["Points available", "Featured Rewards", "Balance Book", "Scan QR"], "contractor dashboard reward shell");
  await captureMatrix("phase27-mobile-dashboard-promotions");

  await clickText("Rewards");
  await waitForText("Points available", "contractor rewards tab");
  assertText(await pageText(), ["Rewards", "Available rewards", "Balance Book", "Lifetime collected", "Tier"], "contractor rewards overview");
  if (prepared.firstVisibleReward) {
    assertText(await pageText(), [prepared.firstVisibleReward.name], "contractor rewards list data");
  }
  await captureMatrix("phase27-mobile-rewards");

  await clickText("Balance Book");
  await waitForText("Search Balance Book", "contractor balance book");
  assertText(await pageText(), ["Balance Book", "Search Balance Book", "Filter", "Sort", "Credits", "Reward claims"], "contractor balance book controls");
  if (prepared.firstBalanceEntry) {
    assertText(await pageText(), [String(prepared.firstBalanceEntry.balanceAfter)], "contractor balance book backend row");
  }
  await captureMatrix("phase27-mobile-balance-book");

  await loadMobileSession(prepared.contractorSession);
  await waitForText(`Namaste, ${firstName(prepared.contractorLogin.contractor.name)}`, "contractor dashboard before profile proof");
  await clickByAriaLabel("Profile");
  await waitForText("Profile photo", "contractor profile");
  assertText(await pageText(), ["Profile", "Profile photo", "Use a PNG or JPEG under 2 MB.", "Change MPIN", "Old MPIN", "New MPIN"], "contractor profile controls");
  await assertFileInput("Choose profile photo");
  await clickByAriaLabel("Show");
  await waitForText("Hide", "profile MPIN reveal toggled");
  await captureMatrix("phase27-mobile-profile");
}

async function proveTeamMemberRecentContractor(prepared) {
  await openFreshMobile();
  await waitForText("Team Member", "team member login option");
  await clickText("Team Member");
  await waitForText("Contractor mobile number", "team member login form");
  await typeByLabel("Contractor mobile number", prepared.demo.logins.teamMember.contractorMobileNumber);
  await typeByLabel("Your mobile number", prepared.demo.logins.teamMember.teamMemberMobile);
  await clickText("Send OTP to Contractor");
  await waitForText("Dev OTP", "team member dev otp");
  const otpMatch = await waitForPattern(/Dev OTP:\s*(\d{6})/, "team member OTP value");
  await typeByLabel("OTP", otpMatch[1]);
  await clickText("Verify OTP");
  await waitForText("Logged in for contractor", "team member authenticated session");

  const recent = await evaluate(`
    JSON.parse(localStorage.getItem("volt-rewards:team-member-recent-contractor") || "null")
  `);
  if (!recent || recent.name !== prepared.contractorLogin.contractor.name || recent.mobileNumber !== prepared.demo.logins.teamMember.contractorMobileNumber) {
    proof.assertions.push({ name: "team member recent contractor storage", status: "FAIL", detail: JSON.stringify(recent) });
    throw new Error(`Unexpected Team Member recent contractor storage: ${JSON.stringify(recent)}`);
  }
  proof.assertions.push({ name: "team member recent contractor storage", status: "PASS", detail: `${recent.name} | ${recent.mobileNumber}` });

  await clickTextDom("Logout");
  await waitForText("Recent contractor", "team member recent contractor card");
  assertText(await pageText(), ["Recent contractor", prepared.contractorLogin.contractor.name, prepared.demo.logins.teamMember.contractorMobileNumber, "Use recent", "Clear"], "team member recent contractor visible");
  await captureMatrix("phase27-mobile-team-recent-contractor");

  await clickTextDom("Clear");
  await waitFor(async () => {
    const body = await pageText();
    return !normalizeText(body).includes("recent contractor");
  }, "team member recent contractor cleared from UI");
  const cleared = await evaluate(`localStorage.getItem("volt-rewards:team-member-recent-contractor")`);
  if (cleared !== null) {
    proof.assertions.push({ name: "team member recent contractor clear", status: "FAIL", detail: String(cleared) });
    throw new Error("Team Member recent contractor was not cleared from local storage.");
  }
  proof.assertions.push({ name: "team member recent contractor clear", status: "PASS", detail: "UI card and local storage cleared." });
}

async function proveAdminLoginAndRewards(prepared) {
  await openFreshAdmin();
  await waitForText("Operations console", "admin mobile login");
  assertText(await pageText(), ["Volt Admin", "OWNER", "STAFF", "Mobile number", "PIN", "Sign in"], "admin login shell");
  await assertAriaButton("Show PIN");
  await clickByAriaLabel("Show PIN");
  await waitForAriaLabel("Hide PIN", "admin PIN reveal toggled");
  await captureMatrix("phase27-admin-login-reveal");
  await clickText("Sign in");
  await waitForText("Primary operation", "admin owner dashboard after visible login");

  await clickText("Rewards");
  await waitForText("OWNER rewards", "owner rewards");
  assertText(await pageText(), ["Rewards", "Claim Desk", "History", "Catalog"], "owner rewards sections");
  if (prepared.ensuredClaimId) {
    await waitForText(prepared.ensuredClaimId, "owner active reward claim");
    assertText(await pageText(), [prepared.ensuredClaimId, "Send OTP", "Mark Delivered", "Backend re-checks active Claim Raised"], "owner reward fulfillment controls");
  }
  await captureMatrix("phase27-admin-owner-rewards-claims");

  await clickText("Catalog");
  await waitForText("Catalog Management", "owner rewards catalog");
  assertText(await pageText(), ["Catalog Management", "Reward code", "Reward name", "Save reward", "Upload image", "Catalog"], "owner reward catalog controls");
  await captureMatrix("phase27-admin-owner-rewards-catalog");

  await loadAdminSession(prepared.staffSession);
  await waitForText("Staff access", "staff dashboard");
  await clickText("Rewards");
  await waitForText("STAFF history", "staff rewards history");
  assertText(await pageText(), ["Rewards", "STAFF history", "Reward History"], "staff reward history visible");
  assertTextAbsent(await pageText(), ["Claim Desk", "Catalog Management", "Send OTP", "Mark Delivered", "Save reward", "Upload image"], "staff rewards mutation controls hidden");
  await captureMatrix("phase27-admin-staff-rewards-readonly");
}

async function openFreshMobile() {
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

async function openFreshAdmin() {
  await setViewport(390, 844);
  await cdp.send("Page.navigate", { url: adminMobileUrl });
  await waitForLoad();
  await evaluate(`
    localStorage.clear();
    location.reload();
  `);
  await waitForLoad();
}

async function loadMobileSession(session) {
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

function firstName(name) {
  return String(name).trim().split(/\s+/)[0] ?? name;
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

async function clickDashboardAvatar() {
  const clicked = await evaluate(`
    (() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      const candidates = [...document.querySelectorAll('[role="button"], button')]
        .filter((element) => visible(element))
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.top > 80 && rect.top < 260 && rect.left > window.innerWidth * 0.55)
        .sort((left, right) => left.rect.top - right.rect.top || right.rect.left - left.rect.left);
      const match = candidates[0]?.element;
      if (!match) {
        return false;
      }
      match.scrollIntoView({ block: "center", inline: "center" });
      const rect = match.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()
  `);
  if (!clicked) {
    throw new Error("Could not click dashboard avatar/profile button.");
  }
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: clicked.x, y: clicked.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: clicked.x, y: clicked.y, button: "left", clickCount: 1 });
  await sleep(600);
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
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()
  `);
  if (!clicked) {
    throw new Error(`Could not click visible text: ${text}`);
  }
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: clicked.x, y: clicked.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: clicked.x, y: clicked.y, button: "left", clickCount: 1 });
  await sleep(600);
}

async function clickTextDom(text) {
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
      clickable.click();
      return true;
    })()
  `);
  if (!clicked) {
    throw new Error(`Could not DOM-click visible text: ${text}`);
  }
  await sleep(600);
}

async function clickByAriaLabel(label) {
  const clicked = await evaluate(`
    (() => {
      const label = ${JSON.stringify(label)};
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      const element = [...document.querySelectorAll('[aria-label]')]
        .find((candidate) => candidate.getAttribute("aria-label") === label && visible(candidate));
      if (!element) {
        return false;
      }
      element.scrollIntoView({ block: "center", inline: "center" });
      element.click();
      return true;
    })()
  `);
  if (!clicked) {
    throw new Error(`Could not click aria-label: ${label}`);
  }
  await sleep(500);
}

async function assertAriaButton(label) {
  const exists = await evaluate(`
    [...document.querySelectorAll('[aria-label]')]
      .some((candidate) => candidate.getAttribute("aria-label") === ${JSON.stringify(label)})
  `);
  if (!exists) {
    proof.assertions.push({ name: `aria button ${label}`, status: "FAIL", detail: "Button not found." });
    throw new Error(`Expected aria-label button was not found: ${label}`);
  }
  proof.assertions.push({ name: `aria button ${label}`, status: "PASS", detail: "Button found." });
}

async function waitForAriaLabel(label, context) {
  await waitFor(async () => evaluate(`
    [...document.querySelectorAll('[aria-label]')]
      .some((candidate) => candidate.getAttribute("aria-label") === ${JSON.stringify(label)})
  `), context);
}

async function assertFileInput(label) {
  const result = await evaluate(`
    (() => {
      const input = [...document.querySelectorAll('input[type="file"]')]
        .find((candidate) => candidate.getAttribute("aria-label") === ${JSON.stringify(label)});
      if (!input) {
        return null;
      }
      return {
        accept: input.getAttribute("accept") || "",
        disabled: Boolean(input.disabled),
      };
    })()
  `);
  if (!result) {
    proof.assertions.push({ name: "profile photo file input", status: "FAIL", detail: "File input not found." });
    throw new Error("Profile photo file input was not found.");
  }
  if (result.disabled || !result.accept.includes("image/png") || !result.accept.includes("image/jpeg")) {
    proof.assertions.push({ name: "profile photo file input", status: "FAIL", detail: JSON.stringify(result) });
    throw new Error(`Profile photo file input has unexpected state: ${JSON.stringify(result)}`);
  }
  proof.assertions.push({ name: "profile photo file input", status: "PASS", detail: result.accept });
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

function assertTextAbsent(text, forbidden, name) {
  const normalizedText = normalizeText(text);
  const present = forbidden.filter((item) => normalizedText.includes(normalizeText(item)));
  if (present.length > 0) {
    proof.assertions.push({ name, status: "FAIL", detail: `Unexpected: ${present.join(", ")}` });
    throw new Error(`${name} found unexpected text: ${present.join(", ")}`);
  }
  proof.assertions.push({ name, status: "PASS", detail: `Absent: ${forbidden.join(", ")}` });
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
  const currentText = cdp ? (await pageText()).slice(0, 1200) : "";
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

async function getJson(path, bearerToken) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: bearerToken ? { authorization: `Bearer ${bearerToken}` } : {},
  });
  return readJsonResponse(response, path);
}

async function postJson(path, body, bearerToken) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return readJsonResponse(response, path);
}

async function patchJson(path, body, bearerToken) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
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
