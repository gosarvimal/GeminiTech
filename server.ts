import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side initialization of @google/genai SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Supported models based on task guidance
const VALID_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-4-argon',
];

interface ChatMessagePart {
  role: 'user' | 'model';
  content: string;
}

// Multi-turn chat endpoint (standard JSON response)
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<any> => {
  try {
    const { messages, model, systemInstruction, appDraftContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const selectedModel = VALID_MODELS.includes(model) ? model : 'gemini-3.8-flash';

    let sysInstruction =
      systemInstruction ||
      'You are a senior AI prompt consultant and software architect for HTML Application Prompt Generator Pro.';

    if (appDraftContext) {
      sysInstruction += `\n\n[CURRENT DRAFT APPLICATION SPECIFICATION]:\n${JSON.stringify(
        appDraftContext,
        null,
        2
      )}`;
    }

    const contents = messages.map((m: ChatMessagePart) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: sysInstruction,
        },
      });

      const reply = response.text || '';
      return res.json({ reply, model: selectedModel });
    } catch (primaryErr: any) {
      // If primary model faces temporary spike (503/429) and was not already flash-lite, retry with flash-lite
      if (selectedModel !== 'gemini-3.1-flash-lite' && (primaryErr?.status === 503 || primaryErr?.status === 429 || String(primaryErr?.message).includes('high demand'))) {
        console.warn(`Model ${selectedModel} busy, falling back to gemini-3.1-flash-lite`);
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: sysInstruction,
          },
        });
        const reply = fallbackResponse.text || '';
        return res.json({ reply, model: 'gemini-3.1-flash-lite (fast fallback)' });
      }
      throw primaryErr;
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to communicate with Gemini API.',
    });
  }
});

// Multi-turn streaming chat endpoint (Server-Sent Events)
app.post('/api/gemini/chat-stream', async (req: Request, res: Response): Promise<any> => {
  try {
    const { messages, model, systemInstruction, appDraftContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const selectedModel = VALID_MODELS.includes(model) ? model : 'gemini-3.8-flash';

    let sysInstruction =
      systemInstruction ||
      'You are a senior AI prompt consultant and software architect for HTML Application Prompt Generator Pro.';

    if (appDraftContext) {
      sysInstruction += `\n\n[CURRENT DRAFT APPLICATION SPECIFICATION]:\n${JSON.stringify(
        appDraftContext,
        null,
        2
      )}`;
    }

    const contents = messages.map((m: ChatMessagePart) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const streamResponse = await ai.models.generateContentStream({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: sysInstruction,
        },
      });

      for await (const chunk of streamResponse) {
        const text = chunk.text || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (primaryErr: any) {
      // If primary stream failed before emitting tokens, attempt flash-lite
      if (selectedModel !== 'gemini-3.1-flash-lite' && (primaryErr?.status === 503 || primaryErr?.status === 429 || String(primaryErr?.message).includes('high demand'))) {
        console.warn(`Streaming for ${selectedModel} busy, falling back to gemini-3.1-flash-lite`);
        const fallbackStream = await ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: sysInstruction,
          },
        });
        for await (const chunk of fallbackStream) {
          const text = chunk.text || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      throw primaryErr;
    }
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error?.message || 'Failed to stream from Gemini API.',
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

// Vite middleware or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
