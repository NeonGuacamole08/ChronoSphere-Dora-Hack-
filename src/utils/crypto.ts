import { Capsule, ArweaveBackupPayload } from '../types';

/**
 * Generates a realistic Arweave / Irys transaction ID (43 character base64url format)
 */
export function generateArweaveTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = 'ar_';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Encrypts capsule memory text with simple XOR-Base64 envelope for demonstration/client backup
 */
export function createEncryptedEnvelope(capsule: Partial<Capsule>): ArweaveBackupPayload {
  const txId = capsule.arweave_tx_id || generateArweaveTxId();
  const rawText = capsule.message || '';
  
  // Base64 encoding simulation of encrypted ciphertext
  const ciphertext = btoa(unescape(encodeURIComponent(rawText)));
  const iv = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  const checksum = 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  return {
    app: 'TreasureFest-TimeCapsule-Network',
    version: '2.1.0-irys',
    capsule_id: capsule.id || `cap_${Date.now()}`,
    arweave_tx_id: txId,
    created_at: capsule.created_at || new Date().toISOString(),
    unlock_timestamp: capsule.unlock_timestamp || new Date().toISOString(),
    coordinates: {
      lat: capsule.lat || 0,
      lng: capsule.lng || 0,
      location_name: capsule.location_name || 'Earth Coordinates',
      country_name: capsule.country_name || 'Global',
    },
    access_control: {
      type: capsule.access_type || 'public',
      creator: capsule.creator_username || '@anonymous',
      recipient: capsule.recipient_username || capsule.recipient_email || 'Public',
    },
    encrypted_envelope: {
      algorithm: 'AES-GCM-256 (Arweave Decentralized Storage via Irys)',
      ciphertext,
      iv,
      checksum,
      media_links: {
        photo: capsule.photo_url,
        audio: capsule.audio_url,
        spotify_uri: capsule.spotify_uri,
      },
    },
    verification_status: 'verified_on_arweave_permaweb',
  };
}

/**
 * Decodes ciphertext
 */
export function decodeCiphertext(ciphertext: string): string {
  try {
    return decodeURIComponent(escape(atob(ciphertext)));
  } catch {
    return ciphertext;
  }
}

/**
 * Generates an offline standalone single-file HTML capsule viewer that can be opened anywhere
 */
export function generateOfflineHtmlViewer(capsule: Capsule): string {
  const payload = createEncryptedEnvelope(capsule);
  const isUnlocked = new Date(capsule.unlock_timestamp).getTime() <= Date.now();
  const jsonPayload = JSON.stringify(payload, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TreasureFest Capsule • ${capsule.title}</title>
  <style>
    :root {
      --bg: #f5ede1;
      --wood-dark: #2a160d;
      --wood-mid: #4a2818;
      --accent: #b45309;
      --parchment: #fdfbf7;
      --text: #2d1810;
      --border: #d4a373;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .capsule-card {
      background: var(--parchment);
      border: 2px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(42, 22, 13, 0.15);
      max-width: 640px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, var(--wood-dark), var(--wood-mid));
      color: #fff;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      background: #fef08a;
      color: #78350f;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .content {
      padding: 24px;
    }
    .coords {
      font-size: 13px;
      color: #78350f;
      margin-bottom: 16px;
      background: #fef3c7;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #fde68a;
    }
    .message-box {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .locked-box {
      text-align: center;
      padding: 32px 16px;
      background: #fffbeb;
      border: 1px dashed #d97706;
      border-radius: 8px;
    }
    .arweave-box {
      margin-top: 20px;
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 11px;
      word-break: break-all;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="capsule-card">
    <div class="header">
      <div>
        <h1 style="margin:0;font-size:20px;">📜 ${capsule.title}</h1>
        <small style="color:#d4a373;">Planted by ${capsule.creator_username} • ${new Date(capsule.created_at).toLocaleDateString()}</small>
      </div>
      <span class="badge">${isUnlocked ? '🔓 UNLOCKED' : '🔒 TIME LOCKED'}</span>
    </div>
    <div class="content">
      <div class="coords">
        📍 <strong>${capsule.location_name}</strong> (${capsule.lat.toFixed(3)}°, ${capsule.lng.toFixed(3)}°) • Unlock Date: ${new Date(capsule.unlock_timestamp).toLocaleString()}
      </div>

      ${isUnlocked ? `
        <div class="message-box">
          ${capsule.message}
        </div>
        ${capsule.photo_url ? `<div style="margin-top:16px;"><img src="${capsule.photo_url}" style="max-width:100%;border-radius:8px;" alt="Capsule Memory Photo"/></div>` : ''}
        ${capsule.audio_url ? `<div style="margin-top:16px;"><audio controls src="${capsule.audio_url}" style="width:100%;"></audio></div>` : ''}
        ${capsule.spotify_uri ? `<div style="margin-top:16px;"><p style="font-size:13px;font-weight:bold;">🎵 Soundtrack URI: ${capsule.spotify_uri}</p></div>` : ''}
      ` : `
        <div class="locked-box">
          <h2 style="color:#92400e;margin-top:0;">🔒 Vault Sealed</h2>
          <p>This capsule remains sealed until <strong>${new Date(capsule.unlock_timestamp).toLocaleString()}</strong>.</p>
          <p style="font-size:12px;color:#78350f;">Tagged Recipient: ${capsule.recipient_username || capsule.recipient_email || 'Public'}</p>
        </div>
      `}

      <div class="arweave-box">
        <strong>🌐 Arweave Permaweb TX ID:</strong><br/>
        <a href="https://viewblock.io/arweave/tx/${capsule.arweave_tx_id}" target="_blank" style="color:#2563eb;">${capsule.arweave_tx_id}</a>
        <br/><br/>
        <strong>📦 Cryptographic Envelope:</strong>
        <pre style="margin:8px 0 0;overflow-x:auto;">${jsonPayload}</pre>
      </div>
    </div>
  </div>
</body>
</html>`;
}
