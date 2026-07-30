import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI client server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Endpoint 1: Comprehensive Financial Evaluation & Executive Briefing
  app.post('/api/ai/analyze-budget', async (req, res) => {
    try {
      const { subKegiatanList, totalPagu, totalRealisasi, persenKeuangan, persenFisik, bidangSummaries } = req.body;

      const prompt = `
Anda adalah Pakar Analis Keuangan Daerah & Evaluator Anggaran Publik Senior untuk Pemprov NTB.
Tugas Anda adalah menganalisis data Anggaran & Realisasi BAKESBANGPOLDAGRI Provinsi NTB (Badan Kesatuan Bangsa dan Politik Dalam Negeri Provinsi Nusa Tenggara Barat).

Data Ringkasan Eksekutif Keuangan:
- Total Pagu Anggaran (DPA): Rp ${totalPagu.toLocaleString('id-ID')}
- Total Realisasi Keuangan: Rp ${totalRealisasi.toLocaleString('id-ID')} (${persenKeuangan}% dari Pagu)
- Total Capaian Fisik: ${persenFisik}%
- Breakdown Per Bidang: ${JSON.stringify(bidangSummaries, null, 2)}
- Rincian Sub-Kegiatan: ${JSON.stringify(subKegiatanList, null, 2)}

Berikan analisis mendalam berformat JSON dengan bidang/property sebagai berikut:
1. "summary": Ringkasan eksekutif 2-3 kalimat mengenai performa keuangan secara keseluruhan.
2. "overallScore": Nilai performa ("Sangat Baik" / "Baik" / "Perlu Perhatian" / "Kritis").
3. "keyHighlights": Array 3-4 poin pencapaian positif atau sub-kegiatan yang serapannya sangat baik.
4. "underperformingAreas": Array objek sub-kegiatan yang serapannya lambat atau mengalami deviasi negatif tinggi (minimal 2-3 item).
   Setiap item memiliki property:
   - "subKegiatan": nama sub-kegiatan
   - "bidang": nama bidang
   - "pagu": pagu nominal
   - "realisasi": realisasi nominal
   - "gapPersen": persentase selisih/deviasi
   - "rekomendasi": rekomendasi aksi konkrit bagi PPK / Kabid
5. "strategicAdvice": Array 3-4 rekomendasi langkah strategis bagi Kepala Badan & Sekretaris untuk percepatan penyerapan anggaran menjelang DPA Perubahan atau Akhir Tahun Anggaran.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah Asisten Keuangan Utama BAKESBANGPOLDAGRI Provinsi NTB yang profesional, lugas, presisi, dan sesuai regulasi pengelolaan keuangan daerah (Permendagri No. 77/2020).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              overallScore: { type: Type.STRING },
              keyHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              underperformingAreas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subKegiatan: { type: Type.STRING },
                    bidang: { type: Type.STRING },
                    pagu: { type: Type.NUMBER },
                    realisasi: { type: Type.NUMBER },
                    gapPersen: { type: Type.NUMBER },
                    rekomendasi: { type: Type.STRING },
                  },
                },
              },
              strategicAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const analysisResult = JSON.parse(response.text || '{}');
      res.json({ success: true, data: analysisResult });
    } catch (error: any) {
      console.error('Error generating AI budget analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Gagal menghasilkan analisis AI.',
      });
    }
  });

  // AI Endpoint 2: Interactive Financial Assistant Chat
  app.post('/api/ai/chat-assistant', async (req, res) => {
    try {
      const { userQuestion, contextData } = req.body;

      const prompt = `
Pertanyaan Pengguna: "${userQuestion}"

Konteks Data Keuangan Saat Ini (BAKESBANGPOLDAGRI Provinsi NTB):
${JSON.stringify(contextData, null, 2)}

Petunjuk untuk Anda:
- Jawablah pertanyaan dengan sopan, akurat, ringkas, dan langsung merujuk pada data angka Pagu, Realisasi, SP2D, atau Bidang yang ada di konteks data di atas.
- Gunakan bahasa Indonesia resmi pemerintahan (Pemprov NTB).
- Sebutkan angka nominal dalam format Rupiah jika relevan.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah AI Financial Analyst & Consultant untuk Badan Kesatuan Bangsa dan Politik Dalam Negeri (BAKESBANGPOLDAGRI) Provinsi NTB.',
        },
      });

      res.json({ success: true, reply: response.text || 'Maaf, tidak dapat memproses jawaban saat ini.' });
    } catch (error: any) {
      console.error('Error in AI chat assistant:', error);
      res.status(500).json({ success: false, error: error.message || 'Gagal berkomunikasi dengan AI.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server BFMS BAKESBANGPOLDAGRI NTB running on http://localhost:${PORT}`);
  });
}

startServer();
