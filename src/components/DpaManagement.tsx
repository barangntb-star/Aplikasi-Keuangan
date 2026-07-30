import React, { useState } from 'react';
import { SubKegiatan, RekeningBelanja, BidangType } from '../types';
import { formatRupiah, calculateSubKegiatanRealisasi } from '../utils/financeUtils';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Layers, 
  UserCheck, 
  Tag, 
  X
} from 'lucide-react';

interface DpaManagementProps {
  subKegiatanList: SubKegiatan[];
  setSubKegiatanList: React.Dispatch<React.SetStateAction<SubKegiatan[]>>;
  transaksiList: any[];
  usePaguPerubahan: boolean;
  selectedBidangFilter: BidangType | 'Semua';
}

export const DpaManagement: React.FC<DpaManagementProps> = ({
  subKegiatanList,
  setSubKegiatanList,
  transaksiList,
  usePaguPerubahan,
  selectedBidangFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBidang, setFilterBidang] = useState<BidangType | 'Semua'>(selectedBidangFilter);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // Modal State for SubKegiatan Add/Edit
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubKegiatan | null>(null);

  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formBidang, setFormBidang] = useState<BidangType>('Sekretariat');
  const [formPpk, setFormPpk] = useState('');
  const [formPaguMurni, setFormPaguMurni] = useState<number>(0);
  const [formPaguPerubahan, setFormPaguPerubahan] = useState<number>(0);

  // Modal State for Rekening
  const [isRekeningModalOpen, setIsRekeningModalOpen] = useState(false);
  const [targetSubIdForRekening, setTargetSubIdForRekening] = useState<string>('');
  const [rekKode, setRekKode] = useState('');
  const [rekNama, setRekNama] = useState('');
  const [rekKategori, setRekKategori] = useState<'Pegawai' | 'Barang & Jasa' | 'Modal' | 'Hibah / Bantuan'>('Barang & Jasa');
  const [rekPaguMurni, setRekPaguMurni] = useState<number>(0);

  // Filter Logic
  const filteredSubKegiatan = subKegiatanList.filter((sub) => {
    const matchesBidang = filterBidang === 'Semua' || sub.bidang === filterBidang;
    const matchesSearch =
      sub.namaSubKegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.kodeSubKegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.ppkName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBidang && matchesSearch;
  });

  const handleOpenAddSub = () => {
    setEditingSub(null);
    setFormKode(`8.01.0${subKegiatanList.length + 1}.2.01.0${subKegiatanList.length + 1}`);
    setFormNama('');
    setFormBidang('Sekretariat');
    setFormPpk('');
    setFormPaguMurni(100000000);
    setFormPaguPerubahan(100000000);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: SubKegiatan) => {
    setEditingSub(sub);
    setFormKode(sub.kodeSubKegiatan);
    setFormNama(sub.namaSubKegiatan);
    setFormBidang(sub.bidang);
    setFormPpk(sub.ppkName);
    setFormPaguMurni(sub.paguMurni);
    setFormPaguPerubahan(sub.paguPerubahan);
    setIsSubModalOpen(true);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama || !formKode) return;

    if (editingSub) {
      setSubKegiatanList((prev) =>
        prev.map((s) =>
          s.id === editingSub.id
            ? {
                ...s,
                kodeSubKegiatan: formKode,
                namaSubKegiatan: formNama,
                bidang: formBidang,
                ppkName: formPpk,
                paguMurni: Number(formPaguMurni),
                paguPerubahan: Number(formPaguPerubahan),
              }
            : s
        )
      );
    } else {
      const newSub: SubKegiatan = {
        id: `sub-${Date.now()}`,
        kodeSubKegiatan: formKode,
        namaSubKegiatan: formNama,
        bidang: formBidang,
        ppkName: formPpk || 'Operator DPA',
        paguMurni: Number(formPaguMurni),
        paguPerubahan: Number(formPaguPerubahan),
        targetFisik: 100,
        rekeningBelanja: [],
      };
      setSubKegiatanList((prev) => [...prev, newSub]);
    }
    setIsSubModalOpen(false);
  };

  const handleDeleteSub = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus Sub-Kegiatan ini beserta seluruh rekening anggarannya?')) {
      setSubKegiatanList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleOpenAddRekening = (subId: string) => {
    setTargetSubIdForRekening(subId);
    setRekKode('5.1.02.01.01.0001');
    setRekNama('');
    setRekKategori('Barang & Jasa');
    setRekPaguMurni(50000000);
    setIsRekeningModalOpen(true);
  };

  const handleSaveRekening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rekNama || !rekKode) return;

    const newRekening: RekeningBelanja = {
      id: `rek-${Date.now()}`,
      subKegiatanId: targetSubIdForRekening,
      kodeRekening: rekKode,
      namaRekening: rekNama,
      kategori: rekKategori,
      paguMurni: Number(rekPaguMurni),
      paguPerubahan: Number(rekPaguMurni),
    };

    setSubKegiatanList((prev) =>
      prev.map((s) => {
        if (s.id === targetSubIdForRekening) {
          const updatedRek = [...s.rekeningBelanja, newRekening];
          // Recalculate SubKegiatan Pagu from Rekening sum
          const totalRekMurni = updatedRek.reduce((acc, r) => acc + r.paguMurni, 0);
          return {
            ...s,
            rekeningBelanja: updatedRek,
            paguMurni: totalRekMurni,
            paguPerubahan: totalRekMurni,
          };
        }
        return s;
      })
    );

    setIsRekeningModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Layers className="w-5 h-5 text-emerald-400 mr-2" />
            Pengelolaan DPA & Pagu Anggaran (DPA-SKPD)
          </h2>
          <p className="text-xs text-slate-400">
            Daftar Sub-Kegiatan, Kode Rekening Belanja, dan Pagu APBD Murni / Perubahan 2026
          </p>
        </div>

        <button
          onClick={handleOpenAddSub}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sub-Kegiatan DPA</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama sub-kegiatan, kode, PPK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-medium text-slate-400 whitespace-nowrap">Filter Bidang:</label>
          <select
            value={filterBidang}
            onChange={(e) => setFilterBidang(e.target.value as BidangType | 'Semua')}
            className="w-full sm:w-auto bg-slate-950 text-xs text-emerald-300 font-semibold px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Semua">Semua Unit Kerja</option>
            <option value="Sekretariat">Sekretariat</option>
            <option value="Ideologi & Wasbang">Ideologi & Wasbang</option>
            <option value="Politik Dalam Negeri">Politik Dalam Negeri</option>
            <option value="Ketahanan Ekososbud & Ormas">Ketahanan Ekososbud & Ormas</option>
            <option value="Kewaspadaan Nasional & Penanganan Konflik">
              Kewaspadaan & Penanganan Konflik
            </option>
          </select>
        </div>
      </div>

      {/* SubKegiatan List Accordion / Table */}
      <div className="space-y-3">
        {filteredSubKegiatan.length === 0 ? (
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
            Tidak ada Sub-Kegiatan DPA yang sesuai dengan pencarian.
          </div>
        ) : (
          filteredSubKegiatan.map((sub) => {
            const isExpanded = expandedSubId === sub.id;
            const { totalRealisasiKeuangan, totalRealisasiFisik } = calculateSubKegiatanRealisasi(
              sub.id,
              transaksiList
            );
            const paguActive = usePaguPerubahan ? sub.paguPerubahan : sub.paguMurni;
            const persenReal = paguActive > 0 ? (totalRealisasiKeuangan / paguActive) * 100 : 0;

            return (
              <div
                key={sub.id}
                className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md transition-all hover:border-slate-700"
              >
                {/* SubKegiatan Card Header */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                      className="mt-0.5 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {sub.kodeSubKegiatan}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {sub.bidang}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center">
                          <UserCheck className="w-3 h-3 mr-1 text-slate-500" />
                          PPK: {sub.ppkName}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug">
                        {sub.namaSubKegiatan}
                      </h3>
                    </div>
                  </div>

                  {/* Finance Progress & Pagu Summary */}
                  <div className="flex items-center space-x-6 justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">
                        Pagu DPA ({usePaguPerubahan ? 'APBD-P' : 'Murni'})
                      </p>
                      <p className="text-sm font-bold font-mono text-white">
                        {formatRupiah(paguActive)}
                      </p>
                      {usePaguPerubahan && sub.paguMurni !== sub.paguPerubahan && (
                        <p className="text-[10px] text-slate-500 font-mono line-through">
                          Murni: {formatRupiah(sub.paguMurni)}
                        </p>
                      )}
                    </div>

                    <div className="w-28 text-right">
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">
                        Serapan Keuangan
                      </p>
                      <p className="text-xs font-bold font-mono text-emerald-400">
                        {persenReal.toFixed(1)}%
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, persenReal)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 pl-2">
                      <button
                        onClick={() => handleOpenEditSub(sub)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Sub-Kegiatan"
                      >
                        <Edit3 className="w-4 h-4 text-amber-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Hapus Sub-Kegiatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SubKegiatan Expanded Detail: Rekening Belanja List */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                        <Tag className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Rincian Kode Rekening Belanja ({sub.rekeningBelanja.length} Item)
                      </h4>

                      <button
                        onClick={() => handleOpenAddRekening(sub.id)}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded border border-slate-700 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Rekening</span>
                      </button>
                    </div>

                    {sub.rekeningBelanja.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        Belum ada kode rekening belanja. Klik 'Tambah Rekening' untuk mengisi alokasi anggaran.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                            <tr>
                              <th className="px-3 py-2">Kode Rekening</th>
                              <th className="px-3 py-2">Uraian Rekening Belanja</th>
                              <th className="px-3 py-2">Kategori</th>
                              <th className="px-3 py-2 text-right">Pagu Murni</th>
                              <th className="px-3 py-2 text-right">Pagu Perubahan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {sub.rekeningBelanja.map((rek) => (
                              <tr key={rek.id} className="hover:bg-slate-900/50">
                                <td className="px-3 py-2 font-mono text-emerald-400 font-medium">
                                  {rek.kodeRekening}
                                </td>
                                <td className="px-3 py-2 text-slate-200">
                                  {rek.namaRekening}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700 font-semibold">
                                    {rek.kategori}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-slate-300">
                                  {formatRupiah(rek.paguMurni)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-emerald-400 font-semibold">
                                  {formatRupiah(rek.paguPerubahan)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit SubKegiatan */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="text-base font-bold text-white">
                {editingSub ? 'Edit Sub-Kegiatan DPA' : 'Tambah Sub-Kegiatan DPA Baru'}
              </h3>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Sub-Kegiatan
                </label>
                <input
                  type="text"
                  required
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  placeholder="Contoh: 8.01.01.1.01.01"
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Nomenklatur Sub-Kegiatan
                </label>
                <textarea
                  required
                  rows={2}
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama sub-kegiatan DPA..."
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit / Bidang
                  </label>
                  <select
                    value={formBidang}
                    onChange={(e) => setFormBidang(e.target.value as BidangType)}
                    className="w-full bg-slate-950 text-xs text-emerald-300 p-2.5 rounded-lg border border-slate-800 focus:outline-none"
                  >
                    <option value="Sekretariat">Sekretariat</option>
                    <option value="Ideologi & Wasbang">Ideologi & Wasbang</option>
                    <option value="Politik Dalam Negeri">Politik Dalam Negeri</option>
                    <option value="Ketahanan Ekososbud & Ormas">Ketahanan Ekososbud & Ormas</option>
                    <option value="Kewaspadaan Nasional & Penanganan Konflik">
                      Kewaspadaan & Penanganan Konflik
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama PPK / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    value={formPpk}
                    onChange={(e) => setFormPpk(e.target.value)}
                    placeholder="Nama PPK..."
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pagu APBD Murni (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPaguMurni}
                    onChange={(e) => setFormPaguMurni(Number(e.target.value))}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pagu APBD Perubahan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPaguPerubahan}
                    onChange={(e) => setFormPaguPerubahan(Number(e.target.value))}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  Simpan Sub-Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Rekening Belanja */}
      {isRekeningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="text-base font-bold text-white">
                Tambah Rekening Belanja DPA
              </h3>
              <button
                onClick={() => setIsRekeningModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRekening} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Rekening Belanja
                </label>
                <input
                  type="text"
                  required
                  value={rekKode}
                  onChange={(e) => setRekKode(e.target.value)}
                  placeholder="Contoh: 5.1.02.01.01.0024"
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Uraian Rekening Belanja
                </label>
                <input
                  type="text"
                  required
                  value={rekNama}
                  onChange={(e) => setRekNama(e.target.value)}
                  placeholder="Nama rekening belanja..."
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Belanja
                </label>
                <select
                  value={rekKategori}
                  onChange={(e) => setRekKategori(e.target.value as any)}
                  className="w-full bg-slate-950 text-xs text-amber-300 p-2.5 rounded-lg border border-slate-800 focus:outline-none"
                >
                  <option value="Pegawai">Belanja Pegawai</option>
                  <option value="Barang & Jasa">Belanja Barang & Jasa</option>
                  <option value="Modal">Belanja Modal</option>
                  <option value="Hibah / Bantuan">Belanja Hibah / Bantuan Keuangan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pagu Anggaran (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={rekPaguMurni}
                  onChange={(e) => setRekPaguMurni(Number(e.target.value))}
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRekeningModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  Tambah Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
