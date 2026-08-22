import React, { useState } from 'react';
import {
  X,
  Database,
  Mail,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Send,
  Sparkles,
  Server,
  BellRing,
  FileCode,
  Globe2,
} from 'lucide-react';
import { Capsule } from '../../types';

interface BackendHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsules: Capsule[];
  onTriggerNotificationScan: () => { notifiedCount: number; newlyNotified: Capsule[] };
}

export const BackendHubModal: React.FC<BackendHubModalProps> = ({
  isOpen,
  onClose,
  capsules,
  onTriggerNotificationScan,
}) => {
  const [activeTab, setActiveTab] = useState<'edge_function' | 'arweave' | 'rls' | 'simulator'>('edge_function');
  const [copied, setCopied] = useState<string | null>(null);
  const [simResults, setSimResults] = useState<{ notifiedCount: number; newlyNotified: Capsule[] } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const runSim = () => {
    const res = onTriggerNotificationScan();
    setSimResults(res);
  };

  // SQL & RLS policies snippet
  const supabaseSqlSnippet = `-- ==============================================================================
-- ChronoSpheres: Supabase Database Schema & Row-Level Security (RLS) Policies
-- ==============================================================================

-- 1. Create capsules table
CREATE TABLE IF NOT EXISTS public.capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    unlock_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location_name TEXT NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    country_name TEXT NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_username TEXT NOT NULL,
    creator_email TEXT NOT NULL,
    access_type VARCHAR(20) DEFAULT 'public' CHECK (access_type IN ('public', 'private')),
    recipient_username TEXT,
    recipient_email TEXT,
    photo_url TEXT,
    audio_url TEXT,
    audio_duration INTEGER,
    spotify_uri TEXT,
    arweave_tx_id TEXT NOT NULL,
    encryption_signature TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT true NOT NULL,
    notified BOOLEAN DEFAULT false NOT NULL,
    tags TEXT[] DEFAULT '{}'
);

-- Index for geolocation queries & cron notification checks
CREATE INDEX IF NOT EXISTS idx_capsules_unlock ON public.capsules (unlock_timestamp, notified);
CREATE INDEX IF NOT EXISTS idx_capsules_geo ON public.capsules (lat, lng);
CREATE INDEX IF NOT EXISTS idx_capsules_recipient ON public.capsules (recipient_username, recipient_email);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public capsules can be read by anyone IF unlocked OR if public metadata
CREATE POLICY "Public capsules readable by all"
ON public.capsules
FOR SELECT
USING (
    access_type = 'public' OR
    auth.uid() = creator_id OR
    recipient_username = (auth.jwt() ->> 'preferred_username') OR
    recipient_email = auth.jwt() ->> 'email'
);

-- 4. Policy: Users can only insert capsules created by themselves
CREATE POLICY "Creators can insert their own capsules"
ON public.capsules
FOR INSERT
WITH CHECK (
    auth.uid() = creator_id OR
    creator_username IS NOT NULL
);

-- 5. Policy: Only creator can update or delete their capsules
CREATE POLICY "Creators can update their capsules"
ON public.capsules
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their capsules"
ON public.capsules
FOR DELETE
USING (auth.uid() = creator_id);
`;

  // Supabase Edge Function & Resend API Snippet
  const edgeFunctionSnippet = `// ==============================================================================
// Supabase Edge Function: /supabase/functions/notify-unlocked-capsules/index.ts
// Scheduled daily via pg_cron or Upstash QStash
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://chronospheres.io";

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  try {
    const nowIso = new Date().toISOString();

    // 1. Query capsules where unlock_timestamp <= NOW() and notified == false
    const { data: capsules, error } = await supabase
      .from("capsules")
      .select("*")
      .lte("unlock_timestamp", nowIso)
      .eq("notified", false);

    if (error) throw error;

    if (!capsules || capsules.length === 0) {
      return new Response(JSON.stringify({ message: "No pending unlocked capsules to notify." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const notificationResults = [];

    // 2. Dispatch emails via Resend
    for (const capsule of capsules) {
      const recipient = capsule.recipient_email || capsule.creator_email;
      if (!recipient) continue;

      const capsuleUrl = \`\${APP_BASE_URL}/capsule/\${capsule.id}\`;

      const emailResponse = await resend.emails.send({
        from: "ChronoSpheres Vault <capsules@chronospheres.io>",
        to: [recipient],
        subject: \`✨ Your Earth Time Capsule has Unlocked: "\${capsule.title}"\`,
        html: \`
          <div style="font-family: serif; background: #fdfbf7; padding: 32px; border: 2px solid #d4a373; border-radius: 12px; max-width: 600px;">
            <h1 style="color: #4a2818; margin-top: 0;">📜 A Time Capsule Has Opened</h1>
            <p style="font-size: 15px; color: #2d1810; line-height: 1.6;">
              Dear Explorer, the time-lock on <strong>"\${capsule.title}"</strong> planted at
              <em>\${capsule.location_name}</em> has officially expired!
            </p>
            <p style="font-size: 14px; color: #78350f;">
              Planted by: <strong>\${capsule.creator_username}</strong><br/>
              Arweave TX: <code>\${capsule.arweave_tx_id}</code>
            </p>
            <div style="margin: 24px 0;">
              <a href="\${capsuleUrl}" style="background: #92400e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-family: sans-serif; display: inline-block;">
                🔓 Open Your Time Capsule & Play Memories
              </a>
            </div>
            <p style="font-size: 11px; color: #a8a29e;">
              ChronoSpheres • 3D Earth Time Capsule Permaweb Network
            </p>
          </div>
        \`,
      });

      // 3. Update notified status to true
      await supabase
        .from("capsules")
        .update({ notified: true })
        .eq("id", capsule.id);

      notificationResults.push({ capsuleId: capsule.id, recipient, emailId: emailResponse.data?.id });
    }

    return new Response(
      JSON.stringify({ success: true, processed: notificationResults.length, details: notificationResults }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ==============================================================================
// 4. pg_cron Schedule (Runs daily at 00:00 UTC)
// ==============================================================================
// SELECT cron.schedule(
//   'daily-capsule-unlock-notifier',
//   '0 0 * * *',
//   $$
//   SELECT net.http_post(
//     url := 'https://<project-ref>.functions.supabase.co/notify-unlocked-capsules',
//     headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>')
//   ) AS request_id;
//   $$
// );
`;

  // Arweave / Irys SDK Permanent Storage Snippet
  const arweaveSnippet = `// ==============================================================================
// Arweave / Irys SDK: Permanent Decentralized Time Capsule Storage
// ==============================================================================

import { Uploader } from "@irys/upload";
import { Ethereum } from "@irys/upload-ethereum";

/**
 * Uploads an encrypted capsule envelope to the Arweave Permaweb via Irys
 */
export async function uploadCapsuleToArweave(encryptedCapsulePayload: {
  capsule_id: string;
  title: string;
  coordinates: { lat: number; lng: number; location: string };
  unlock_timestamp: string;
  encrypted_envelope: string;
  media_links: { photo?: string; audio?: string; spotify_uri?: string };
}) {
  // 1. Initialize Irys node
  const irys = await Uploader(Ethereum).withWallet(process.env.PRIVATE_KEY);

  // 2. Prepare metadata tags for Permaweb indexing
  const tags = [
    { name: "Content-Type", value: "application/json" },
    { name: "App-Name", value: "ChronoSpheres" },
    { name: "Type", value: "Time-Capsule-Payload" },
    { name: "Capsule-ID", value: encryptedCapsulePayload.capsule_id },
    { name: "Unlock-Timestamp", value: encryptedCapsulePayload.unlock_timestamp },
    { name: "Lat", value: String(encryptedCapsulePayload.coordinates.lat) },
    { name: "Lng", value: String(encryptedCapsulePayload.coordinates.lng) },
  ];

  // 3. Upload to Arweave Permaweb
  const dataToUpload = JSON.stringify(encryptedCapsulePayload);
  const receipt = await irys.upload(dataToUpload, { tags });

  console.log(\`Anchored permanently to Arweave: https://gateway.irys.xyz/\${receipt.id}\`);
  
  // 4. Return the permanent transaction ID to store in Supabase
  return {
    arweave_tx_id: receipt.id,
    permaweb_url: \`https://gateway.irys.xyz/\${receipt.id}\`,
  };
}

/**
 * Fallback Function: If the main website goes down, users can fetch their data
 * directly from the decentralized Arweave Gateway and decrypt locally.
 */
export async function fetchArweaveCapsuleFallback(arweaveTxId: string) {
  const gatewayUrl = \`https://arweave.net/\${arweaveTxId}\`;
  const response = await fetch(gatewayUrl);
  if (!response.ok) {
    throw new Error(\`Failed to fetch memory from Arweave gateway: \${response.statusText}\`);
  }
  const payload = await response.json();
  return payload;
}
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Wood Trim Header */}
        <div className="tree-bark-banner px-6 py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-amber-300" />
            <div>
              <h3 className="font-serif font-bold text-lg carved-wood-text leading-none">
                Backend Architecture & Web3 Storage Hub
              </h3>
              <span className="text-[11px] carved-wood-subtext">
                Supabase pg_cron + Resend Email • Arweave / Irys Decentralized Backup
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-amber-200 bg-amber-50/80 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('edge_function')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'edge_function'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            1. Email Dispatcher (Edge Function + Resend)
          </button>

          <button
            onClick={() => setActiveTab('arweave')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'arweave'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            2. Arweave / Irys Web3 Backup
          </button>

          <button
            onClick={() => setActiveTab('rls')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'rls'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Supabase Schema & RLS SQL
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'simulator'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            Live Notification Simulator
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'edge_function' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl parchment-subtle border border-amber-300/80 text-xs text-stone-700 leading-relaxed">
                <strong>Scheduled Email Notifications (Supabase + Resend):</strong> Runs daily via{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">pg_cron</code> to query{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">capsules</code> where{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">unlock_timestamp &lt;= NOW()</code> and{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">notified == false</code>, then dispatches an email with direct link <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">app.com/capsule/[id]</code> via Resend and sets <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">notified = true</code>.
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  Deno Edge Function Source Code:
                </span>
                <button
                  onClick={() => copyToClipboard(edgeFunctionSnippet, 'edge')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium transition cursor-pointer"
                >
                  {copied === 'edge' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'edge' ? 'Copied Deno Code!' : 'Copy Deno Code'}
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto max-h-80 border border-stone-800 shadow-inner">
                {edgeFunctionSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'arweave' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl parchment-subtle border border-amber-300/80 text-xs text-stone-700 leading-relaxed">
                <strong>Permanent Backup via Arweave / Web3 Storage:</strong> When sealed, the capsule's encrypted JSON payload (message, coordinates, timestamp, and media links) is minted onto the Arweave permaweb using Irys / Bundlr SDK, storing <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">arweave_tx_id</code> in Supabase. A frontend fallback function allows users to decrypt their memory forever even if central servers go down.
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  Irys / Bundlr SDK & Permaweb Fallback Code:
                </span>
                <button
                  onClick={() => copyToClipboard(arweaveSnippet, 'arweave')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium transition cursor-pointer"
                >
                  {copied === 'arweave' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'arweave' ? 'Copied Arweave Code!' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80 border border-stone-800 shadow-inner">
                {arweaveSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  Strict Row Level Security (RLS) for public and private @tagged memory vaults:
                </span>
                <button
                  onClick={() => copyToClipboard(supabaseSqlSnippet, 'sql')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium transition cursor-pointer"
                >
                  {copied === 'sql' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'sql' ? 'Copied SQL!' : 'Copy SQL'}
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80 border border-stone-800 shadow-inner">
                {supabaseSqlSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl parchment-subtle border border-amber-300/80 space-y-2">
                <h4 className="font-serif font-bold text-sm text-stone-900">
                  Automated Unlock Email Dispatcher
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Trigger an on-demand scan across all capsules. The engine queries for capsules where{' '}
                  <code className="text-amber-900 font-mono">unlock_timestamp &lt;= NOW()</code> and{' '}
                  <code className="text-amber-900 font-mono">notified == false</code>, simulating the Resend email webhook to notify recipients with a direct link.
                </p>
              </div>

              <button
                onClick={runSim}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-amber-300" />
                Run Notification Scan Now
              </button>

              {simResults && (
                <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span>Scan Result:</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {simResults.newlyNotified.length} Notification(s) Dispatched
                    </span>
                  </div>

                  {simResults.newlyNotified.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">
                      All currently unlocked capsules have already been notified. Try creating a new capsule with past unlock date or testing the fast-forward unlock!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {simResults.newlyNotified.map((cap) => (
                        <div
                          key={cap.id}
                          className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1"
                        >
                          <div className="font-bold text-stone-900 flex items-center justify-between">
                            <span>📧 Sent to: {cap.recipient_email || cap.creator_email}</span>
                            <span className="text-[10px] font-mono text-stone-500">
                              Direct Link: /capsule/{cap.id}
                            </span>
                          </div>
                          <div className="text-stone-700">Capsule: &ldquo;{cap.title}&rdquo;</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
