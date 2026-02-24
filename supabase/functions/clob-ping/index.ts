import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const POLY_ADDRESS = Deno.env.get("POLY_ADDRESS") ?? "";
const API_KEY = Deno.env.get("POLY_CLOB_API_KEY") ?? "";
const API_SECRET = Deno.env.get("POLY_CLOB_API_SECRET") ?? "";
const API_PASSPHRASE = Deno.env.get("POLY_CLOB_API_PASSPHRASE") ?? "";
const API_HOST = (Deno.env.get("POLY_CLOB_HOST") ?? "https://clob.polymarket.com").replace(/\/$/, "");

// Use a documented GET endpoint
const PATH = "/orders";

function base64UrlToBytes(b64url: string): Uint8Array {
  // Polymarket secrets are base64-url; normalize to base64 for atob
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
  // url-safe base64, keep '=' padding
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

async function buildPolyHmacSignature(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
  body?: string,
): Promise<string> {
  let message = `${timestamp}${method}${requestPath}`;
  if (body !== undefined) message += body;

  const keyBytes = base64UrlToBytes(secret); // IMPORTANT: decode secret
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  );

  return bytesToBase64Url(new Uint8Array(sigBuf));
}

serve(async () => {
  if (!POLY_ADDRESS || !API_KEY || !API_SECRET || !API_PASSPHRASE) {
    return new Response(
      JSON.stringify({
        error:
          "Missing secrets. Need POLY_ADDRESS + POLY_CLOB_API_KEY + POLY_CLOB_API_SECRET + POLY_CLOB_API_PASSPHRASE + POLY_CLOB_HOST",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const method = "GET";

  const signature = await buildPolyHmacSignature(
    API_SECRET,
    timestamp,
    method,
    PATH,
  );

  const resp = await fetch(`${API_HOST}${PATH}`, {
    method,
    headers: {
      "POLY_ADDRESS": POLY_ADDRESS,
      "POLY_API_KEY": API_KEY,
      "POLY_PASSPHRASE": API_PASSPHRASE,
      "POLY_SIGNATURE": signature,
      "POLY_TIMESTAMP": timestamp,
    },
  });

  const bodyText = await resp.text();
  return new Response(bodyText, {
    status: resp.status,
    headers: { "Content-Type": resp.headers.get("content-type") ?? "application/json" },
  });
});
import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

const API_KEY = Deno.env.get('POLY_CLOB_API_KEY') ?? '';
const API_SECRET = Deno.env.get('POLY_CLOB_API_SECRET') ?? '';
const API_PASSPHRASE = Deno.env.get('POLY_CLOB_API_PASSPHRASE') ?? '';
const API_HOST = (Deno.env.get('POLY_CLOB_HOST') ?? 'https://clob.polymarket.com').replace(/\/$/, '');
const PATH = '/balances';

const encoder = new TextEncoder();

async function sign(message: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(API_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async () => {
  if (!API_KEY || !API_SECRET || !API_PASSPHRASE) {
    return new Response(JSON.stringify({ error: 'Polymarket credentials are not configured' }), { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}GET${PATH}`;
  const signature = await sign(message);

  const response = await fetch(`${API_HOST}${PATH}`, {
    method: 'GET',
    headers: {
      'POLY-API-KEY': API_KEY,
      'POLY-API-SIGNATURE': signature,
      'POLY-API-TIMESTAMP': timestamp,
      'POLY-API-PASSPHRASE': API_PASSPHRASE,
    },
  });

  const body = await response.text();
  const contentType = response.headers.get('content-type') ?? 'application/json';

  return new Response(body, {
    status: response.status,
    headers: { 'Content-Type': contentType },
  });
});
