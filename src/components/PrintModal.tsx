import React from 'react';
import { SubKegiatan, TransaksiRealisasi, BidangType } from '../types';
import { formatRupiah, calculateSubKegiatanRealisasi } from '../utils/financeUtils';
import { Printer, X, Download } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  subKegiatanList: SubKegiatan[];
  transaksiList: TransaksiRealisasi[];
  usePaguPerubahan: boolean;
  userRole: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  subKegiatanList,
  transaksiList,
  usePaguPerubahan,
  userRole,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPaguGlobal = subKegiatanList.reduce(
    (acc, s) => acc + (usePaguPerubahan ? s.paguPerubahan : s.paguMurni),
    0
  );
  const totalRealisasiGlobal = transaksiList.reduce((acc, t) => acc + t.nilaiKeuangan, 0);
  const sisaGlobal = totalPaguGlobal - totalRealisasiGlobal;
  const percentGlobal = totalPaguGlobal > 0 ? (totalRealisasiGlobal / totalPaguGlobal) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 overflow-y-auto p-4 sm:p-8 flex justify-center">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-xl shadow-2xl p-8 space-y-6 my-auto printable-area border border-slate-200">
        {/* Action Header bar (hidden during print) */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Pratinjau Cetak Laporan LRA Resmi Pemprov NTB
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow cursor-pointer flex items-center space-x-1"
            >
              <Printer className="w-4 h-4 mr-1" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kop Surat Resmi NTB */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-4 space-y-1">
          <h2 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
            PEMERINTAH PROVINSI NUSA TENGGARA BARAT
          </h2>
          <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            BADAN KESATUAN BANGSA DAN POLITIK DALAM NEGERI
          </h1>
          <p className="text-[11px] text-slate-600 font-serif">
            Jalan Majapahit No. 51 Mataram, Nusa Tenggara Barat • Telp/Fax: (0370) 633123
          </p>
          <p className="text-[10px] text-slate-500 font-mono italic">
            Website: bakesbangpoldagri.ntbprov.go.id • Email: bakesbangpoldagri@ntbprov.go.id
          </p>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold uppercase text-slate-900 underline">
            LAPORAN REALISASI ANGGARAN (LRA) DPA-SKPD
          </h3>
          <p className="text-xs text-slate-700 font-semibold">
            TAHUN ANGGARAN 2026 ({usePaguPerubahan ? 'FASE APBD-PERUBAHAN' : 'FASE APBD-MURNI'})
          </p>
        </div>

        {/* Printable Table */}
        <table className="w-full text-left text-[11px] border-collapse border border-slate-900 font-serif">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900 text-center uppercase">
              <th className="p-2 border border-slate-900">Kode Sub-Kegiatan</th>
              <th className="p-2 border border-slate-900">Nomenklatur Sub-Kegiatan</th>
              <th className="p-2 border border-slate-900">Unit / Bidang</th>
              <th className="p-2 border border-slate-900 text-right">Pagu DPA (Rp)</th>
              <th className="p-2 border border-slate-900 text-right">Realisasi (Rp)</th>
              <th className="p-2 border border-slate-900 text-right">Sisa (Rp)</th>
              <th className="p-2 border border-slate-900 text-center">% Keu</th>
            </tr>
          </thead>
          <tbody>
            {subKegiatanList.map((sub) => {
              const { totalRealisasiKeuangan } = calculateSubKegiatanRealisasi(sub.id, transaksiList);
              const paguActive = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
              const sisa = paguActive - totalRealisasiKeuangan;
              const persen = paguActive > 0 ? (totalRealisasiKeuangan / paguActive) * 100 : 0;

              return (
                <tr key={sub.id} className="border-b border-slate-900">
                  <td className="p-2 border border-slate-900 font-mono font-bold text-slate-900">
                    {sub.kodeSubKegiatan}
                  </td>
                  <td className="p-2 border border-slate-900 font-sans text-slate-900">
                    {sub.namaSubKegiatan}
                  </td>
                  <td className="p-2 border border-slate-900 text-slate-800">
                    {sub.bidang}
                  </td>
                  <td className="p-2 border border-slate-900 text-right font-mono text-slate-900">
                    {formatRupiah(paguActive)}
                  </td>
                  <td className="p-2 border border-slate-900 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(totalRealisasiKeuangan)}
                  </td>
                  <td className="p-2 border border-slate-900 text-right font-mono text-slate-900">
                    {formatRupiah(sisa)}
                  </td>
                  <td className="p-2 border border-slate-900 text-center font-mono font-bold text-slate-900">
                    {persen.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold font-sans text-xs uppercase border-t-2 border-slate-900">
              <td colSpan={3} className="p-2.5 border border-slate-900 text-right">
                JUMLAH TOTAL
              </td>
              <td className="p-2.5 border border-slate-900 text-right font-mono">
                {formatRupiah(totalPaguGlobal)}
              </td>
              <td className="p-2.5 border border-slate-900 text-right font-mono">
                {formatRupiah(totalRealisasiGlobal)}
              </td>
              <td className="p-2.5 border border-slate-900 text-right font-mono">
                {formatRupiah(sisaGlobal)}
              </td>
              <td className="p-2.5 border border-slate-900 text-center font-mono text-sm font-extrabold">
                {percentGlobal.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Tanda Tangan Resmi (Signatures) */}
        <div className="pt-8 flex justify-between text-xs font-serif text-slate-900">
          <div className="text-center space-y-12">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold uppercase">Kepala Badan Kesbangpoldagri NTB</p>
            </div>
            <div className="pt-8">
              <p className="font-bold underline uppercase">H. RUSLAN, S.H., M.H.</p>
              <p className="text-[10px]">Pembina Utama Muda (IV/c)</p>
              <p className="text-[10px]">NIP. 19680512 199403 1 008</p>
            </div>
          </div>

          <div className="text-center space-y-12">
            <div>
              <p>Mataram, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold uppercase">Bendahara Pengeluaran</p>
            </div>
            <div className="pt-8">
              <p className="font-bold underline uppercase">SITI RAHMAWATI, S.E.</p>
              <p className="text-[10px]">Penata Muda Tk.I (III/b)</p>
              <p className="text-[10px]">NIP. 19850314 200902 2 004</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
