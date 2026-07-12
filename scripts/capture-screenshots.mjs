import { spawn } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1080, height: 1080 },
  { width: 640, height: 1024 },
  { width: 390, height: 844 },
];

const DEFAULT_URL = "http://127.0.0.1:3000";
const DEFAULT_OUTPUT_DIRECTORY = "artifacts/screenshots";

function usage() {
  return [
    "Usage: pnpm screenshot -- [URL] [--output DIRECTORY] [--viewport-only]",
    "",
    "Captures 1920, 1080, 640, and 390px layouts with Google Chrome.",
    "The default is a full-page PNG for each viewport.",
  ].join("\n");
}

function parseOptions(arguments_) {
  const optionsArguments =
    arguments_[0] === "--" ? arguments_.slice(1) : arguments_;
  const options = {
    fullPage: true,
    outputDirectory: DEFAULT_OUTPUT_DIRECTORY,
    plan: false,
    url: DEFAULT_URL,
  };
  const positional = [];

  for (let index = 0; index < optionsArguments.length; index += 1) {
    const argument = optionsArguments[index];

    if (argument === "--") {
      positional.push(...optionsArguments.slice(index + 1));
      break;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--plan") {
      options.plan = true;
    } else if (argument === "--viewport-only") {
      options.fullPage = false;
    } else if (argument === "--output") {
      const outputDirectory = arguments_[index + 1];
      if (!outputDirectory || outputDirectory.startsWith("--")) {
        throw new Error("--output requires a directory path.");
      }
      options.outputDirectory = outputDirectory;
      index += 1;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }

  if (positional.length > 1) {
    throw new Error("Pass only one URL.");
  }

  if (positional[0]) {
    options.url = positional[0];
  }

  const url = new URL(options.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs can be captured.");
  }

  return options;
}

async function isExecutable(path) {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate.includes("/")) {
      return candidate;
    }

    if (await isExecutable(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Google Chrome was not found. Install it or set CHROME_PATH to its executable.",
  );
}

function sleep(milliseconds) {
  return new Promise((resolve_) => setTimeout(resolve_, milliseconds));
}

async function waitForDevToolsPort(profileDirectory) {
  const portFile = join(profileDirectory, "DevToolsActivePort");
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split("\n");
      if (port) {
        return Number(port);
      }
    } catch {
      await sleep(100);
    }
  }

  throw new Error("Chrome did not start its remote debugging endpoint within 15 seconds.");
}

function requestJson(port, path) {
  return new Promise((resolve_, reject) => {
    const request = http.request(
      { host: "127.0.0.1", port, path, method: "GET" },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode !== 200) {
            reject(new Error(`Chrome debugging endpoint returned ${response.statusCode}.`));
            return;
          }

          try {
            resolve_(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.once("error", reject);
    request.end();
  });
}

class CdpSession {
  constructor(webSocketUrl) {
    this.webSocket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();

    this.webSocket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;

        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
        return;
      }

      const listeners = this.events.get(message.method) ?? [];
      for (const listener of listeners.splice(0)) {
        listener(message.params);
      }
    });
  }

  async open() {
    await new Promise((resolve_, reject) => {
      this.webSocket.addEventListener("open", resolve_, { once: true });
      this.webSocket.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve_, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      this.pending.set(id, { resolve: resolve_, reject });
      this.webSocket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent(method, timeout = 15_000) {
    return new Promise((resolve_, reject) => {
      const listeners = this.events.get(method) ?? [];
      const timer = setTimeout(() => {
        this.events.set(
          method,
          (this.events.get(method) ?? []).filter((listener) => listener !== onEvent),
        );
        reject(new Error(`Timed out waiting for ${method}.`));
      }, timeout);

      const onEvent = (params) => {
        clearTimeout(timer);
        resolve_(params);
      };

      listeners.push(onEvent);
      this.events.set(method, listeners);
    });
  }

  close() {
    this.webSocket.close();
  }
}

async function captureViewport(session, url, outputDirectory, viewport, fullPage) {
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const loaded = session.waitForEvent("Page.loadEventFired");
  const navigation = await session.send("Page.navigate", { url });
  if (navigation.errorText) {
    throw new Error(`Could not load ${url}: ${navigation.errorText}`);
  }
  await loaded;

  await session.send("Runtime.evaluate", {
    expression: "document.fonts?.ready ?? Promise.resolve()",
    awaitPromise: true,
  });
  await sleep(300);
  await session.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });

  const captureOptions = { format: "png", fromSurface: true };
  if (fullPage) {
    const { contentSize } = await session.send("Page.getLayoutMetrics");
    captureOptions.captureBeyondViewport = true;
    captureOptions.clip = {
      x: 0,
      y: 0,
      width: viewport.width,
      height: Math.ceil(contentSize.height),
      scale: 1,
    };
  }

  const { data } = await session.send("Page.captureScreenshot", captureOptions);
  const outputPath = join(outputDirectory, `${viewport.width}.png`);
  await writeFile(outputPath, Buffer.from(data, "base64"));
  return outputPath;
}

async function stopChrome(child, profileDirectory) {
  if (!child.killed) {
    child.kill("SIGTERM");
  }

  await Promise.race([
    new Promise((resolve_) => child.once("close", resolve_)),
    sleep(2_000),
  ]);

  if (!child.killed) {
    child.kill("SIGKILL");
  }

  await rm(profileDirectory, { force: true, recursive: true });
}

async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  if (options.plan) {
    console.log(JSON.stringify(VIEWPORTS));
    return;
  }

  const chrome = await findChrome();
  const outputDirectory = resolve(options.outputDirectory);
  const profileDirectory = await mkdtemp(join(tmpdir(), "zerosourcing-screenshot-"));
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--hide-scrollbars",
      "--no-first-run",
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileDirectory}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let session;
  try {
    await mkdir(outputDirectory, { recursive: true });
    const port = await waitForDevToolsPort(profileDirectory);
    const targets = await requestJson(port, "/json/list");
    const page = targets.find((target) => target.type === "page");
    if (!page?.webSocketDebuggerUrl) {
      throw new Error("Chrome did not expose a page to capture.");
    }

    session = new CdpSession(page.webSocketDebuggerUrl);
    await session.open();
    await session.send("Page.enable");

    for (const viewport of VIEWPORTS) {
      const outputPath = await captureViewport(
        session,
        options.url,
        outputDirectory,
        viewport,
        options.fullPage,
      );
      console.log(`Captured ${viewport.width}px: ${outputPath}`);
    }
  } finally {
    session?.close();
    await stopChrome(child, profileDirectory);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
