import React, { useState } from 'react';
import { X, ShieldCheck, Download, Code, Eye, FileText, CheckCircle } from 'lucide-react';
import { Capsule } from '../../types';
import { createEncryptedEnvelope, generateOfflineHtmlViewer } from '../../utils/crypto';

interface OfflineViewerModalProps {
  capsule: Capsule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineViewerModal: React.FC<OfflineViewerModalProps> = ({
  capsule,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'envelope' | 'standalone' | 'arweave'>('envelope');
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !capsule) return null;

  const envelope = createEncryptedEnvelope(capsule);
  const jsonString = JSON.stringify(envelope, null, 2);

  const handleDownloadHtml = () => {
    const html = generateOfflineHtmlViewer(capsule);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasurefest_capsule_${capsule.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasurefest_payload_${capsule.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Wood Trim Header */}
        <div className="wood-trim px-6 py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100 leading-none">
                Long-Term Memory Permanence & Offline Vault
              </h3>
              <span className="text-[11px] text-amber-300/80">
                Arweave Permaweb Decentralized Storage & Standalone Viewer
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

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-200 bg-amber-50/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('envelope')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'envelope'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Encrypted JSON Payload
          </button>

          <button
            onClick={() => setActiveTab('standalone')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'standalone'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Standalone Offline HTML
          </button>

          <button
            onClick={() => setActiveTab('arweave')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'arweave'
                ? 'border-amber-800 text-amber-950'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Arweave TX Specs
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'envelope' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 leading-relaxed">
                This tamper-proof cryptographic envelope encapsulates your message, geolocation, media links, and unlock timestamp. It can be independently verified on the Arweave network.
              </p>
              <pre className="p-4 bg-stone-900 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto max-h-80 border border-stone-700 shadow-inner">
                {jsonString}
              </pre>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Payload (.json)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'standalone' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl parchment-subtle border border-amber-300/80 space-y-2">
                <h4 className="font-serif font-bold text-sm text-stone-900">
                  Zero-Dependency Standalone Offline Viewer
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Download a single, self-contained HTML file containing embedded cryptography, countdown logic, and your memory envelope. Even if servers or hosting go offline in 50 years, opening this file in any browser unlocks your memories once the timestamp passes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-amber-200 text-center space-y-3 shadow-xs">
                <FileText className="w-10 h-10 text-amber-700 mx-auto" />
                <h5 className="font-serif font-bold text-base text-stone-900">
                  treasurefest_capsule_{capsule.id}.html
                </h5>
                <button
                  onClick={handleDownloadHtml}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-bold text-xs shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
                >
                  {downloaded ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Downloaded to Computer!
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-amber-300" />
                      Download Standalone Viewer HTML
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'arweave' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-2">
                <span className="font-bold text-stone-800 block">Arweave Transaction Details</span>
                <div className="font-mono text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 break-all">
                  {capsule.arweave_tx_id}
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-600 pt-2">
                  <div><strong>Storage Provider:</strong> Irys Bundlr Gateway</div>
                  <div><strong>Permanence Guarantee:</strong> 200+ Years Permaweb</div>
                  <div><strong>Data Integrity:</strong> SHA-256 Merkle Proof</div>
                  <div><strong>Status:</strong> Sealed & Immutable</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
