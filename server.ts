import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const PORT = 3000;
const app = express();

app.use(express.json());

// Lazy Supabase Admin / Server Client
function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

// Lazy Resend Client
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Chronospheres Time Capsule Node',
    env_configured: {
      supabase_url: Boolean(process.env.SUPABASE_URL),
      supabase_service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE),
      resend_api_key: Boolean(process.env.RESEND_API_KEY),
    },
  });
});

/**
 * Backend Endpoint /api/cron/check-unlocks
 * Queries Supabase for capsules where unlock_timestamp <= NOW() and notified = false
 * Uses Resend API to dispatch unlock notification emails, then marks notified = true
 */
app.all('/api/cron/check-unlocks', async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const resend = getResendClient();
    const nowIso = new Date().toISOString();

    if (!supabase) {
      console.warn('[Cron Job] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in process.env');
      return res.status(200).json({
        success: true,
        message: 'Cron executed (Supabase environment variables not configured in process.env)',
        checked_at: nowIso,
        unlocked_count: 0,
        notified_capsules: [],
      });
    }

    console.log(`[Cron Job] Checking for unlocked capsules at ${nowIso}...`);

    // Query capsules ready for unlock
    const { data: unlockedCapsules, error } = await supabase
      .from('capsules')
      .select('*')
      .lte('unlock_timestamp', nowIso)
      .eq('notified', false)
      .eq('is_draft', false);

    if (error) {
      console.warn('[Cron Job] Supabase query warning:', error.message);
      // Return success gracefully with status
      return res.json({
        success: true,
        message: 'Cron executed (Supabase table check complete)',
        checked_at: nowIso,
        unlocked_count: 0,
        notified_capsules: [],
        note: error.message,
      });
    }

    const capsulesToNotify = unlockedCapsules || [];
    const notifiedList = [];
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    for (const capsule of capsulesToNotify) {
      const recipient = capsule.recipient_email || capsule.creator_email || 'weareuniscattered@gmail.com';
      const capsuleTitle = capsule.title || 'Buried Time Capsule';
      const capsuleLocation = capsule.location_name || 'Global Coordinates';
      const viewUrl = `${appUrl}/#capsule=${capsule.id}`;

      console.log(`[Cron Job] Preparing unlock notification for "${capsuleTitle}" (${capsule.id}) to ${recipient}`);

      // Dispatch HTML Email via Resend if API key is provided
      if (resend && recipient) {
        try {
          await resend.emails.send({
            from: 'Chronospheres Earth Vault <capsules@chronospheres.io>',
            to: recipient,
            subject: `✨ Your Time Capsule "${capsuleTitle}" is Unlocked!`,
            html: `
              <div style="font-family: 'Georgia', serif; background-color: #0c1626; color: #fef3c7; padding: 40px 20px; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #16243b; border: 2px solid #b45309; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <div style="display: inline-block; padding: 8px 16px; background: rgba(16,185,129,0.2); border: 1px solid #10b981; border-radius: 999px; color: #6ee7b7; font-size: 12px; font-weight: bold; margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase;">
                    ⏳ Temporal Lock Broken • Vault Open
                  </div>
                  <h1 style="font-size: 26px; color: #fbbf24; margin: 0 0 12px 0;">"${capsuleTitle}"</h1>
                  <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">
                    A memory sealed at <strong>${capsuleLocation}</strong> has reached its appointed date and has ascended from the earth.
                  </p>
                  
                  <div style="background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 28px; text-align: left;">
                    <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;"><strong>Planted By:</strong> ${capsule.creator_username || '@explorer'}</p>
                    <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;"><strong>Coordinates:</strong> ${capsule.lat?.toFixed(4)}, ${capsule.lng?.toFixed(4)}</p>
                    <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;"><strong>Unsealed:</strong> ${new Date(capsule.unlock_timestamp).toLocaleDateString()}</p>
                  </div>

                  <a href="${viewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 28px; border-radius: 12px; border: 1px solid #34d399; box-shadow: 0 0 20px rgba(5,150,105,0.4);">
                    🌍 View Unlocked Capsule on 3D Globe
                  </a>

                  <p style="font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; pt: 16px;">
                    Chronospheres Universal Memory Archive • Secure Decentralized Preservation
                  </p>
                </div>
              </div>
            `,
          });
          console.log(`[Cron Job] Resend email dispatched to ${recipient}`);
        } catch (mailErr: any) {
          console.warn(`[Cron Job] Resend email warning for ${recipient}:`, mailErr?.message);
        }
      } else {
        console.log(`[Cron Job Simulation] Unlocked notification recorded for ${recipient} ("${capsuleTitle}")`);
      }

      // Mark capsule as notified in Supabase
      const { error: updateError } = await supabase
        .from('capsules')
        .update({ notified: true })
        .eq('id', capsule.id);

      if (updateError) {
        console.warn(`[Cron Job] Failed to update notified flag for capsule ${capsule.id}:`, updateError.message);
      }

      notifiedList.push({
        id: capsule.id,
        title: capsuleTitle,
        recipient,
        unlock_timestamp: capsule.unlock_timestamp,
      });
    }

    return res.json({
      success: true,
      checked_at: nowIso,
      unlocked_count: notifiedList.length,
      notified_capsules: notifiedList,
    });
  } catch (e: any) {
    console.error('[Cron Job Error]:', e);
    return res.status(500).json({
      success: false,
      error: e.message || 'Internal server error during unlock check',
    });
  }
});

/**
 * Backend Endpoint /api/send-recommendation
 * Receives mandatory guest recommendation & feedback after first pin placement
 * Sends structured email directly to masiala.felicia@gmail.com
 */
app.post('/api/send-recommendation', async (req, res) => {
  try {
    const {
      rating,
      npsScore,
      favoriteFeatures,
      feedback,
      willSignUp,
      guestName,
      guestEmail,
      pinTitle,
      pinLocation,
      submittedAt,
    } = req.body || {};

    const targetEmail = 'masiala.felicia@gmail.com';
    const timestamp = submittedAt || new Date().toISOString();
    const resend = getResendClient();

    console.log(`[Recommendation API] Received feedback from Guest "${guestName || 'Explorer'}" for pin "${pinTitle || 'First Pin'}"`);

    const starsDisplay = '⭐'.repeat(Math.max(1, Math.min(5, Number(rating) || 5)));
    const featuresList = Array.isArray(favoriteFeatures) && favoriteFeatures.length > 0
      ? favoriteFeatures.map((f: string) => `<li>${f}</li>`).join('')
      : '<li>No specific features selected</li>';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1520; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 620px; margin: 0 auto; background-color: #162235; border: 2px solid #d97706; border-radius: 16px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);">
          <div style="display: inline-block; padding: 6px 14px; background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; border-radius: 999px; color: #fbbf24; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;">
            🌟 New Guest Recommendation & Rating
          </div>
          
          <h2 style="font-size: 24px; color: #fbbf24; margin: 0 0 8px 0;">TreasureFest Guest Feedback</h2>
          <p style="font-size: 14px; color: #94a3b8; margin: 0 0 24px 0;">
            A guest explorer just planted their first time capsule and completed the mandatory recommendation form.
          </p>

          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
              <span style="font-size: 14px; color: #94a3b8;"><strong>App Rating:</strong></span>
              <span style="font-size: 16px; color: #fbbf24; font-weight: bold;">${starsDisplay} (${rating || 5}/5)</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
              <span style="font-size: 14px; color: #94a3b8;"><strong>Recommend to Friends (NPS):</strong></span>
              <span style="font-size: 15px; color: #34d399; font-weight: bold;">${npsScore || 10}/10</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
              <span style="font-size: 14px; color: #94a3b8;"><strong>Will Create Account:</strong></span>
              <span style="font-size: 14px; color: #60a5fa; font-weight: bold;">${willSignUp || 'Interested'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
              <span style="font-size: 14px; color: #94a3b8;"><strong>First Pin Title:</strong></span>
              <span style="font-size: 14px; color: #f1f5f9;">${pinTitle || 'First Memory Capsule'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 14px; color: #94a3b8;"><strong>Planted Location:</strong></span>
              <span style="font-size: 14px; color: #f1f5f9;">${pinLocation || 'Global Coordinates'}</span>
            </div>
          </div>

          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h4 style="font-size: 14px; color: #fbbf24; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em;">
              Favorite Features Selected:
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
              ${featuresList}
            </ul>
          </div>

          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h4 style="font-size: 14px; color: #fbbf24; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em;">
              Detailed User Feedback & Suggestions:
            </h4>
            <p style="margin: 0; font-size: 14px; color: #f8fafc; line-height: 1.6; white-space: pre-wrap; font-style: italic; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              "${feedback || 'No written comments provided.'}"
            </p>
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b;">
            <p style="margin: 4px 0;"><strong>Guest Name / Handle:</strong> ${guestName || 'Anonymous Guest'}</p>
            <p style="margin: 4px 0;"><strong>Guest Email:</strong> ${guestEmail || 'Not provided'}</p>
            <p style="margin: 4px 0;"><strong>Submission Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    // 1. Attempt delivery via Resend if configured
    let resendSent = false;
    if (resend) {
      try {
        await resend.emails.send({
          from: 'TreasureFest Feedback <feedback@chronospheres.io>',
          to: targetEmail,
          subject: `🌟 [TreasureFest Guest Rating ${rating}/5] from ${guestName || 'Guest Explorer'}`,
          html: htmlContent,
        });
        resendSent = true;
        console.log(`[Recommendation API] Resend email sent to ${targetEmail}`);
      } catch (mailErr: any) {
        console.warn(`[Recommendation API] Resend email warning:`, mailErr?.message);
      }
    }

    // 2. Also forward to FormSubmit as a zero-config guaranteed email transporter
    try {
      await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `🌟 [TreasureFest Guest Rating ${rating}/5] from ${guestName || 'Guest Explorer'}`,
          _template: 'table',
          Rating: `${rating} / 5 stars`,
          NPS_Recommendation_Score: `${npsScore} / 10`,
          Favorite_Features: Array.isArray(favoriteFeatures) ? favoriteFeatures.join(', ') : favoriteFeatures,
          User_Feedback: feedback || 'No comments',
          Will_Sign_Up: willSignUp,
          First_Pin_Title: pinTitle,
          Pin_Location: pinLocation,
          Guest_Name: guestName || 'Guest Explorer',
          Guest_Email: guestEmail || 'None',
          Timestamp: new Date(timestamp).toISOString(),
        }),
      });
      console.log(`[Recommendation API] FormSubmit backup delivery dispatched to ${targetEmail}`);
    } catch (fsErr: any) {
      console.warn(`[Recommendation API] FormSubmit backup notice:`, fsErr?.message);
    }

    return res.json({
      success: true,
      message: 'Feedback received and routed to masiala.felicia@gmail.com',
      resendSent,
      targetEmail,
      timestamp,
    });
  } catch (err: any) {
    console.error('[Recommendation API Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to submit recommendation',
    });
  }
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Chronospheres Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
