/**
 * Backend del chatbot Tongue.
 *
 * Espone un unico endpoint principale (/api/chat) che:
 *   1. riceve il testo dell'utente e la data;
 *   2. recupera gli articoli dalla testata giornalistica (NewsAPI);
 *   3. chiama l'LLM passando system prompt + articoli + messaggio utente
 *      (con lo storico della conversazione);
 *   4. salva i dati conversazionali (persistenza);
 *   5. restituisce la risposta.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const { fetchArticles } = require("./newsClient");
const { generateSummary, MODEL } = require("./llm");
const { saveMessage, getHistory, getConversation } = require("./db");

const app = express();
app.use(cors()); // consente le chiamate dal frontend (GitHub Pages)
app.use(express.json());

// Health check (utile per verificare che il servizio sia attivo).
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: MODEL });
});

// Endpoint principale della chat.
app.post("/api/chat", async (req, res) => {
  try {
    const { message, date, conversationId } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Il campo 'message' è obbligatorio." });
    }

    // Usa l'id conversazione fornito dal client, oppure ne genera uno nuovo.
    const convId = conversationId || crypto.randomUUID();

    // 1) Recupera gli articoli dalla testata giornalistica.
    const articles = await fetchArticles(message, date);

    // Se non ci sono articoli, evitiamo di chiamare l'LLM (risparmio + UX chiara).
    if (articles.length === 0) {
      const reply =
        "Non ho trovato notizie per questa data e questa richiesta. " +
        "Prova con un'altra data o con una richiesta più generica.";
      saveMessage({ conversationId: convId, role: "user", content: message, queryDate: date });
      saveMessage({ conversationId: convId, role: "assistant", content: reply });
      return res.json({ conversationId: convId, reply, articlesCount: 0, articles: [] });
    }

    // 2) Recupera lo storico per il contesto multi-turno.
    const history = getHistory(convId);

    // 3) Chiama l'LLM.
    const reply = await generateSummary({
      userMessage: message,
      date,
      articles,
      history,
    });

    // 4) Persistenza: salva il turno utente e il turno assistente.
    saveMessage({ conversationId: convId, role: "user", content: message, queryDate: date });
    saveMessage({ conversationId: convId, role: "assistant", content: reply });

    // 5) Risposta al frontend.
    res.json({
      conversationId: convId,
      reply,
      articlesCount: articles.length,
      articles: articles.map((a) => ({
        title: a.title,
        source: a.source,
        url: a.url,
      })),
    });
  } catch (err) {
    console.error("Errore /api/chat:", err);
    res.status(500).json({ error: err.message || "Errore interno del server." });
  }
});

// Recupero dell'intera conversazione salvata (persistenza dei dati chat).
app.get("/api/conversations/:id", (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversazione non trovata." });
  }
  res.json(conversation);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tongue backend in ascolto sulla porta ${PORT} (modello: ${MODEL})`);
});
