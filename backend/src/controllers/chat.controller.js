/**
 * Controller: orchestra la richiesta HTTP delegando la logica ai service.
 * Non contiene logica di business (sta nei service) né definizioni di rotta.
 */

const crypto = require("crypto");
const config = require("../config/env");
const newsService = require("../services/news.service");
const llmService = require("../services/llm.service");
const conversationService = require("../services/conversation.service");

const NO_ARTICLES_REPLY =
  "Non ho trovato notizie per questa data e questa richiesta. " +
  "Prova con un'altra data o con una richiesta più generica.";

/** POST /api/chat */
async function postChat(req, res, next) {
  try {
    const { message, date, conversationId } = req.validatedBody;
    const convId = conversationId || crypto.randomUUID();

    // 1) Recupera gli articoli dalla testata giornalistica.
    const articles = await newsService.fetchArticles(message, date);

    // Nessun articolo: rispondiamo subito, senza chiamare l'LLM.
    if (articles.length === 0) {
      conversationService.saveMessage({ conversationId: convId, role: "user", content: message, queryDate: date });
      conversationService.saveMessage({ conversationId: convId, role: "assistant", content: NO_ARTICLES_REPLY });
      return res.json({ conversationId: convId, reply: NO_ARTICLES_REPLY, articlesCount: 0, articles: [] });
    }

    // 2) Contesto multi-turno + chiamata all'LLM.
    const history = conversationService.getHistory(convId);
    const reply = await llmService.generateSummary({ userMessage: message, date, articles, history });

    // 3) Persistenza del turno.
    conversationService.saveMessage({ conversationId: convId, role: "user", content: message, queryDate: date });
    conversationService.saveMessage({ conversationId: convId, role: "assistant", content: reply });

    // 4) Risposta.
    res.json({
      conversationId: convId,
      reply,
      articlesCount: articles.length,
      articles: articles.map((a) => ({ title: a.title, source: a.source, url: a.url })),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/conversations/:id */
function getConversation(req, res) {
  const { id } = req.validatedParams;
  const conversation = conversationService.getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversazione non trovata." });
  }
  res.json(conversation);
}

/** GET /api/health */
function health(req, res) {
  res.json({ status: "ok", model: config.openaiModel });
}

module.exports = { postChat, getConversation, health };
