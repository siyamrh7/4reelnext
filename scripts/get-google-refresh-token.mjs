/**
 * One-time helper: exchanges a Google OAuth consent for a refresh token,
 * so the app can create Calendar events (with Meet links) as
 * info@4reelagency.nl without a service-account key (blocked by this org's
 * iam.managed.disableServiceAccountKeyCreation policy).
 *
 * Prereqs (console.cloud.google.com):
 *   1. APIs & Services → Library → enable "Google Calendar API".
 *   2. APIs & Services → OAuth consent screen → User type "Internal"
 *      (or "External" + add info@4reelagency.nl as a test user).
 *   3. APIs & Services → Credentials → Create Credentials → OAuth client ID
 *      → Application type "Web application" → under "Authorized redirect
 *      URIs" add EXACTLY:  http://localhost:8765/oauth2callback
 *   4. Copy the Client ID + Client Secret into 4reel-next/.env.local as
 *      GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET.
 *
 * Then run from the 4reel-next/ directory:
 *   node scripts/get-google-refresh-token.mjs
 *
 * It prints a URL — open it, log in as info@4reelagency.nl, click Allow.
 * The script catches the redirect, exchanges the code, and prints the
 * refresh token to paste into .env.local as GOOGLE_OAUTH_REFRESH_TOKEN.
 */
import { google } from 'googleapis';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

function readEnvLocal() {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in .env.local — add those first (see prereqs at the top of this script).');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces a refresh_token even if this account authorized before
  scope: ['https://www.googleapis.com/auth/calendar.events'],
});

console.log('\nOpen this URL, log in as info@4reelagency.nl, and click Allow:\n');
console.log(authUrl);
console.log(`\nWaiting for the redirect on ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404).end();
    return;
  }
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(`<p>Authorization failed: ${error}. You can close this tab.</p>`);
    console.error('Authorization denied/error:', error);
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<p>✅ Authorized — you can close this tab and go back to the terminal.</p>');
    console.log('Success! Add this to 4reel-next/.env.local:\n');
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    if (!tokens.refresh_token) {
      console.warn('No refresh_token came back — this Google account may have already granted this exact app consent before. Revoke access at myaccount.google.com/permissions for this app, then run this script again.');
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html' }).end('<p>Token exchange failed — check the terminal.</p>');
    console.error('Token exchange failed:', e.message);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);
