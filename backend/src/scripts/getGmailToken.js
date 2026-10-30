require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const readline = require('readline');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const rawClientId = process.env.GMAIL_CLIENT_ID ? process.env.GMAIL_CLIENT_ID.trim() : '';
const rawClientSecret = process.env.GMAIL_CLIENT_SECRET ? process.env.GMAIL_CLIENT_SECRET.trim() : '';
const rawRedirectUri = (process.env.GMAIL_REDIRECT_URI ? process.env.GMAIL_REDIRECT_URI.trim() : '') || 'http://localhost:5000/api/gmail/oauth2callback';

if (!rawClientId || !rawClientSecret) {
  console.error('\n❌ ERROR: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are not set in backend/.env');
  console.log('Please add your Google Cloud OAuth credentials to backend/.env first:');
  console.log('  GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com');
  console.log('  GMAIL_CLIENT_SECRET=your-client-secret\n');
  process.exit(1);
}

const redirectUri = rawRedirectUri;
const oAuth2Client = new google.auth.OAuth2(rawClientId, rawClientSecret, redirectUri);

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

console.log('\n=============================================================');
console.log('🔑 Smart Task Manager - Google Gmail Authorization Helper');
console.log('=============================================================');
console.log('\n1. Open this URL in your web browser:');
console.log(`\n${authUrl}\n`);
console.log('2. Log in with your Gmail account and click "Continue" / "Allow".');
console.log('3. If redirected to http://localhost:5000/api/gmail/oauth2callback?code=YOUR_CODE');
console.log('   The system will automatically configure your .env file!');
console.log('   Or, paste the "code" query parameter below:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste Authorization Code (or press Enter if authorized via browser): ', async (code) => {
  rl.close();
  if (!code || !code.trim()) {
    console.log('\nDone! Check your browser window or backend/.env file for confirmation.\n');
    process.exit(0);
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\n✅ Success! Received Tokens:');
    console.log('Refresh Token:', tokens.refresh_token);

    if (tokens.refresh_token) {
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*$/m, `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log(`✅ Saved GMAIL_REFRESH_TOKEN to ${envPath}`);
      }
    }
    console.log('\nReal Gmail integration is now active! Launch the app and click "Sync Central Gmail"!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed to exchange code for tokens:', err.message);
    process.exit(1);
  }
});

