import { SubKegiatan, TransaksiRealisasi, BidangType, RingkasanBidang } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  }
  return formatRupiah(amount);
}

export function calculateSubKegiatanRealisasi(
  subKegiatanId: string,
  transaksiList: TransaksiRealisasi[]
) {
  const filteredTx = transaksiList.filter((t) => t.subKegiatanId === subKegiatanId);
  const totalRealisasiKeuangan = filteredTx.reduce((acc, curr) => acc + curr.nilaiKeuangan, 0);
  const totalRealisasiFisik = Math.min(
    100,
    filteredTx.reduce((acc, curr) => acc + curr.prosentaseFisikTambahan, 0)
  );
  return { totalRealisasiKeuangan, totalRealisasiFisik, jumlahTransaksi: filteredTx.length };
}

export function getBidangSummaries(
  subKegiatanList: SubKegiatan[],
  transaksiList: TransaksiRealisasi[],
  usePaguPerubahan: boolean = false
): RingkasanBidang[] {
  const daftarBidang: BidangType[] = [
    'Sekretariat',
    'Ideologi & Wasbang',
    'Politik Dalam Negeri',
    'Ketahanan Ekososbud & Ormas',
    'Kewaspadaan Nasional & Penanganan Konflik',
  ];

  return daftarBidang.map((bidang) => {
    const subList = subKegiatanList.filter((s) => s.bidang === bidang);
    const totalPagu = subList.reduce(
      (acc, s) => acc + (usePaguPerubahan ? s.paguPerubahan : s.paguMurni),
      0
    );

    let totalRealisasiKeuangan = 0;
    let totalFisikWeighted = 0;

    subList.forEach((sub) => {
      const { totalRealisasiKeuangan: real, totalRealisasiFisik: fisik } =
        calculateSubKegiatanRealisasi(sub.id, transaksiList);
      totalRealisasiKeuangan += real;
      const paguSub = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
      totalFisikWeighted += (fisik * paguSub);
    });

    const persenKeuangan = totalPagu > 0 ? (totalRealisasiKeuangan / totalPagu) * 100 : 0;
    const persenFisik = totalPagu > 0 ? totalFisikWeighted / totalPagu : 0;
    const sisaPagu = totalPagu - totalRealisasiKeuangan;

    return {
      bidang,
      totalPagu,
      totalRealisasiKeuangan,
      persenKeuangan: Number(persenKeuangan.toFixed(2)),
      persenFisik: Number(persenFisik.toFixed(2)),
      sisaPagu,
      jumlahSubKegiatan: subList.length,
    };
  });
}

export function calculateGrandTotals(
  subKegiatanList: SubKegiatan[],
  transaksiList: TransaksiRealisasi[],
  usePaguPerubahan: boolean = false
) {
  const totalPagu = subKegiatanList.reduce(
    (acc, s) => acc + (usePaguPerubahan ? s.paguPerubahan : s.paguMurni),
    0
  );

  const totalRealisasiKeuangan = transaksiList.reduce((acc, t) => acc + t.nilaiKeuangan, 0);
  const sisaPagu = totalPagu - totalRealisasiKeuangan;
  const persenKeuangan = totalPagu > 0 ? (totalRealisasiKeuangan / totalPagu) * 100 : 0;

  // Weighted average physical percentage
  let totalFisikWeighted = 0;
  subKegiatanList.forEach((sub) => {
    const { totalRealisasiFisik: fisik } = calculateSubKegiatanRealisasi(sub.id, transaksiList);
    const paguSub = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
    totalFisikWeighted += (fisik * paguSub);
  });
  const persenFisik = totalPagu > 0 ? totalFisikWeighted / totalPagu : 0;

  return {
    totalPagu,
    totalRealisasiKeuangan,
    sisaPagu,
    persenKeuangan: Number(persenKeuangan.toFixed(2)),
    persenFisik: Number(persenFisik.toFixed(2)),
  };
}
