import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DpaManagement } from './components/DpaManagement';
import { RealisasiInput } from './components/RealisasiInput';
import { LaporanView } from './components/LaporanView';
import { AiAnalystDrawer } from './components/AiAnalystDrawer';
import { ExcelImportModal } from './components/ExcelImportModal';
import { PrintModal } from './components/PrintModal';

import { INITIAL_SUB_KEGIATAN, INITIAL_TRANSAKSI } from './data/initialData';
import { SubKegiatan, TransaksiRealisasi, UserRole, BidangType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dpa' | 'realisasi' | 'laporan'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Kepala Badan');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [usePaguPerubahan, setUsePaguPerubahan] = useState<boolean>(false);
  const [selectedBidangFilter, setSelectedBidangFilter] = useState<BidangType | 'Semua'>('Semua');

  // Main Financial State
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>(INITIAL_SUB_KEGIATAN);
  const [transaksiList, setTransaksiList] = useState<TransaksiRealisasi[]>(INITIAL_TRANSAKSI);

  // Modals / Drawers State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        fiscalYear={fiscalYear}
        setFiscalYear={setFiscalYear}
        usePaguPerubahan={usePaguPerubahan}
        setUsePaguPerubahan={setUsePaguPerubahan}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
      />

      {/* Main Body View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            subKegiatanList={subKegiatanList}
            transaksiList={transaksiList}
            usePaguPerubahan={usePaguPerubahan}
            onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
            setActiveTab={setActiveTab}
            selectedBidangFilter={selectedBidangFilter}
            setSelectedBidangFilter={setSelectedBidangFilter}
          />
        )}

        {activeTab === 'dpa' && (
          <DpaManagement
            subKegiatanList={subKegiatanList}
            setSubKegiatanList={setSubKegiatanList}
            transaksiList={transaksiList}
            usePaguPerubahan={usePaguPerubahan}
            selectedBidangFilter={selectedBidangFilter}
          />
        )}

        {activeTab === 'realisasi' && (
          <RealisasiInput
            subKegiatanList={subKegiatanList}
            transaksiList={transaksiList}
            setTransaksiList={setTransaksiList}
            usePaguPerubahan={usePaguPerubahan}
            userRole={userRole}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanView
            subKegiatanList={subKegiatanList}
            transaksiList={transaksiList}
            usePaguPerubahan={usePaguPerubahan}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />
        )}
      </main>

      {/* AI Analyst Side Drawer */}
      <AiAnalystDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        subKegiatanList={subKegiatanList}
        transaksiList={transaksiList}
        usePaguPerubahan={usePaguPerubahan}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        setSubKegiatanList={setSubKegiatanList}
        setTransaksiList={setTransaksiList}
      />

      {/* Printable Report Preview Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        subKegiatanList={subKegiatanList}
        transaksiList={transaksiList}
        usePaguPerubahan={usePaguPerubahan}
        userRole={userRole}
      />
    </div>
  );
}
