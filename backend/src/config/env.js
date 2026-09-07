/**
 * Configurazione centralizzata: legge le variabili d'ambiente in un unico punto.
 * Il resto dell'applicazione importa questo modulo invece di leggere process.env
 * sparso ovunque.
 */

require("dotenv").config();
const path = require("path");

const config = {
  port: process.env.PORT || 3000,

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",

  // NewsAPI
  newsApiKey: process.env.NEWS_API_KEY,
  newsLanguage: process.env.NEWS_LANGUAGE || "it",
  newsPageSize: Number(process.env.NEWS_PAGE_SIZE || 20),

  // Persistenza (file JSON)
  dbPath: process.env.DB_PATH || path.join(__dirname, "..", "..", "tongue-data.json"),
};

module.exports = config;
