import React, { useState } from 'react';
import { TransaksiRealisasi, SubKegiatan, JenisSP2D, BidangType } from '../types';
import { formatRupiah, calculateSubKegiatanRealisasi } from '../utils/financeUtils';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  FileCheck, 
  X,
  CreditCard
} from 'lucide-react';

interface RealisasiInputProps {
  subKegiatanList: SubKegiatan[];
  transaksiList: TransaksiRealisasi[];
  setTransaksiList: React.Dispatch<React.SetStateAction<TransaksiRealisasi[]>>;
  usePaguPerubahan: boolean;
  userRole: string;
}

export const RealisasiInput: React.FC<RealisasiInputProps> = ({
  subKegiatanList,
  transaksiList,
  setTransaksiList,
  usePaguPerubahan,
  userRole,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState<number | 0>(0);
  const [filterJenis, setFilterJenis] = useState<JenisSP2D | 'Semua'>('Semua');

  // Form states for new SP2D
  const [selectedSubId, setSelectedSubId] = useState<string>(subKegiatanList[0]?.id || '');
  const [noSP2D, setNoSP2D] = useState('');
  const [tanggalSP2D, setTanggalSP2D] = useState(new Date().toISOString().split('T')[0]);
  const [jenisSP2D, setJenisSP2D] = useState<JenisSP2D>('LS');
  const [kodeRekening, setKodeRekening] = useState('');
  const [uraian, setUraian] = useState('');
  const [nilaiKeuangan, setNilaiKeuangan] = useState<number>(0);
  const [prosentaseFisik, setProsentaseFisik] = useState<number>(5.0);
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [petugas, setPetugas] = useState(userRole || 'Siti Rahmawati (Bendahara)');

  // Selected SubKegiatan object
  const targetSub = subKegiatanList.find((s) => s.id === selectedSubId) || subKegiatanList[0];
  const { totalRealisasiKeuangan } = targetSub
    ? calculateSubKegiatanRealisasi(targetSub.id, transaksiList)
    : { totalRealisasiKeuangan: 0 };
  const paguSubActive = targetSub
    ? (usePaguPerubahan ? targetSub.paguPerubahan : targetSub.paguMurni)
    : 0;
  const sisaSubActive = paguSubActive - totalRealisasiKeuangan;

  // Filter Transactions
  const filteredTransaksi = transaksiList.filter((tx) => {
    const matchesBulan = filterBulan === 0 || tx.bulan === filterBulan;
    const matchesJenis = filterJenis === 'Semua' || tx.jenisSP2D === filterJenis;
    const matchesSearch =
      tx.noSP2D.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.namaSubKegiatan.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBulan && matchesJenis && matchesSearch;
  });

  const handleOpenModal = () => {
    if (subKegiatanList.length === 0) {
      alert('Tambahkan Sub-Kegiatan DPA terlebih dahulu.');
      return;
    }
    const defaultSub = subKegiatanList[0];
    setSelectedSubId(defaultSub.id);
    setNoSP2D(`900/${Math.floor(100 + Math.random() * 800)}/SP2D-${jenisSP2D}/2026`);
    setTanggalSP2D(new Date().toISOString().split('T')[0]);
    setJenisSP2D('LS');
    setKodeRekening(defaultSub.rekeningBelanja[0]?.kodeRekening || '5.1.02.01.01.0001');
    setUraian('');
    setNilaiKeuangan(25000000);
    setProsentaseFisik(5.0);
    setIsModalOpen(true);
  };

  const handleSubChange = (subId: string) => {
    setSelectedSubId(subId);
    const sub = subKegiatanList.find((s) => s.id === subId);
    if (sub && sub.rekeningBelanja.length > 0) {
      setKodeRekening(sub.rekeningBelanja[0].kodeRekening);
    }
  };

  const handleSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSub) return;

    if (nilaiKeuangan > sisaSubActive) {
      if (!confirm(`Peringatan: Nilai transaksi (Rp ${nilaiKeuangan.toLocaleString('id-ID')}) melebihi sisa pagu Sub-Kegiatan (Rp ${sisaSubActive.toLocaleString('id-ID')}). Apakah Anda yakin ingin melanjutkan pencatatan?`)) {
        return;
      }
    }

    const rekObj = targetSub.rekeningBelanja.find((r) => r.kodeRekening === kodeRekening);

    const newTx: TransaksiRealisasi = {
      id: `tx-${Date.now()}`,
      subKegiatanId: targetSub.id,
      kodeSubKegiatan: targetSub.kodeSubKegiatan,
      namaSubKegiatan: targetSub.namaSubKegiatan,
      bidang: targetSub.bidang,
      noSP2D,
      tanggalSP2D,
      jenisSP2D,
      kodeRekening: kodeRekening || '5.1.02.01.01.0001',
      namaRekening: rekObj?.namaRekening || 'Belanja Operasional Kantor',
      uraian,
      nilaiKeuangan: Number(nilaiKeuangan),
      prosentaseFisikTambahan: Number(prosentaseFisik),
      bulan: Number(bulan),
      petugas: petugas || 'Bendahara Pengeluaran',
    };

    setTransaksiList((prev) => [newTx, ...prev]);
    setIsModalOpen(false);
  };

  const handleDeleteTx = (id: string) => {
    if (confirm('Hapus transaksi pencairan SP2D ini?')) {
      setTransaksiList((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Receipt className="w-5 h-5 text-emerald-400 mr-2" />
            Pencatatan Realisasi Anggaran (Input SP2D)
          </h2>
          <p className="text-xs text-slate-400">
            Modul transaksi realisasi penerbitan SP2D (LS, UP, GU, TU) Keuangan & Fisik
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Input Transaksi SP2D Baru</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari No. SP2D, uraian, sub-kegiatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(Number(e.target.value))}
            className="w-full bg-slate-950 text-xs text-emerald-300 font-semibold p-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value={0}>-- Semua Bulan (Jan - Des) --</option>
            <option value={1}>Januari</option>
            <option value={2}>Februari</option>
            <option value={3}>Maret</option>
            <option value={4}>April</option>
            <option value={5}>Mei</option>
            <option value={6}>Juni</option>
            <option value={7}>Juli</option>
            <option value={8}>Agustus</option>
            <option value={9}>September</option>
            <option value={10}>Oktober</option>
            <option value={11}>November</option>
            <option value={12}>Desember</option>
          </select>
        </div>

        <div>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value as any)}
            className="w-full bg-slate-950 text-xs text-amber-300 font-semibold p-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="Semua">-- Semua Jenis SP2D --</option>
            <option value="LS">Pencairan LS (Langsung)</option>
            <option value="GU">Pencairan GU (Ganti Uang)</option>
            <option value="UP">Pencairan UP (Uang Persediaan)</option>
            <option value="TU">Pencairan TU (Tambahan Uang)</option>
          </select>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Daftar Riwayat Transaksi SP2D ({filteredTransaksi.length} Transaksi)
          </span>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Total Realisasi Terfilter: {formatRupiah(filteredTransaksi.reduce((a, c) => a + c.nilaiKeuangan, 0))}
          </span>
        </div>

        {filteredTransaksi.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Belum ada transaksi realisasi SP2D yang sesuai kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No. SP2D & Tgl</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Sub-Kegiatan & Rekening</th>
                  <th className="px-4 py-3">Uraian Belanja</th>
                  <th className="px-4 py-3 text-right">Nilai Keuangan (Rp)</th>
                  <th className="px-4 py-3 text-center">Fisik (%)</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTransaksi.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white text-xs">
                        {tx.noSP2D}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tx.tanggalSP2D} • {tx.petugas}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        tx.jenisSP2D === 'LS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : tx.jenisSP2D === 'GU'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        SP2D-{tx.jenisSP2D}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">
                        {tx.namaSubKegiatan}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 truncate">
                        {tx.kodeRekening} - {tx.namaRekening}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-sm text-slate-300">
                      <p className="line-clamp-2">{tx.uraian}</p>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                      {formatRupiah(tx.nilaiKeuangan)}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-semibold text-amber-300">
                      +{tx.prosentaseFisikTambahan}%
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Hapus SP2D"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Transaksi SP2D Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center">
                <CreditCard className="w-5 h-5 text-emerald-400 mr-2" />
                Input Transaksi Realisasi SP2D Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaksi} className="p-5 space-y-4 overflow-y-auto">
              {/* Select SubKegiatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Sub-Kegiatan DPA Target
                </label>
                <select
                  value={selectedSubId}
                  onChange={(e) => handleSubChange(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {subKegiatanList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.bidang}] {sub.kodeSubKegiatan} - {sub.namaSubKegiatan}
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>Pagu Sub: {formatRupiah(paguSubActive)}</span>
                  <span className="font-semibold text-emerald-400">Sisa Pagu Pokok: {formatRupiah(sisaSubActive)}</span>
                </div>
              </div>

              {/* No SP2D & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jenis SP2D
                  </label>
                  <select
                    value={jenisSP2D}
                    onChange={(e) => setJenisSP2D(e.target.value as JenisSP2D)}
                    className="w-full bg-slate-950 text-xs text-amber-300 font-semibold p-2.5 rounded-lg border border-slate-800 focus:outline-none"
                  >
                    <option value="LS">LS (Langsung)</option>
                    <option value="GU">GU (Ganti Uang)</option>
                    <option value="UP">UP (Uang Persediaan)</option>
                    <option value="TU">TU (Tambahan Uang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor Agenda SP2D
                  </label>
                  <input
                    type="text"
                    required
                    value={noSP2D}
                    onChange={(e) => setNoSP2D(e.target.value)}
                    placeholder="900/xxx/SP2D-LS/2026"
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Penerbitan SP2D
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalSP2D}
                    onChange={(e) => setTanggalSP2D(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Kode Rekening & Bulan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kode Rekening Belanja
                  </label>
                  <select
                    value={kodeRekening}
                    onChange={(e) => setKodeRekening(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-emerald-300 font-mono p-2.5 rounded-lg border border-slate-800 focus:outline-none"
                  >
                    {targetSub?.rekeningBelanja.map((rek) => (
                      <option key={rek.id} value={rek.kodeRekening}>
                        {rek.kodeRekening} - {rek.namaRekening}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bulan Realisasi
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(Number(e.target.value))}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none"
                  >
                    <option value={1}>1 - Januari</option>
                    <option value={2}>2 - Februari</option>
                    <option value={3}>3 - Maret</option>
                    <option value={4}>4 - April</option>
                    <option value={5}>5 - Mei</option>
                    <option value={6}>6 - Juni</option>
                    <option value={7}>7 - Juli</option>
                    <option value={8}>8 - Agustus</option>
                    <option value={9}>9 - September</option>
                    <option value={10}>10 - Oktober</option>
                    <option value={11}>11 - November</option>
                    <option value={12}>12 - Desember</option>
                  </select>
                </div>
              </div>

              {/* Uraian Belanja */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Uraian Keperluan Pencairan Belanja (Sesuai SPM/SP2D)
                </label>
                <textarea
                  required
                  rows={2}
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                  placeholder="Deskripsi pencairan dana..."
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Nilai Keuangan & Fisik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nilai Keuangan SP2D (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={nilaiKeuangan}
                    onChange={(e) => setNilaiKeuangan(Number(e.target.value))}
                    className="w-full bg-slate-950 text-sm font-mono font-bold text-emerald-400 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Terbilang: {formatRupiah(nilaiKeuangan)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capaian Fisik Tambahan (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    max={100}
                    value={prosentaseFisik}
                    onChange={(e) => setProsentaseFisik(Number(e.target.value))}
                    className="w-full bg-slate-950 text-sm font-mono font-bold text-amber-400 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Persentase progres fisik pekerjaan/kegiatan
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Petugas Input / Bendahara
                </label>
                <input
                  type="text"
                  required
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-slate-300 p-2.5 rounded-lg border border-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer flex items-center space-x-1"
                >
                  <FileCheck className="w-4 h-4 mr-1" />
                  <span>Simpan Transaksi SP2D</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
