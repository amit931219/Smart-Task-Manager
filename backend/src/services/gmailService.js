const { google } = require('googleapis');
const EmailDraft = require('../models/EmailDraft');
const aiService = require('./aiService');
const { logActivity } = require('./activityService');

// Predefined realistic emails for simulation and demonstration
const SAMPLE_EMAILS = [
  {
    messageId: 'sim-msg-101',
    from: 'dr.sharma@college.edu',
    subject: 'BCS402 Course File Preparation',
    body: 'Please ask Rahul to prepare the BCS402 course file by Monday. This is high priority.',
    receivedAt: new Date(),
  },
  {
    messageId: 'sim-msg-102',
    from: 'dean.academics@college.edu',
    subject: 'Annual Department Accreditation Report',
    body: 'Need Priya to collate faculty research publications, student achievements, and placement data for the CSE annual report by next Friday. Important deliverable.',
    receivedAt: new Date(Date.now() - 3600000),
  },
  {
    messageId: 'sim-msg-103',
    from: 'devops.lead@smarttask.com',
    subject: 'Action Required: Fix Staging Server Connection',
    body: 'Please ask Amit to investigate staging server database timeout issues immediately by tomorrow. This is urgent.',
    receivedAt: new Date(Date.now() - 7200000),
  },
];

// Setup Google OAuth2 Client
const getOAuth2Client = () => {
  const clientId = process.env.GMAIL_CLIENT_ID ? process.env.GMAIL_CLIENT_ID.trim() : '';
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ? process.env.GMAIL_CLIENT_SECRET.trim() : '';
  const redirectUri = (process.env.GMAIL_REDIRECT_URI ? process.env.GMAIL_REDIRECT_URI.trim() : '') || 'http://localhost:5000/api/gmail/oauth2callback';
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN ? process.env.GMAIL_REFRESH_TOKEN.trim() : '';

  if (!clientId || !clientSecret) {
    return null;
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  if (refreshToken) {
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oAuth2Client;
};

// Generate Google Consent URL
const generateAuthUrl = () => {
  const oAuth2Client = getOAuth2Client();
  if (!oAuth2Client) {
    throw new Error('GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in backend/.env first.');
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
};

// Exchange auth code for tokens
const getTokensFromCode = async (code) => {
  const oAuth2Client = getOAuth2Client();
  if (!oAuth2Client) {
    throw new Error('OAuth2 client not initialized');
  }

  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};

// Helper: Decode Base64 from Gmail message payload
const decodeBase64Payload = (data) => {
  if (!data) return '';
  const buff = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buff.toString('utf-8');
};

const extractBodyFromPayload = (payload) => {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Payload(payload.body.data);
  }
  if (payload.parts && payload.parts.length > 0) {
    // 1. Check for plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Payload(part.body.data);
      }
    }
    // 2. Check for nested parts (e.g. multipart/alternative inside multipart/mixed)
    for (const part of payload.parts) {
      if (part.parts && part.parts.length > 0) {
        const nested = extractBodyFromPayload(part);
        if (nested) return nested;
      }
    }
    // 3. Fallback to text/html stripped
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const html = decodeBase64Payload(part.body.data);
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    // 4. Fallback to first part with data
    for (const part of payload.parts) {
      if (part.body && part.body.data) {
        return decodeBase64Payload(part.body.data);
      }
    }
  }
  return '';
};

// Process raw email through AI and save as pending EmailDraft
const processEmailMessage = async ({ messageId, from, subject, body, receivedAt }) => {
  // Check if draft already exists
  const existing = await EmailDraft.findOne({ messageId });
  if (existing) {
    return existing;
  }

  // Clean and prepare body text
  const cleanBody = (body || '').trim() || subject;

  // Run through AI Email-to-Task converter
  const extracted = await aiService.parseEmailToTask(subject, cleanBody);

  const draft = await EmailDraft.create({
    messageId,
    from,
    subject,
    body: cleanBody,
    receivedAt: receivedAt || new Date(),
    extractedTask: extracted,
    status: 'pending_review',
  });

  await logActivity({
    action: 'GMAIL_SYNCED',
    details: `Synced email "${subject}" from ${from} and parsed candidate task "${extracted.title}"`,
    metadata: { messageId, draftId: draft._id },
  });

  return draft;
};

// Fetch live emails using Gmail API (if OAuth configured)
const fetchLiveGmailEmails = async () => {
  const auth = getOAuth2Client();
  if (!auth) {
    throw new Error('Google OAuth2 credentials not configured');
  }

  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Look for unread emails first
  let res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 15,
  });

  let messageRefs = res.data.messages || [];

  // 2. If no unread emails, check recent inbox messages from past 7 days
  // (In case the user opened or read the test email in Gmail before clicking sync!)
  if (messageRefs.length === 0) {
    console.log('[GmailService] No unread messages found. Checking recent inbox messages...');
    res = await gmail.users.messages.list({
      userId: 'me',
      q: 'newer_than:7d',
      maxResults: 15,
    });
    messageRefs = res.data.messages || [];
  }

  // 3. Fallback to latest 10 messages regardless of folder/date
  if (messageRefs.length === 0) {
    console.log('[GmailService] Checking latest 10 messages in mailbox...');
    res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });
    messageRefs = res.data.messages || [];
  }

  console.log(`[GmailService] Found ${messageRefs.length} candidate message(s) in Gmail.`);

  const processedDrafts = [];

  for (const msg of messageRefs) {
    // Check if this email was already converted to a draft
    const alreadyProcessed = await EmailDraft.findOne({ messageId: msg.id });
    if (alreadyProcessed) {
      console.log(`[GmailService] Message ${msg.id} already exists as draft. Skipping.`);
      continue;
    }

    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject');
    const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from');

    const subject = subjectHeader ? subjectHeader.value : '(No Subject)';
    const from = fromHeader ? fromHeader.value : 'unknown@domain.com';
    const bodyText = extractBodyFromPayload(detail.data.payload) || detail.data.snippet || subject;

    console.log(`[GmailService] Parsing new email into task draft: "${subject}" from ${from}`);

    const draft = await processEmailMessage({
      messageId: msg.id,
      from,
      subject,
      body: bodyText,
      receivedAt: new Date(Number(detail.data.internalDate) || Date.now()),
    });

    processedDrafts.push(draft);
  }

  return {
    processedCount: processedDrafts.length,
    totalChecked: messageRefs.length,
    drafts: processedDrafts,
  };
};

// Sync emails - uses Live Gmail API if configured, otherwise interactive sample simulator
const syncGmailInbox = async (forceSimulateIndex = null) => {
  const oAuth = getOAuth2Client();
  const hasLiveConfig = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN);

  if (hasLiveConfig) {
    try {
      console.log('[GmailService] Attempting live Gmail API sync...');
      const liveResult = await fetchLiveGmailEmails();
      return {
        mode: 'live_gmail_api',
        ...liveResult,
      };
    } catch (err) {
      console.error('[GmailService] Live Gmail fetch error:', err.message);
      throw err;
    }
  }

  // Simulation mode
  const results = [];
  if (forceSimulateIndex !== null && SAMPLE_EMAILS[forceSimulateIndex]) {
    const item = { ...SAMPLE_EMAILS[forceSimulateIndex], messageId: `sim-msg-${Date.now()}` };
    const draft = await processEmailMessage(item);
    results.push(draft);
  } else {
    for (const item of SAMPLE_EMAILS) {
      const draft = await processEmailMessage(item);
      results.push(draft);
    }
  }

  return {
    mode: 'simulation',
    processedCount: results.length,
    totalChecked: results.length,
    drafts: results,
  };
};

// Simulate custom incoming email submitted by user/admin in the UI
const simulateIncomingEmail = async ({ from, subject, body }) => {
  const item = {
    messageId: `custom-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    from: from || 'colleague@smarttask.com',
    subject: subject || 'New Project Task Request',
    body: body || 'Please complete this task by next Monday.',
    receivedAt: new Date(),
  };

  return await processEmailMessage(item);
};

module.exports = {
  getOAuth2Client,
  generateAuthUrl,
  getTokensFromCode,
  syncGmailInbox,
  simulateIncomingEmail,
  processEmailMessage,
};

