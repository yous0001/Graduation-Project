let baseURL;
let readyPromise;

async function waitForServerReady(
  path = "/unknown-endpoint",
  timeoutMs = 8000
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseURL}${path}`);
      if (res.status === 404 || res.status === 200) return true;
    } catch (error) {
      console.error("Error waiting for server ready:", error);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

export async function ensureServer() {
  if (!readyPromise) {
    // Import index.js to start the server as-is
    readyPromise = (async () => {
      await import("../../index.js");
      const port = Number(process.env.PORT) || 3000;
      baseURL = `http://localhost:${port}`;
      const ok = await waitForServerReady();
      if (!ok) throw new Error("Server did not become ready in time");
      return baseURL;
    })();
  }
  return readyPromise;
}

export function getBaseURL() {
  if (!baseURL) throw new Error("Server not ready. Call ensureServer() first.");
  return baseURL;
}
