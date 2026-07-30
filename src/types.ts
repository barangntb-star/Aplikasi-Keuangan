export type BidangType = 
  | 'Sekretariat'
  | 'Ideologi & Wasbang'
  | 'Politik Dalam Negeri'
  | 'Ketahanan Ekososbud & Ormas'
  | 'Kewaspadaan Nasional & Penanganan Konflik';

export type UserRole = 
  | 'Kepala Badan'
  | 'Sekretaris'
  | 'Kepala Bidang (Kabid)'
  | 'Pejabat Pembuat Komitmen (PPK)'
  | 'Bendahara Pengeluaran'
  | 'Staf Operator';

export type JenisSP2D = 'UP' | 'GU' | 'TU' | 'LS';

export interface SubKegiatan {
  id: string;
  kodeSubKegiatan: string; // e.g. "1.05.01.2.01.01"
  namaSubKegiatan: string;
  bidang: BidangType;
  ppkName: string;
  paguMurni: number;
  paguPerubahan: number;
  targetFisik: number; // percentage, e.g. 100
  rekeningBelanja: RekeningBelanja[];
}

export interface RekeningBelanja {
  id: string;
  subKegiatanId: string;
  kodeRekening: string; // e.g. "5.1.02.01.01.0024"
  namaRekening: string; // e.g. "Belanja Alat/Bahan untuk Kegiatan Kantor-Kertas dan Cover"
  kategori: 'Pegawai' | 'Barang & Jasa' | 'Modal' | 'Hibah / Bantuan';
  paguMurni: number;
  paguPerubahan: number;
}

export interface TransaksiRealisasi {
  id: string;
  subKegiatanId: string;
  kodeSubKegiatan: string;
  namaSubKegiatan: string;
  bidang: BidangType;
  noSP2D: string;
  tanggalSP2D: string; // YYYY-MM-DD
  jenisSP2D: JenisSP2D;
  kodeRekening: string;
  namaRekening: string;
  uraian: string;
  nilaiKeuangan: number;
  prosentaseFisikTambahan: number; // e.g. 5.5%
  bulan: number; // 1 - 12
  petugas: string;
}

export interface TargetBulanan {
  bulan: number; // 1-12
  namaBulan: string;
  targetKeuanganPersen: number; // e.g. Jan = 8%, Feb = 15%, etc.
  targetFisikPersen: number;
}

export interface RingkasanBidang {
  bidang: BidangType;
  totalPagu: number;
  totalRealisasiKeuangan: number;
  persenKeuangan: number;
  persenFisik: number;
  sisaPagu: number;
  jumlahSubKegiatan: number;
}

export interface AiEvaluationResponse {
  summary: string;
  overallScore: 'Sangat Baik' | 'Baik' | 'Perlu Perhatian' | 'Kritis';
  keyHighlights: string[];
  underperformingAreas: Array<{
    subKegiatan: string;
    bidang: string;
    pagu: number;
    realisasi: number;
    gapPersen: number;
    rekomendasi: string;
  }>;
  strategicAdvice: string[];
}
