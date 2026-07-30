import React, { useState, useEffect } from 'react';
import { SubKegiatan, TransaksiRealisasi, AiEvaluationResponse } from '../types';
import { formatRupiah, getBidangSummaries, calculateGrandTotals } from '../utils/financeUtils';
import { 
  Bot, 
  X, 
  Sparkles, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  MessageSquare, 
  ShieldAlert, 
  UserCheck 
} from 'lucide-react';

interface AiAnalystDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subKegiatanList: SubKegiatan[];
  transaksiList: TransaksiRealisasi[];
  usePaguPerubahan: boolean;
}

export const AiAnalystDrawer: React.FC<AiAnalystDrawerProps> = ({
  isOpen,
  onClose,
  subKegiatanList,
  transaksiList,
  usePaguPerubahan,
}) => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'chat'>('evaluation');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiEvaluationResponse | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Halo! Saya Asisten AI Analis Keuangan BAKESBANGPOLDAGRI Provinsi NTB. Ada yang bisa saya bantu terkait evaluasi DPA, serapan anggaran SP2D, atau rekomendasi pergeseran APBD-P?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const totals = calculateGrandTotals(subKegiatanList, transaksiList, usePaguPerubahan);
  const bidangSummaries = getBidangSummaries(subKegiatanList, transaksiList, usePaguPerubahan);

  const fetchAiAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subKegiatanList,
          totalPagu: totals.totalPagu,
          totalRealisasi: totals.totalRealisasiKeuangan,
          persenKeuangan: totals.persenKeuangan,
          persenFisik: totals.persenFisik,
          bidangSummaries,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setAiAnalysis(resData.data);
      }
    } catch (err) {
      console.error('Error fetching AI evaluation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !aiAnalysis) {
      fetchAiAnalysis();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: userText,
          contextData: {
            totals,
            bidangSummaries,
            subKegiatanCount: subKegiatanList.length,
            transaksiCount: transaksiList.length,
          },
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: resData.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Maaf, sistem AI sedang berhalangan memproses jawaban.' }]);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Terjadi kesalahan koneksi ke server AI Gemini.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 w-full max-w-2xl h-full border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-0.5 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                AI Executive Financial Analyst
                <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono">
                  Gemini 3.6
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Konsultan Evaluasi & Penyerapan Anggaran BAKESBANGPOLDAGRI NTB
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'evaluation'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Laporan Evaluasi Otomatis</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tanya Jawab Chat AI</span>
          </button>
        </div>

        {/* Tab 1: Evaluation View */}
        {activeTab === 'evaluation' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">
                Data Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID')}
              </span>

              <button
                onClick={fetchAiAnalysis}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 cursor-pointer text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang Analisis AI</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-300 font-medium">Menganalisis data DPA & SP2D dengan Gemini AI...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                {/* Score & Summary */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">
                      Executive Summary & Performansi
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Score: {aiAnalysis.overallScore}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-xs">
                    {aiAnalysis.summary}
                  </p>
                </div>

                {/* Key Highlights */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Capaian Positif & Penyerapan Unggulan
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 pl-1">
                    {aiAnalysis.keyHighlights.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-emerald-400 font-bold mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Underperforming Areas */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-amber-400 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Atensi Penyerapan Lambat & Sub-Kegiatan Kunci
                  </h4>

                  <div className="space-y-2.5">
                    {aiAnalysis.underperformingAreas.map((area, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                              {area.bidang}
                            </span>
                            <h5 className="font-bold text-white text-xs mt-1">
                              {area.subKegiatan}
                            </h5>
                          </div>
                          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            Deviasi: {area.gapPersen}%
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <strong className="text-slate-300">Rekomendasi AI:</strong> {area.rekomendasi}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Advice */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-indigo-400 flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-1.5" />
                    Rekomendasi Strategis bagi Kepala Badan & Sekretaris
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {aiAnalysis.strategicAdvice.map((adv, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-2">{idx + 1}.</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Gagal memuat evaluasi AI. Silakan klik tombol 'Muat Ulang Analisis AI' di atas.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Chat View */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px] mb-1">
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Financial Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl rounded-bl-none text-xs text-slate-400 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                    <span>AI sedang berpikir...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanyakan analisis serapan, sisa pagu, atau rekomendasi..."
                className="flex-1 bg-slate-950 text-xs text-white px-3 py-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isChatLoading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow font-semibold text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
