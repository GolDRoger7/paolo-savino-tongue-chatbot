/**
 * Persistenza dei dati conversazionali.
 *
 * Implementazione su file JSON (nessuna dipendenza nativa da compilare):
 * scelta volutamente per essere a prova di deploy su piattaforme gratuite,
 * dove compilare moduli C++ (es. SQLite) può fallire a seconda della versione
 * di Node. Ogni messaggio (utente e assistente) viene salvato e può essere
 * recuperato per ricostruire l'intera chat.
 *
 * NOTA sui deploy gratuiti (es. Render free tier): il filesystem è effimero,
 * quindi il file dati viene azzerato a ogni riavvio/redeploy del servizio. La
 * persistenza è comunque reale e completa durante la sessione di esecuzione.
 * Per una persistenza permanente basta collegare un disco persistente o un
 * database gestito e sostituire questo modulo mantenendo le stesse funzioni.
 */

const fs = require("fs");
const path = require("path");

// Percorso del file dati (configurabile via env).
const DATA_PATH = process.env.DB_PATH || path.join(__dirname, "tongue-data.json");

// Struttura in memoria: { conversations: { [id]: { id, created_at, messages: [] } } }
let store = { conversations: {} };

// Carica i dati esistenti all'avvio (se presenti).
try {
  if (fs.existsSync(DATA_PATH)) {
    store = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) || { conversations: {} };
    if (!store.conversations) store.conversations = {};
  }
} catch (err) {
  console.warn("Impossibile leggere il file dati, si riparte da vuoto:", err.message);
  store = { conversations: {} };
}

// Salva su disco in modo atomico (scrive un file temporaneo e poi lo rinomina).
function persist() {
  const tmp = `${DATA_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, DATA_PATH);
}

/** Crea la conversazione se non esiste ancora. */
function ensureConversation(conversationId) {
  if (!store.conversations[conversationId]) {
    store.conversations[conversationId] = {
      id: conversationId,
      created_at: new Date().toISOString(),
      messages: [],
    };
  }
}

/** Salva un singolo messaggio. */
function saveMessage({ conversationId, role, content, queryDate = null }) {
  ensureConversation(conversationId);
  store.conversations[conversationId].messages.push({
    role,
    content,
    queryDate,
    createdAt: new Date().toISOString(),
  });
  persist();
}

/** Recupera lo storico [{role, content}] di una conversazione, in ordine. */
function getHistory(conversationId) {
  const conv = store.conversations[conversationId];
  if (!conv) return [];
  return conv.messages.map((m) => ({ role: m.role, content: m.content }));
}

/** Recupera l'intera conversazione con metadati (per l'endpoint di lettura). */
function getConversation(conversationId) {
  const conv = store.conversations[conversationId];
  if (!conv) return null;
  return {
    id: conv.id,
    created_at: conv.created_at,
    messages: conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
      queryDate: m.queryDate,
      createdAt: m.createdAt,
    })),
  };
}

module.exports = {
  saveMessage,
  getHistory,
  getConversation,
};
