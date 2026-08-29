/**
 * Persistenza dei dati conversazionali.
 *
 * Usa SQLite (tramite better-sqlite3): un database su file, senza server,
 * perfetto per un progetto dimostrativo. Ogni messaggio (utente e assistente)
 * viene salvato e può essere recuperato per ricostruire l'intera chat.
 *
 * NOTA sui deploy gratuiti (es. Render free tier): il filesystem è effimero,
 * quindi il file del database viene azzerato a ogni riavvio/redeploy del
 * servizio. La persistenza è comunque reale e completa durante la sessione di
 * esecuzione. Per una persistenza permanente basta collegare un disco
 * persistente o un database gestito.
 */

const Database = require("better-sqlite3");
const path = require("path");

// Il percorso del file DB è configurabile via env (utile in produzione).
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "tongue.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Schema: una tabella per le conversazioni e una per i messaggi.
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id  TEXT NOT NULL,
    role             TEXT NOT NULL,          -- 'user' | 'assistant'
    content          TEXT NOT NULL,
    query_date       TEXT,                   -- data selezionata (solo per i turni utente)
    created_at       TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
`);

/** Crea la conversazione se non esiste ancora. */
function ensureConversation(conversationId) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO conversations (id, created_at) VALUES (?, ?)`
  ).run(conversationId, now);
}

/** Salva un singolo messaggio. */
function saveMessage({ conversationId, role, content, queryDate = null }) {
  ensureConversation(conversationId);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (conversation_id, role, content, query_date, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(conversationId, role, content, queryDate, now);
}

/** Recupera lo storico [{role, content}] di una conversazione, in ordine. */
function getHistory(conversationId) {
  return db
    .prepare(
      `SELECT role, content FROM messages
       WHERE conversation_id = ?
       ORDER BY id ASC`
    )
    .all(conversationId);
}

/** Recupera l'intera conversazione con metadati (per l'endpoint di lettura). */
function getConversation(conversationId) {
  const conversation = db
    .prepare(`SELECT * FROM conversations WHERE id = ?`)
    .get(conversationId);
  if (!conversation) return null;

  const messages = db
    .prepare(
      `SELECT role, content, query_date AS queryDate, created_at AS createdAt
       FROM messages WHERE conversation_id = ? ORDER BY id ASC`
    )
    .all(conversationId);

  return { ...conversation, messages };
}

module.exports = {
  saveMessage,
  getHistory,
  getConversation,
};
