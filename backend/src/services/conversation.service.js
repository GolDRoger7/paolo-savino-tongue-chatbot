/**
 * Service: persistenza dei dati conversazionali su file JSON.
 *
 * Nessuna dipendenza nativa da compilare: scelta a prova di deploy sui free tier.
 * Ogni messaggio (utente e assistente) viene salvato e può essere recuperato per
 * ricostruire l'intera chat.
 *
 * NOTA: su disco effimero (es. Render free) il file si azzera a ogni riavvio; la
 * persistenza resta reale durante l'esecuzione. Per una durabilità permanente si
 * può sostituire questo service (stessa interfaccia) con un DB gestito.
 */

const fs = require("fs");
const config = require("../config/env");

const DATA_PATH = config.dbPath;

let store = { conversations: {} };

try {
  if (fs.existsSync(DATA_PATH)) {
    store = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) || { conversations: {} };
    if (!store.conversations) store.conversations = {};
  }
} catch (err) {
  console.warn("Impossibile leggere il file dati, si riparte da vuoto:", err.message);
  store = { conversations: {} };
}

// Salvataggio atomico: scrive un file temporaneo e poi lo rinomina.
function persist() {
  const tmp = `${DATA_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, DATA_PATH);
}

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

module.exports = { saveMessage, getHistory, getConversation };
