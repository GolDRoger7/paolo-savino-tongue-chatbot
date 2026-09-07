/**
 * Service: integrazione con l'LLM (OpenAI · gpt-4o-mini).
 *
 * Riceve system prompt + articoli + storico + messaggio utente e restituisce
 * il testo della sintesi.
 */

const OpenAI = require("openai");
const config = require("../config/env");
const { SYSTEM_PROMPT } = require("../prompts/systemPrompt");
const { articlesToContext } = require("./news.service");

// Client istanziato in modo lazy: importare il modulo non richiede la chiave,
// così i test possono caricarlo senza credenziali reali.
let client;
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

/**
 * Genera la risposta del news analyst.
 *
 * @param {Object} params
 * @param {string} params.userMessage  Il messaggio dell'utente.
 * @param {string} [params.date]       La data selezionata (YYYY-MM-DD).
 * @param {Array}  params.articles     Articoli recuperati dal news service.
 * @param {Array}  [params.history]    Storico [{role, content}] della chat.
 * @returns {Promise<string>}          Testo della risposta.
 */
async function generateSummary({ userMessage, date, articles, history = [] }) {
  const context = articlesToContext(articles);

  const currentTurn =
    `Data selezionata dall'utente: ${date || "non specificata"}\n\n` +
    `${context}\n\n` +
    `Richiesta dell'utente: ${userMessage}`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: currentTurn },
  ];

  const completion = await getClient().chat.completions.create({
    model: config.openaiModel,
    max_tokens: 1500,
    temperature: 0.3,
    messages,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  return text || "Non è stato possibile generare una risposta.";
}

module.exports = { generateSummary };
