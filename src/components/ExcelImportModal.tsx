import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SubKegiatan, TransaksiRealisasi, BidangType } from '../types';
import { 
  Upload, 
  X, 
  FileCheck2, 
  CheckCircle, 
  AlertCircle, 
  Download 
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  setSubKegiatanList: React.Dispatch<React.SetStateAction<SubKegiatan[]>>;
  setTransaksiList: React.Dispatch<React.SetStateAction<TransaksiRealisasi[]>>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  setSubKegiatanList,
  setTransaksiList,
}) => {
  const [importType, setImportType] = useState<'subKegiatan' | 'transaksi'>('subKegiatan');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsSuccess(false);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
          setErrorMessage('File Excel kosong atau tidak memiliki baris data.');
          return;
        }

        setParsedData(data);
      } catch (err: any) {
        setErrorMessage(`Gagal membaca file Excel: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = () => {
    if (parsedData.length < 2) return;

    try {
      // Header row is parsedData[0]
      const rows = parsedData.slice(1);

      if (importType === 'subKegiatan') {
        const newSubItems: SubKegiatan[] = [];

        rows.forEach((row, idx) => {
          if (!row[0] || !row[1]) return; // Skip blank rows

          const kode = String(row[0]).trim();
          const nama = String(row[1]).trim();
          const bidangRaw = row[2] ? String(row[2]).trim() : 'Sekretariat';
          const ppk = row[3] ? String(row[3]).trim() : 'PPK DPA';
          const paguMurni = Number(row[4]) || 100000000;
          const paguPerubahan = Number(row[5]) || paguMurni;

          let bidang: BidangType = 'Sekretariat';
          if (bidangRaw.toLowerCase().includes('wasbang') || bidangRaw.toLowerCase().includes('ideologi')) {
            bidang = 'Ideologi & Wasbang';
          } else if (bidangRaw.toLowerCase().includes('politik') || bidangRaw.toLowerCase().includes('poldagri')) {
            bidang = 'Politik Dalam Negeri';
          } else if (bidangRaw.toLowerCase().includes('ormas') || bidangRaw.toLowerCase().includes('ekososbud')) {
            bidang = 'Ketahanan Ekososbud & Ormas';
          } else if (bidangRaw.toLowerCase().includes('konflik') || bidangRaw.toLowerCase().includes('waspada')) {
            bidang = 'Kewaspadaan Nasional & Penanganan Konflik';
          }

          newSubItems.push({
            id: `sub-imp-${Date.now()}-${idx}`,
            kodeSubKegiatan: kode,
            namaSubKegiatan: nama,
            bidang,
            ppkName: ppk,
            paguMurni,
            paguPerubahan,
            targetFisik: 100,
            rekeningBelanja: [
              {
                id: `rek-imp-${Date.now()}-${idx}`,
                subKegiatanId: `sub-imp-${Date.now()}-${idx}`,
                kodeRekening: '5.1.02.01.01.0001',
                namaRekening: 'Belanja Barang dan Jasa Operasional DPA',
                kategori: 'Barang & Jasa',
                paguMurni,
                paguPerubahan,
              },
            ],
          });
        });

        if (newSubItems.length === 0) {
          setErrorMessage('Format kolom Excel tidak sesuai.');
          return;
        }

        setSubKegiatanList((prev) => [...prev, ...newSubItems]);
        setIsSuccess(true);
      } else {
        // Import Realisasi Transaksi
        const newTxItems: TransaksiRealisasi[] = [];

        rows.forEach((row, idx) => {
          if (!row[0] || !row[1]) return;

          const noSP2D = String(row[0]).trim();
          const tgl = row[1] ? String(row[1]).trim() : '2026-06-01';
          const subKode = String(row[2] || '').trim();
          const nilai = Number(row[3]) || 1000000;
          const uraian = row[4] ? String(row[4]).trim() : 'Pencairan SP2D via Import Excel';

          newTxItems.push({
            id: `tx-imp-${Date.now()}-${idx}`,
            subKegiatanId: 'sub-1', // Default fallback or map to match
            kodeSubKegiatan: subKode || '8.01.01.1.01.01',
            namaSubKegiatan: 'Kegiatan Hasil Import Excel',
            bidang: 'Sekretariat',
            noSP2D,
            tanggalSP2D: tgl,
            jenisSP2D: 'LS',
            kodeRekening: '5.1.02.01.01.0001',
            namaRekening: 'Belanja Import Excel',
            uraian,
            nilaiKeuangan: nilai,
            prosentaseFisikTambahan: 5.0,
            bulan: 6,
            petugas: 'Operator Import Excel',
          });
        });

        setTransaksiList((prev) => [...newTxItems, ...prev]);
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(`Gagal memproses import data: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    let templateData: any[] = [];
    if (importType === 'subKegiatan') {
      templateData = [
        ['Kode_Sub_Kegiatan', 'Nama_Sub_Kegiatan', 'Bidang', 'Nama_PPK', 'Pagu_Murni_Rp', 'Pagu_Perubahan_Rp'],
        ['8.01.06.2.01.01', 'Fasilitasi Hubungan Antar Lembaga NTB', 'Sekretariat', 'H. Ahmad, M.Si.', 250000000, 300000000],
        ['8.01.06.2.01.02', 'Sosialisasi Bahaya Radikalisme & Intoleransi', 'Ideologi & Wasbang', 'Dr. Sukarni', 400000000, 450000000],
      ];
    } else {
      templateData = [
        ['No_SP2D', 'Tanggal_SP2D', 'Kode_Sub_Kegiatan', 'Nilai_Keuangan_Rp', 'Uraian_Belanja'],
        ['900/501/SP2D-LS/2026', '2026-06-15', '8.01.01.1.01.01', 50000000, 'Pembayaran Honorarium Tim Operator'],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Template_Import_${importType}_BFMS_NTB.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-base font-bold text-white flex items-center">
            <Upload className="w-5 h-5 text-emerald-400 mr-2" />
            Import Data Excel (.xlsx / .csv)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Import Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Jenis Data yang Akan Di-Import
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setImportType('subKegiatan');
                  setParsedData([]);
                  setIsSuccess(false);
                }}
                className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                  importType === 'subKegiatan'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm mb-0.5">DPA & Sub-Kegiatan</div>
                <div className="text-[11px] font-normal text-slate-400">Import Struktur Pagu Anggaran Baru</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportType('transaksi');
                  setParsedData([]);
                  setIsSuccess(false);
                }}
                className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                  importType === 'transaksi'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm mb-0.5">Riwayat SP2D Realisasi</div>
                <div className="text-[11px] font-normal text-slate-400">Import Catatan Realisasi Keuangan</div>
              </button>
            </div>
          </div>

          {/* Download Template Button */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-200">Unduh Format Excel Standar</p>
              <p className="text-[11px] text-slate-400">Gunakan template resmi agar pemetaan kolom otomatis presisi</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded border border-slate-700 flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template .xlsx</span>
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center bg-slate-950/50 hover:bg-slate-950 transition-colors relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {fileName ? fileName : 'Klik atau seret file Excel (.xlsx / .csv) ke sini'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Mendukung format Microsoft Excel & CSV</p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Data Excel berhasil di-import dan ditambahkan ke dalam sistem!</span>
            </div>
          )}

          {/* Preview Parsed Count */}
          {parsedData.length > 1 && !isSuccess && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
              <span>Siap mengimport <strong className="text-emerald-400">{parsedData.length - 1} baris</strong> data.</span>
              <button
                onClick={handleExecuteImport}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded shadow transition-all cursor-pointer flex items-center space-x-1"
              >
                <FileCheck2 className="w-4 h-4 mr-1" />
                <span>Proses Import Now</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
