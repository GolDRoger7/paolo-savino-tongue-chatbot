/**
 * Integrazione con l'LLM (OpenAI).
 *
 * Riceve: system prompt + articoli recuperati + storico conversazione +
 * messaggio dell'utente, e restituisce il testo di risposta.
 */

const OpenAI = require("openai");
const { SYSTEM_PROMPT } = require("./systemPrompt");
const { articlesToContext } = require("./newsClient");

// Il client legge automaticamente OPENAI_API_KEY dalle variabili d'ambiente.
const client = new OpenAI();

// Modello configurabile via env. Default: gpt-4o-mini.
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Genera la risposta del news analyst.
 *
 * @param {Object}   params
 * @param {string}   params.userMessage  Il messaggio dell'utente.
 * @param {string}   params.date         La data selezionata (YYYY-MM-DD).
 * @param {Array}    params.articles     Articoli recuperati dal news client.
 * @param {Array}    params.history      Storico [{role, content}] della chat.
 * @returns {Promise<string>}            Testo della risposta.
 */
async function generateSummary({ userMessage, date, articles, history = [] }) {
  const context = articlesToContext(articles);

  // Turno corrente: contesto (articoli) + richiesta dell'utente.
  const currentTurn =
    `Data selezionata dall'utente: ${date || "non specificata"}\n\n` +
    `${context}\n\n` +
    `Richiesta dell'utente: ${userMessage}`;

  // Ricostruisce la conversazione: system prompt + storico + turno corrente.
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: currentTurn },
  ];

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.3,
    messages,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();

  return text || "Non è stato possibile generare una risposta.";
}

module.exports = { generateSummary, MODEL };
