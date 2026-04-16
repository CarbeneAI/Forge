#!/usr/bin/env bun
/**
 * OAuth2Setup.ts - Gmail OAuth2 browser-based authentication flow
 *
 * Usage:
 *   bun OAuth2Setup.ts --account personal
 *   bun OAuth2Setup.ts --account workspace
 *
 * Opens browser for user consent, encrypts refresh token with AES-256-GCM,
 * stores to data/oauth-tokens.json
 */

import { google, Auth } from "googleapis";
import * as http from "http";
import * as url from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { parseArgs } from "util";

// Types
interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

interface EncryptedToken {
  encrypted: string;
  iv: string;
  tag: string;
  email: string;
  created: string;
  scopes: string[];
}

interface TokenStore {
  personal?: EncryptedToken;
  workspace?: EncryptedToken;
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const TOKEN_FILE = path.join(DATA_DIR, "oauth-tokens.json");
const REDIRECT_URI = "http://localhost:8888/oauth2callback";

// Gmail + Calendar scopes - Phase 3: full access
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Load environment variables from .env
 */
function loadEnv(): {
  clientId: string;
  clientSecret: string;
  encryptionKey: Buffer;
} {
  const envPath = path.join(
    process.env.HOME || "",
    ".claude",
    ".env"
  );

  if (!fs.existsSync(envPath)) {
    console.error("Error: ~/.claude/.env not found");
    console.error("Please create it with GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, EMAIL_ENCRYPTION_KEY");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }

  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET;
  const encryptionKeyHex = env.EMAIL_ENCRYPTION_KEY;

  if (!clientId || !clientSecret) {
    console.error("Error: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in ~/.claude/.env");
    process.exit(1);
  }

  if (!encryptionKeyHex || encryptionKeyHex.length !== 64) {
    console.error("Error: EMAIL_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)");
    console.error("Generate one with: openssl rand -hex 32");
    process.exit(1);
  }

  return {
    clientId,
    clientSecret,
    encryptionKey: Buffer.from(encryptionKeyHex, "hex"),
  };
}

/**
 * Encrypt token data with AES-256-GCM
 */
function encryptToken(token: TokenData, key: Buffer): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(JSON.stringify(token), "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt token data
 */
function decryptToken(data: EncryptedToken, key: Buffer): TokenData {
  const iv = Buffer.from(data.iv, "base64");
  const tag = Buffer.from(data.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

/**
 * Load existing token store
 */
function loadTokenStore(): TokenStore {
  if (!fs.existsSync(TOKEN_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
}

/**
 * Save token store with secure permissions
 */
function saveTokenStore(store: TokenStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(store, null, 2));
  fs.chmodSync(TOKEN_FILE, 0o600);
}

/**
 * Get user email from Google
 */
async function getUserEmail(auth: Auth.OAuth2Client): Promise<string> {
  const oauth2 = google.oauth2({ version: "v2", auth });
  const { data } = await oauth2.userinfo.get();
  return data.email || "unknown";
}

/**
 * Open browser for authorization
 */
async function openBrowser(url: string): Promise<void> {
  const { exec } = await import("child_process");

  // Try different browsers based on platform
  const commands = [
    `xdg-open "${url}"`, // Linux
    `open "${url}"`, // macOS
    `start "" "${url}"`, // Windows
  ];

  for (const cmd of commands) {
    try {
      exec(cmd);
      return;
    } catch {
      continue;
    }
  }

  console.log("\nCouldn't open browser automatically.");
  console.log("Please open this URL manually:");
  console.log(url);
}

/**
 * Run OAuth2 flow
 */
async function runOAuth(account: "personal" | "workspace"): Promise<void> {
  console.log(`\nStarting OAuth2 flow for ${account} account...`);

  const { clientId, clientSecret, encryptionKey } = loadEnv();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent to get refresh token
  });

  console.log("\nOpening browser for authorization...");
  await openBrowser(authUrl);

  // Start local server to receive callback
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const queryUrl = new url.URL(req.url || "", `http://localhost:8888`);

        if (queryUrl.pathname === "/oauth2callback") {
          const code = queryUrl.searchParams.get("code");

          if (!code) {
            res.writeHead(400);
            res.end("Error: No authorization code received");
            server.close();
            reject(new Error("No authorization code received"));
            return;
          }

          // Exchange code for tokens
          console.log("\nExchanging authorization code for tokens...");
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          // Get user email
          const email = await getUserEmail(oauth2Client);
          console.log(`Authorized as: ${email}`);

          // Encrypt and store tokens
          const tokenData: TokenData = {
            access_token: tokens.access_token || "",
            refresh_token: tokens.refresh_token || "",
            expiry_date: tokens.expiry_date || 0,
            token_type: tokens.token_type || "Bearer",
            scope: tokens.scope || SCOPES.join(" "),
          };

          const encrypted = encryptToken(tokenData, encryptionKey);
          const encryptedToken: EncryptedToken = {
            ...encrypted,
            email,
            created: new Date().toISOString(),
            scopes: SCOPES,
          };

          // Load existing store and update
          const store = loadTokenStore();
          store[account] = encryptedToken;
          saveTokenStore(store);

          console.log(`\nTokens encrypted and saved to ${TOKEN_FILE}`);
          console.log("File permissions set to 600 (owner read/write only)");

          // Send success response
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Authorization Successful</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: #1a1a2e;
                  color: #eaeaea;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                  background: #16213e;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                h1 { color: #4ecca3; }
                p { color: #a0a0a0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Authorization Successful!</h1>
                <p>Account: ${email}</p>
                <p>Type: ${account}</p>
                <p>You can close this window.</p>
              </div>
            </body>
            </html>
          `);

          server.close();
          resolve();
        }
      } catch (error) {
        res.writeHead(500);
        res.end(`Error: ${error}`);
        server.close();
        reject(error);
      }
    });

    server.listen(8888, () => {
      console.log("Waiting for authorization callback on http://localhost:8888/oauth2callback");
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 5 * 60 * 1000);
  });
}

/**
 * Main
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      account: { type: "string", short: "a" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
OAuth2Setup.ts - Gmail OAuth2 browser-based authentication flow

Usage:
  bun OAuth2Setup.ts --account personal
  bun OAuth2Setup.ts --account workspace

Options:
  -a, --account  Account type: 'personal' or 'workspace'
  -h, --help     Show this help message

Prerequisites:
  1. Create Google Cloud project with Gmail API enabled
  2. Create OAuth2 credentials (Web application type)
  3. Add http://localhost:8888/oauth2callback to authorized redirect URIs
  4. Set in ~/.claude/.env:
     - GMAIL_CLIENT_ID=your-client-id
     - GMAIL_CLIENT_SECRET=your-client-secret
     - EMAIL_ENCRYPTION_KEY=$(openssl rand -hex 32)
`);
    process.exit(0);
  }

  if (!values.account || !["personal", "workspace"].includes(values.account)) {
    console.error("Error: --account must be 'personal' or 'workspace'");
    process.exit(1);
  }

  try {
    await runOAuth(values.account as "personal" | "workspace");
    console.log("\nOAuth2 setup complete!");
  } catch (error) {
    console.error("\nOAuth2 setup failed:", error);
    process.exit(1);
  }
}

main();
