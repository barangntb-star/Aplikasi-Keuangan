import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  FileSpreadsheet, 
  Receipt, 
  FileText, 
  Bot, 
  Upload, 
  Printer, 
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'dpa' | 'realisasi' | 'laporan';
  setActiveTab: (tab: 'dashboard' | 'dpa' | 'realisasi' | 'laporan') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  fiscalYear: number;
  setFiscalYear: (year: number) => void;
  usePaguPerubahan: boolean;
  setUsePaguPerubahan: (val: boolean) => void;
  onOpenAiDrawer: () => void;
  onOpenImportModal: () => void;
  onOpenPrintModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  fiscalYear,
  setFiscalYear,
  usePaguPerubahan,
  setUsePaguPerubahan,
  onOpenAiDrawer,
  onOpenImportModal,
  onOpenPrintModal,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800 sticky top-0 z-30">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-amber-900 px-4 py-2 text-xs border-b border-slate-800 flex flex-wrap justify-between items-center text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            PEMPROV NTB OFFICIAL
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="font-medium text-slate-200">
            Badan Kesatuan Bangsa dan Politik Dalam Negeri Provinsi Nusa Tenggara Barat
          </span>
        </div>

        <div className="flex items-center space-x-4 mt-1 sm:mt-0">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>TA:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="bg-slate-800 text-amber-300 font-semibold text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={2026}>2026 (Aktif)</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fase:</span>
            <button
              onClick={() => setUsePaguPerubahan(!usePaguPerubahan)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                usePaguPerubahan
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {usePaguPerubahan ? 'DPA Perubahan (APBD-P)' : 'DPA Murni'}
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Role:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-slate-800 text-emerald-300 font-medium text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Kepala Badan">Kepala Badan</option>
              <option value="Sekretaris">Sekretaris</option>
              <option value="Kepala Bidang (Kabid)">Kabid (PPK)</option>
              <option value="Bendahara Pengeluaran">Bendahara</option>
              <option value="Staf Operator">Staf Operator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          {/* NTB Provincial Crest / Badge Representation */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 p-0.5 shadow-lg shadow-emerald-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                BAKESBANGPOLDAGRI <span className="text-amber-400">NTB</span>
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                v2.6-BFMS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistem Informasi Keuangan & Management Realisasi Anggaran Daerah
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAiDrawer}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer border border-indigo-400/30"
          >
            <Bot className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Analis AI Gemini</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center space-x-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ikhtisar Keuangan & Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('dpa')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dpa'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>DPA & Pagu Anggaran</span>
          </button>

          <button
            onClick={() => setActiveTab('realisasi')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'realisasi'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Input Realisasi (SP2D)</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'laporan'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Realisasi Anggaran (LRA)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
