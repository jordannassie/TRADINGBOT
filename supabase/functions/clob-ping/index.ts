import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const API_KEY = Deno.env.get("POLY_CLOB_API_KEY") ?? "";
const API_SECRET = Deno.env.get("POLY_CLOB_API_SECRET") ?? "";
const API_PASSPHRASE = Deno.env.get("POLY_CLOB_API_PASSPHRASE") ?? "";
const API_HOST = (Deno.env.get("POLY_CLOB_HOST") ?? "https://clob.polymarket.com").replace(/\/$/, "");

const PATH = "/api/auth/me";

function base64UrlToBytes(b64url: string): Uint8Array {
  const base64 = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/=]/g, "");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

async function buildSignature(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body?: string,
): Promise<string> {
  let message = `${timestamp}${method}${path}`;
  if (body) message += body;
  const keyBytes = base64UrlToBytes(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return bytesToBase64Url(new Uint8Array(sigBuf));
}

serve(async () => {
  const missing = [];
  if (!API_KEY) missing.push("POLY_CLOB_API_KEY");
  if (!API_SECRET) missing.push("POLY_CLOB_API_SECRET");
  if (!API_PASSPHRASE) missing.push("POLY_CLOB_API_PASSPHRASE");
  if (!API_HOST) missing.push("POLY_CLOB_HOST");

  if (missing.length) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Missing env: ${missing.join(", ")}`,
        endpoint: PATH,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const method = "GET";
  const signature = await buildSignature(API_SECRET, timestamp, method, PATH);

  const resp = await fetch(`${API_HOST}${PATH}`, {
    method,
    headers: {
      "POLY-API-KEY": API_KEY,
      "POLY-API-SIGNATURE": signature,
      "POLY-API-TIMESTAMP": timestamp,
      "POLY-API-PASSPHRASE": API_PASSPHRASE,
    },
  });

  const jsonText = await resp.text();
  const contentType = resp.headers.get("content-type") ?? "application/json";
  const success = resp.ok;

  const payload = success
    ? {
        ok: true,
        status: resp.status,
        endpoint: PATH,
        serverTime: timestamp,
        body: JSON.parse(jsonText || "null"),
      }
    : {
        ok: false,
        status: resp.status,
        endpoint: PATH,
        error: resp.statusText,
      };

  return new Response(JSON.stringify(payload), {
    status: success ? 200 : resp.status,
    headers: { "Content-Type": "application/json" },
  });
});
