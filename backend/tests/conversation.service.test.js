/**
 * Test unitari del service di persistenza (file JSON su percorso temporaneo).
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

// Percorso dati temporaneo: non tocca i dati reali. Va impostato PRIMA di
// importare il service (che legge config.dbPath in fase di import).
const tmpFile = path.join(os.tmpdir(), `tongue-conv-${Date.now()}.json`);
process.env.DB_PATH = tmpFile;

const conversationService = require("../src/services/conversation.service");

afterAll(() => {
  try {
    fs.unlinkSync(tmpFile);
  } catch (_) {
    /* ignore */
  }
});

describe("conversation.service", () => {
  const convId = "11111111-1111-4111-8111-111111111111";

  test("salva e recupera lo storico dei messaggi in ordine", () => {
    conversationService.saveMessage({ conversationId: convId, role: "user", content: "ciao", queryDate: "2026-08-29" });
    conversationService.saveMessage({ conversationId: convId, role: "assistant", content: "salve" });

    expect(conversationService.getHistory(convId)).toEqual([
      { role: "user", content: "ciao" },
      { role: "assistant", content: "salve" },
    ]);
  });

  test("getConversation restituisce metadati e messaggi", () => {
    const conv = conversationService.getConversation(convId);
    expect(conv).not.toBeNull();
    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[0].queryDate).toBe("2026-08-29");
  });

  test("getConversation restituisce null per un id inesistente", () => {
    expect(conversationService.getConversation("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  test("getHistory restituisce array vuoto per un id inesistente", () => {
    expect(conversationService.getHistory("00000000-0000-4000-8000-000000000000")).toEqual([]);
  });

  test("i dati vengono effettivamente persistiti su file", () => {
    expect(fs.existsSync(tmpFile)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(tmpFile, "utf8"));
    expect(raw.conversations[convId].messages).toHaveLength(2);
  });
});
