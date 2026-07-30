import React, { useState } from 'react';
import { SubKegiatan, TransaksiRealisasi, BidangType } from '../types';
import { formatRupiah, calculateSubKegiatanRealisasi, calculateGrandTotals } from '../utils/financeUtils';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Building
} from 'lucide-react';

interface LaporanViewProps {
  subKegiatanList: SubKegiatan[];
  transaksiList: TransaksiRealisasi[];
  usePaguPerubahan: boolean;
  onOpenPrintModal: () => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  subKegiatanList,
  transaksiList,
  usePaguPerubahan,
  onOpenPrintModal,
}) => {
  const [selectedBidang, setSelectedBidang] = useState<BidangType | 'Semua'>('Semua');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('semua'); // 'semua', 'tw1', 'tw2', 'tw3', 'tw4', 'jan', 'feb', etc.

  // Filter Transactions by Period
  const getFilteredTxForPeriod = (subId: string) => {
    return transaksiList.filter((tx) => {
      if (tx.subKegiatanId !== subId) return false;

      if (selectedPeriod === 'tw1') return tx.bulan >= 1 && tx.bulan <= 3;
      if (selectedPeriod === 'tw2') return tx.bulan >= 4 && tx.bulan <= 6;
      if (selectedPeriod === 'tw3') return tx.bulan >= 7 && tx.bulan <= 9;
      if (selectedPeriod === 'tw4') return tx.bulan >= 10 && tx.bulan <= 12;

      if (selectedPeriod.startsWith('m-')) {
        const monthNum = parseInt(selectedPeriod.replace('m-', ''), 10);
        return tx.bulan === monthNum;
      }

      return true; // 'semua'
    });
  };

  const filteredSubKegiatan = selectedBidang === 'Semua'
    ? subKegiatanList
    : subKegiatanList.filter((s) => s.bidang === selectedBidang);

  // Grand totals calculation for current filter
  let totalPaguGlobal = 0;
  let totalRealisasiGlobal = 0;

  filteredSubKegiatan.forEach((sub) => {
    const pagu = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
    totalPaguGlobal += pagu;

    const txFiltered = getFilteredTxForPeriod(sub.id);
    const real = txFiltered.reduce((a, c) => a + c.nilaiKeuangan, 0);
    totalRealisasiGlobal += real;
  });

  const percentGlobal = totalPaguGlobal > 0 ? (totalRealisasiGlobal / totalPaguGlobal) * 100 : 0;
  const sisaGlobal = totalPaguGlobal - totalRealisasiGlobal;

  // Export to Excel handler
  const handleExportExcel = () => {
    const excelRows: any[] = [];

    // Header info
    excelRows.push(['PEMERINTAH PROVINSI NUSA TENGGARA BARAT']);
    excelRows.push(['BADAN KESATUAN BANGSA DAN POLITIK DALAM NEGERI (BAKESBANGPOLDAGRI)']);
    excelRows.push(['LAPORAN REALISASI ANGGARAN (LRA) TA 2026']);
    excelRows.push([`Periode: ${selectedPeriod.toUpperCase()} | Unit: ${selectedBidang}`]);
    excelRows.push([]); // blank

    excelRows.push([
      'Kode',
      'Uraian Program / Sub-Kegiatan / Rekening',
      'Unit Kerja',
      'PPK',
      'Pagu Murni (Rp)',
      'Pagu Perubahan (Rp)',
      'Realisasi (Rp)',
      'Sisa Pagu (Rp)',
      '% Keuangan',
      '% Fisik',
    ]);

    filteredSubKegiatan.forEach((sub) => {
      const tx = getFilteredTxForPeriod(sub.id);
      const realKeuangan = tx.reduce((a, c) => a + c.nilaiKeuangan, 0);
      const realFisik = Math.min(100, tx.reduce((a, c) => a + c.prosentaseFisikTambahan, 0));
      const paguActive = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
      const sisa = paguActive - realKeuangan;
      const persen = paguActive > 0 ? (realKeuangan / paguActive) * 100 : 0;

      // SubKegiatan Row
      excelRows.push([
        sub.kodeSubKegiatan,
        sub.namaSubKegiatan,
        sub.bidang,
        sub.ppkName,
        sub.paguMurni,
        sub.paguPerubahan,
        realKeuangan,
        sisa,
        Number(persen.toFixed(2)),
        Number(realFisik.toFixed(2)),
      ]);

      // Rekening Rows
      sub.rekeningBelanja.forEach((rek) => {
        const txRek = tx.filter((t) => t.kodeRekening === rek.kodeRekening);
        const realRek = txRek.reduce((a, c) => a + c.nilaiKeuangan, 0);
        const paguRek = usePaguPerubahan ? rek.paguPerubahan : rek.paguMurni;
        const sisaRek = paguRek - realRek;
        const persenRek = paguRek > 0 ? (realRek / paguRek) * 100 : 0;

        excelRows.push([
          `   ${rek.kodeRekening}`,
          `   - ${rek.namaRekening}`,
          sub.bidang,
          '',
          rek.paguMurni,
          rek.paguPerubahan,
          realRek,
          sisaRek,
          Number(persenRek.toFixed(2)),
          '-',
        ]);
      });
    });

    // Total Row
    excelRows.push([]);
    excelRows.push([
      'JUMLAH TOTAL',
      '',
      '',
      '',
      filteredSubKegiatan.reduce((a, c) => a + c.paguMurni, 0),
      filteredSubKegiatan.reduce((a, c) => a + c.paguPerubahan, 0),
      totalRealisasiGlobal,
      sisaGlobal,
      Number(percentGlobal.toFixed(2)),
      '-',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LRA BAKESBANGPOLDAGRI');
    XLSX.writeFile(workbook, `LRA_BAKESBANGPOLDAGRI_NTB_2026_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Official Heading */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md text-center space-y-1">
        <div className="flex justify-center items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Building className="w-4 h-4" />
          <span>PEMERINTAH PROVINSI NUSA TENGGARA BARAT</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          BADAN KESATUAN BANGSA DAN POLITIK DALAM NEGERI
        </h2>
        <p className="text-xs text-slate-400">
          Laporan Realisasi Anggaran Keuangan & Fisik (LRA DPA SKPD) Tahun Anggaran 2026
        </p>
      </div>

      {/* Control Filters & Download Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Unit Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedBidang}
              onChange={(e) => setSelectedBidang(e.target.value as any)}
              className="bg-slate-900 text-xs text-emerald-300 font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Semua">-- Semua Unit / Bidang --</option>
              <option value="Sekretariat">Sekretariat</option>
              <option value="Ideologi & Wasbang">Ideologi & Wasbang</option>
              <option value="Politik Dalam Negeri">Politik Dalam Negeri</option>
              <option value="Ketahanan Ekososbud & Ormas">Ketahanan Ekososbud & Ormas</option>
              <option value="Kewaspadaan Nasional & Penanganan Konflik">
                Kewaspadaan & Penanganan Konflik
              </option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-900 text-xs text-amber-300 font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="semua">Setahun Penuh (Jan - Des)</option>
              <option value="tw1">Triwulan I (Jan - Mar)</option>
              <option value="tw2">Triwulan II (Apr - Jun)</option>
              <option value="tw3">Triwulan III (Jul - Sep)</option>
              <option value="tw4">Triwulan IV (Okt - Des)</option>
              <option value="m-1">Januari</option>
              <option value="m-2">Februari</option>
              <option value="m-3">Maret</option>
              <option value="m-4">April</option>
              <option value="m-5">Mei</option>
              <option value="m-6">Juni</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Mode Cetak PDF / Laporan</span>
          </button>
        </div>
      </div>

      {/* Official LRA Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 border-r border-slate-800">Kode Nomenklatur</th>
                <th className="p-3 border-r border-slate-800">Uraian Program / Sub-Kegiatan / Rekening</th>
                <th className="p-3 border-r border-slate-800 text-right">Pagu Murni (Rp)</th>
                <th className="p-3 border-r border-slate-800 text-right">Pagu Perubahan (Rp)</th>
                <th className="p-3 border-r border-slate-800 text-right">Realisasi (Rp)</th>
                <th className="p-3 border-r border-slate-800 text-right">Sisa Pagu (Rp)</th>
                <th className="p-3 border-r border-slate-800 text-center">% Keu</th>
                <th className="p-3 text-center">% Fisik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {filteredSubKegiatan.map((sub) => {
                const tx = getFilteredTxForPeriod(sub.id);
                const realKeuangan = tx.reduce((a, c) => a + c.nilaiKeuangan, 0);
                const realFisik = Math.min(100, tx.reduce((a, c) => a + c.prosentaseFisikTambahan, 0));
                const paguActive = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
                const sisa = paguActive - realKeuangan;
                const persen = paguActive > 0 ? (realKeuangan / paguActive) * 100 : 0;

                return (
                  <React.Fragment key={sub.id}>
                    {/* Sub-Kegiatan Parent Row */}
                    <tr className="bg-slate-800/60 font-bold text-white border-t-2 border-slate-800">
                      <td className="p-3 border-r border-slate-800 text-emerald-400 whitespace-nowrap">
                        {sub.kodeSubKegiatan}
                      </td>
                      <td className="p-3 border-r border-slate-800 font-sans text-amber-300">
                        {sub.namaSubKegiatan}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Unit: {sub.bidang} | PPK: {sub.ppkName}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-800 text-right text-slate-300">
                        {formatRupiah(sub.paguMurni)}
                      </td>
                      <td className="p-3 border-r border-slate-800 text-right text-slate-200">
                        {formatRupiah(sub.paguPerubahan)}
                      </td>
                      <td className="p-3 border-r border-slate-800 text-right text-emerald-400">
                        {formatRupiah(realKeuangan)}
                      </td>
                      <td className="p-3 border-r border-slate-800 text-right text-slate-300">
                        {formatRupiah(sisa)}
                      </td>
                      <td className="p-3 border-r border-slate-800 text-center text-emerald-300">
                        {persen.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center text-amber-300">
                        {realFisik.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Child Rekening Rows */}
                    {sub.rekeningBelanja.map((rek) => {
                      const txRek = tx.filter((t) => t.kodeRekening === rek.kodeRekening);
                      const realRek = txRek.reduce((a, c) => a + c.nilaiKeuangan, 0);
                      const paguRek = usePaguPerubahan ? rek.paguPerubahan : rek.paguMurni;
                      const sisaRek = paguRek - realRek;
                      const persenRek = paguRek > 0 ? (realRek / paguRek) * 100 : 0;

                      return (
                        <tr key={rek.id} className="hover:bg-slate-950/60 text-slate-300">
                          <td className="p-2.5 pl-6 border-r border-slate-800 text-slate-400 text-[11px]">
                            {rek.kodeRekening}
                          </td>
                          <td className="p-2.5 pl-6 border-r border-slate-800 font-sans text-[11px] text-slate-300">
                            - {rek.namaRekening}
                            <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300/80 border border-slate-700">
                              {rek.kategori}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-right text-slate-400 text-[11px]">
                            {formatRupiah(rek.paguMurni)}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-right text-slate-400 text-[11px]">
                            {formatRupiah(rek.paguPerubahan)}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-right text-emerald-400 text-[11px]">
                            {formatRupiah(realRek)}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-right text-slate-500 text-[11px]">
                            {formatRupiah(sisaRek)}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-center text-slate-300 text-[11px]">
                            {persenRek.toFixed(1)}%
                          </td>
                          <td className="p-2.5 text-center text-slate-500 text-[11px]">
                            -
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Total Footer */}
            <tfoot className="bg-slate-950 font-mono font-bold text-white border-t-2 border-slate-800">
              <tr>
                <td colSpan={2} className="p-4 border-r border-slate-800 text-right uppercase tracking-wider font-sans text-xs">
                  JUMLAH TOTAL REKAPITULASI
                </td>
                <td className="p-4 border-r border-slate-800 text-right text-slate-300 text-xs">
                  {formatRupiah(filteredSubKegiatan.reduce((a, c) => a + c.paguMurni, 0))}
                </td>
                <td className="p-4 border-r border-slate-800 text-right text-slate-200 text-xs">
                  {formatRupiah(filteredSubKegiatan.reduce((a, c) => a + c.paguPerubahan, 0))}
                </td>
                <td className="p-4 border-r border-slate-800 text-right text-emerald-400 text-xs font-extrabold">
                  {formatRupiah(totalRealisasiGlobal)}
                </td>
                <td className="p-4 border-r border-slate-800 text-right text-amber-400 text-xs font-extrabold">
                  {formatRupiah(sisaGlobal)}
                </td>
                <td className="p-4 border-r border-slate-800 text-center text-emerald-400 text-sm font-extrabold">
                  {percentGlobal.toFixed(1)}%
                </td>
                <td className="p-4 text-center text-amber-400 text-xs">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
