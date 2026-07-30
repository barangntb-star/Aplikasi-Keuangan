import React from 'react';
import { 
  SubKegiatan, 
  TransaksiRealisasi, 
  BidangType 
} from '../types';
import { 
  formatRupiah, 
  formatShortRupiah, 
  getBidangSummaries, 
  calculateGrandTotals 
} from '../utils/financeUtils';
import { TARGET_BULANAN_2026 } from '../data/initialData';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Award, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  subKegiatanList: SubKegiatan[];
  transaksiList: TransaksiRealisasi[];
  usePaguPerubahan: boolean;
  onOpenAiDrawer: () => void;
  setActiveTab: (tab: 'dashboard' | 'dpa' | 'realisasi' | 'laporan') => void;
  selectedBidangFilter: BidangType | 'Semua';
  setSelectedBidangFilter: (bidang: BidangType | 'Semua') => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({
  subKegiatanList,
  transaksiList,
  usePaguPerubahan,
  onOpenAiDrawer,
  setActiveTab,
  selectedBidangFilter,
  setSelectedBidangFilter,
}) => {
  // Filter subkegiatan & transaksi if a specific bidang filter is active
  const filteredSub = selectedBidangFilter === 'Semua'
    ? subKegiatanList
    : subKegiatanList.filter(s => s.bidang === selectedBidangFilter);

  const filteredTx = selectedBidangFilter === 'Semua'
    ? transaksiList
    : transaksiList.filter(t => t.bidang === selectedBidangFilter);

  const grandTotals = calculateGrandTotals(filteredSub, filteredTx, usePaguPerubahan);
  const bidangSummaries = getBidangSummaries(subKegiatanList, transaksiList, usePaguPerubahan);

  // Status Serapan Badge calculation
  let statusSerapan = 'Sangat Baik';
  let statusColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  if (grandTotals.persenKeuangan < 40) {
    statusSerapan = 'Perlu Perhatian Khusus';
    statusColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  } else if (grandTotals.persenKeuangan < 60) {
    statusSerapan = 'Cukup Baik';
    statusColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  } else if (grandTotals.persenKeuangan < 80) {
    statusSerapan = 'Baik';
    statusColor = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  }

  // Monthly Cumulative Trend data
  const monthlyTrendData = TARGET_BULANAN_2026.map((m) => {
    // Sum all transactions up to this month
    const cumulativeReal = filteredTx
      .filter((t) => t.bulan <= m.bulan)
      .reduce((acc, curr) => acc + curr.nilaiKeuangan, 0);

    const targetNominal = (m.targetKeuanganPersen / 100) * grandTotals.totalPagu;
    const realPersen = grandTotals.totalPagu > 0 ? (cumulativeReal / grandTotals.totalPagu) * 100 : 0;

    return {
      bulan: m.namaBulan.substring(0, 3),
      targetPersen: m.targetKeuanganPersen,
      realisasiPersen: Number(realPersen.toFixed(1)),
      targetNominal: Math.round(targetNominal / 1_000_000),
      realisasiNominal: Math.round(cumulativeReal / 1_000_000),
    };
  });

  // Category Breakdown Data
  const categoryMap: Record<string, number> = {
    'Pegawai': 0,
    'Barang & Jasa': 0,
    'Modal': 0,
    'Hibah / Bantuan': 0,
  };

  filteredSub.forEach((sub) => {
    sub.rekeningBelanja.forEach((rek) => {
      const pagu = usePaguPerubahan ? rek.paguPerubahan : rek.paguMurni;
      categoryMap[rek.kategori] = (categoryMap[rek.kategori] || 0) + pagu;
    });
  });

  const categoryChartData = Object.keys(categoryMap).map((key) => ({
    name: key,
    value: categoryMap[key],
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Bidang Filter Selector */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-semibold text-xs tracking-wider uppercase">
              PROVINSI NUSA TENGGARA BARAT
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 text-xs font-mono">DPA APBD 2026</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Dashboard Realisasi Anggaran Keuangan & Fisik
          </h2>
          <p className="text-xs text-slate-400">
            {selectedBidangFilter === 'Semua'
              ? 'Menampilkan konsolidasi seluruh Bidang & Sekretariat Bakesbangpoldagri NTB'
              : `Menampilkan data khusus unit kerja: ${selectedBidangFilter}`}
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <label className="text-xs font-medium text-slate-400 pl-2">Filter Unit:</label>
          <select
            value={selectedBidangFilter}
            onChange={(e) => setSelectedBidangFilter(e.target.value as BidangType | 'Semua')}
            className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Semua">-- Semua Unit / Bidang (Konsolidasi) --</option>
            <option value="Sekretariat">Sekretariat</option>
            <option value="Ideologi & Wasbang">Bidang Ideologi & Wasbang</option>
            <option value="Politik Dalam Negeri">Bidang Politik Dalam Negeri</option>
            <option value="Ketahanan Ekososbud & Ormas">Bidang Ketahanan Ekososbud & Ormas</option>
            <option value="Kewaspadaan Nasional & Penanganan Konflik">
              Bidang Kewaspadaan & Penanganan Konflik
            </option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pagu */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Total Pagu DPA ({usePaguPerubahan ? 'APBD-P' : 'Murni'})
            </p>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-3 font-mono">
            {formatRupiah(grandTotals.totalPagu)}
          </h3>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{filteredSub.length} Sub-Kegiatan</span>
            <span className="text-emerald-400 font-medium">Fase Active</span>
          </div>
        </div>

        {/* Card 2: Realisasi Keuangan */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-blue-400" />
          </div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Realisasi Keuangan (SP2D)
            </p>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-3">
            <h3 className="text-xl font-bold text-white font-mono">
              {formatRupiah(grandTotals.totalRealisasiKeuangan)}
            </h3>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mr-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, grandTotals.persenKeuangan)}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono whitespace-nowrap">
              {grandTotals.persenKeuangan}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
            <span>Transasi: {filteredTx.length} SP2D</span>
            <span className="text-slate-300">Target Jun: 50%</span>
          </div>
        </div>

        {/* Card 3: Capaian Fisik */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Capaian Realisasi Fisik
            </p>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-3 font-mono">
            {grandTotals.persenFisik}%
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tertimbang berdasarkan bobot DPA Sub-Kegiatan
          </p>
          <div className="mt-3 flex items-center text-xs text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>Deviasi Fisik vs Keuangan: +{(grandTotals.persenFisik - grandTotals.persenKeuangan).toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 4: Sisa Pagu & Status */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Sisa Pagu Anggaran
            </p>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}>
              {statusSerapan}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-3 font-mono">
            {formatRupiah(grandTotals.sisaPagu)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Sisa Pokok: {(100 - grandTotals.persenKeuangan).toFixed(1)}% dari Total DPA
          </p>
          <button
            onClick={onOpenAiDrawer}
            className="mt-3 w-full py-1.5 px-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold rounded border border-indigo-700/50 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Evaluasi AI Gemini</span>
          </button>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Trend Kumulatif (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <TrendingUp className="w-5 h-5 text-emerald-400 mr-2" />
                Grafik Progres Realisasi Keuangan Bulanan vs Target DPA (2026)
              </h3>
              <p className="text-xs text-slate-400">
                Membandingkan target kurva-S kumulatif DPA dengan realisasi SP2D (dalam Juta Rupiah)
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-slate-300">Realisasi (Jt)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                <span className="text-slate-300">Target DPA (Jt)</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `Rp ${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: any, name: any) => [
                    `Rp ${Number(value).toLocaleString('id-ID')} Juta`,
                    name === 'realisasiNominal' ? 'Realisasi Keuangan' : 'Target DPA',
                  ]}
                />
                <Area type="monotone" dataKey="targetNominal" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTarget)" />
                <Area type="monotone" dataKey="realisasiNominal" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRealisasi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Donut */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center mb-1">
              <PieChartIcon className="w-5 h-5 text-amber-400 mr-2" />
              Proporsi Kategori Belanja DPA
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Distribusi anggaran berdasarkan jenis belanja daerah
            </p>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Total Pagu']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            {categoryChartData.map((cat, idx) => (
              <div key={cat.name} className="flex justify-between items-center text-slate-300">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span>{cat.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-200">
                  {formatShortRupiah(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3 & Bidang Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Realisasi Per Bidang */}
        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <Award className="w-5 h-5 text-emerald-400 mr-2" />
              Perbandingan Pagu vs Realisasi Keuangan Per Unit / Bidang
            </h3>
            <p className="text-xs text-slate-400">
              Evaluasi kinerja anggaran antar Bidang dan Sekretariat Bakesbangpoldagri NTB
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bidangSummaries}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="bidang"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={12}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize={9}
                        transform="rotate(-15)"
                      >
                        {payload.value.length > 18 ? `${payload.value.substring(0, 16)}...` : payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickFormatter={(val) => `Rp ${(val / 1_000_000_000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any) => [formatRupiah(Number(val))]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalPagu" name="Total Pagu (DPA)" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalRealisasiKeuangan" name="Realisasi Keuangan" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & AI Summary Box */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Ringkasan Analisis AI</h3>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">
                Gemini 3.6 Flash
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <p className="font-semibold text-emerald-400 mb-1 flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  Status Penyerapan Umum
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Penyerapan Anggaran berada pada tingkat <strong className="text-white">{grandTotals.persenKeuangan}%</strong>.
                  Realisasi tertinggi berada pada <strong className="text-amber-300">Bidang Politik Dalam Negeri</strong> dengan pencairan Bantuan Keuangan Partai Politik (Banpol).
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <p className="font-semibold text-amber-400 mb-1">
                  Atensi Pimpinan
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Sub-Kegiatan Pemeliharaan Gedung & Pengawasan Ormas memerlukan percepatan SP2D termin kedua sebelum evaluasi DPA Perubahan.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={onOpenAiDrawer}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Buka Asisten Laporan AI</span>
            </button>

            <button
              onClick={() => setActiveTab('laporan')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700"
            >
              <span>Lihat Detail Laporan LRA Official</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Bidang Performance Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">
              Tabel Rincian Serapan Anggaran Per Unit / Bidang Kerja
            </h3>
            <p className="text-xs text-slate-400">
              Evaluasi kinerja finansial per Bidang berdasarkan DPA BAKESBANGPOLDAGRI NTB 2026
            </p>
          </div>
          <button
            onClick={() => setActiveTab('dpa')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            Lihat Semua Sub-Kegiatan &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Unit / Bidang Kerja</th>
                <th className="px-4 py-3 text-right">Sub-Kegiatan</th>
                <th className="px-4 py-3 text-right">Total Pagu (DPA)</th>
                <th className="px-4 py-3 text-right">Realisasi Keuangan</th>
                <th className="px-4 py-3 text-right">% Keuangan</th>
                <th className="px-4 py-3 text-right">% Fisik</th>
                <th className="px-4 py-3 text-right">Sisa Pagu</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {bidangSummaries.map((b) => {
                let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                let statusText = 'Baik';
                if (b.persenKeuangan < 30) {
                  badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  statusText = 'Lambat';
                } else if (b.persenKeuangan < 50) {
                  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  statusText = 'Sedang';
                } else if (b.persenKeuangan >= 70) {
                  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  statusText = 'Sangat Baik';
                }

                return (
                  <tr key={b.bidang} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      {b.bidang}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {b.jumlahSubKegiatan}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">
                      {formatRupiah(b.totalPagu)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">
                      {formatRupiah(b.totalRealisasiKeuangan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {b.persenKeuangan}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-300 font-semibold">
                      {b.persenFisik}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {formatRupiah(b.sisaPagu)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border ${badgeColor}`}>
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
