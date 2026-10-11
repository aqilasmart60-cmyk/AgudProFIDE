import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI instance with required telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API: Chief Arbiter AI Consultation & Ruling Endpoint
app.post('/api/arbiter/consult', async (req: Request, res: Response) => {
  try {
    const { question, tournamentContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (!ai) {
      return res.status(200).json({
        ruling:
          'Chief Arbiter Rule Reference: In accordance with FIDE Laws of Chess (valid from 1 January 2023), any claim regarding illegal moves or defaults must be evaluated based on the game time control (Standard vs Rapid/Blitz Article 7 & Appendix A/B). For touch-move disputes (Article 4), touching a piece intentionally obligates moving or capturing if legal. Consult the official rulebook or recheck pairing constraints.',
        source: 'built-in-fide-offline-handbook',
        confidence: 'Standard Handbook Protocol',
      });
    }

    const systemPrompt = `You are an International Arbiter (IA) and FIDE Chief Arbiter AI, strictly following the FIDE Laws of Chess (current edition), the FIDE General Regulations for Competitions, and FIDE Swiss Pairing Rules (Dutch System C.04.1).
Your tone is objective, precise, authoritative, and structured. Always cite specific FIDE Articles (e.g., Article 4.3 for touch-move, Article 7.5.1 and 7.5.5 for illegal moves in Standard/Rapid/Blitz, Article 9.2 for threefold repetition, Article 6.7 for default time / zero-tolerance, Article 11.3 for electronic devices, and Swiss C.04.1 rules for color alternates and pairing floats).

Tournament Context:
${tournamentContext ? JSON.stringify(tournamentContext, null, 2) : 'No specific tournament data provided.'}

When answering:
1. Provide the Exact Ruling / Verdict.
2. Cite the specific FIDE Article(s) and Clause(s).
3. Specify the required clock adjustments (e.g. 2 minutes penalty in standard, 1 minute in blitz, or loss of game on 2nd illegal move).
4. Outline protocol for the scoresheet, arbiter notebook, and pairing effect (forfeits, half-point byes, zero-point byes).
Keep it crisp, actionable, and formatted cleanly.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\nUser Question/Dispute Scenario:\n${question}`,
    });

    const rulingText = response.text || 'Unable to generate ruling at this time.';
    res.json({ ruling: rulingText, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Error generating arbiter ruling:', error);
    res.status(500).json({
      error: error.message || 'Internal error in Arbiter consultation engine.',
    });
  }
});

// API: Chief Arbiter Official Tournament Report Generator
app.post('/api/arbiter/report', async (req: Request, res: Response) => {
  try {
    const { tournamentData } = req.body;
    if (!tournamentData) {
      return res.status(400).json({ error: 'Tournament data is required.' });
    }

    if (!ai) {
      return res.status(200).json({
        report: `## FIDE CHIEF ARBITER TOURNAMENT REPORT (OFFICIAL)
**Tournament:** ${tournamentData.name || 'Chess Championship'}
**System:** ${tournamentData.type || 'Swiss System'} (${tournamentData.rounds || 5} Rounds)
**Participants:** ${tournamentData.players?.length || 0} players registered

### 1. Tournament Administration & Conduct
The tournament proceeded smoothly according to FIDE Laws of Chess. Pairings were generated using standard algorithmic protocols with color balance strictly tracked. No formal protests were lodged to the Appeals Committee.

### 2. Standings & Tie-Break Hierarchy
Final standings have been determined with primary score, followed by Buchholz, Sonneborn-Berger, and Direct Encounter.`,
        source: 'built-in-template',
      });
    }

    const prompt = `Generate a formal, professional FIDE Chief Arbiter's Official Tournament Report for the following tournament data:
${JSON.stringify(tournamentData, null, 2)}

Include:
1. Executive Summary (Dates, Format, Venue, Arbiter Panel, Total Participants, Federation distribution)
2. Pairing System Performance & Color Balancing Review (anomalies, floats, byes)
3. Incidents, Default Times, and Arbiter Interventions (if any recorded, or clean record)
4. Title Norms & Performance Highlights (Top seeds performance, rating fluctuations)
5. Final Standings with Tie-Break breakdown
6. Certification Signature block for the Chief Arbiter

Format in clear, clean Markdown with tabular data where appropriate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ report: response.text, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Error generating tournament report:', error);
    res.status(500).json({ error: error.message || 'Error generating report' });
  }
});

// Start dev or production server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgudPro server listening on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
