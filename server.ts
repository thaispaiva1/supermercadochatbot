import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemInstruction, history, apiKey: reqApiKey } = req.body;

    const apiKey = process.env.GEMINI_API_KEY || reqApiKey;
    if (!apiKey) {
      return res.status(400).json({ error: 'Chave GEMINI_API_KEY não configurada no ambiente.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Format contents with history
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-8).forEach((item: any) => {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }],
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: 0.75,
      },
    });

    const reply = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ reply });
  } catch (err: any) {
    console.error('Erro na API Gemini:', err);
    return res.status(500).json({ error: err.message || 'Erro ao processar com Gemini' });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
