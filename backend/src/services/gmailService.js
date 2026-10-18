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
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_REFRESH_TOKEN } = process.env;

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    return null;
  }

  const oAuth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI || 'http://localhost:5000/api/gmail/oauth2callback'
  );

  if (GMAIL_REFRESH_TOKEN) {
    oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  }

  return oAuth2Client;
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
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Payload(part.body.data);
      }
    }
    // Fallback to first part if text/plain not found
    if (payload.parts[0].body && payload.parts[0].body.data) {
      return decodeBase64Payload(payload.parts[0].body.data);
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

  // Run through AI Email-to-Task converter
  const extracted = await aiService.parseEmailToTask(subject, body);

  const draft = await EmailDraft.create({
    messageId,
    from,
    subject,
    body,
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
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread -label:PROCESSED',
    maxResults: 10,
  });

  const messages = res.data.messages || [];
  const processedDrafts = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const headers = detail.data.payload.headers || [];
    const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject');
    const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from');

    const subject = subjectHeader ? subjectHeader.value : '(No Subject)';
    const from = fromHeader ? fromHeader.value : 'unknown@domain.com';
    const body = extractBodyFromPayload(detail.data.payload) || detail.data.snippet || '';

    const draft = await processEmailMessage({
      messageId: msg.id,
      from,
      subject,
      body,
      receivedAt: new Date(Number(detail.data.internalDate)),
    });

    processedDrafts.push(draft);

    // Optionally mark email as read or apply label
    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (lblErr) {
      console.warn('[GmailService] Could not remove UNREAD label:', lblErr.message);
    }
  }

  return processedDrafts;
};

// Sync emails - uses Live Gmail API if configured, otherwise interactive sample simulator
const syncGmailInbox = async (forceSimulateIndex = null) => {
  const oAuth = getOAuth2Client();
  const hasLiveConfig = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN);

  if (hasLiveConfig) {
    try {
      return await fetchLiveGmailEmails();
    } catch (err) {
      console.warn('[GmailService] Live Gmail fetch failed, falling back to simulator:', err.message);
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

  return results;
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
  syncGmailInbox,
  simulateIncomingEmail,
  processEmailMessage,
};
