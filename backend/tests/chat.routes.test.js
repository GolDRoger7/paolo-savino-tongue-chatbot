/**
 * Test di integrazione delle rotte con Supertest.
 * I service esterni (notizie, LLM) sono mockati: i test non chiamano API reali.
 */

const os = require("os");
const path = require("path");

// Config isolata PRIMA di caricare l'app.
process.env.DB_PATH = path.join(os.tmpdir(), `tongue-routes-${Date.now()}.json`);
process.env.OPENAI_API_KEY = "sk-test";
process.env.NEWS_API_KEY = "test";

jest.mock("../src/services/news.service");
jest.mock("../src/services/llm.service");

const request = require("supertest");
const newsService = require("../src/services/news.service");
const llmService = require("../src/services/llm.service");
const app = require("../src/app");

const VALID_UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/health", () => {
  test("ritorna status ok e il modello", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.model).toBeDefined();
  });
});

describe("POST /api/chat — validazione", () => {
  test("400 se manca message", async () => {
    const res = await request(app).post("/api/chat").send({});
    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  test("400 se date ha formato errato", async () => {
    const res = await request(app).post("/api/chat").send({ message: "ciao", date: "2026/08/29" });
    expect(res.status).toBe(400);
  });

  test("400 se conversationId non è un UUID", async () => {
    const res = await request(app).post("/api/chat").send({ message: "ciao", conversationId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/chat — comportamento", () => {
  test("200 e sintesi quando ci sono articoli", async () => {
    newsService.fetchArticles.mockResolvedValue([
      { title: "Titolo", description: "Descrizione", source: "Fonte", url: "https://x", publishedAt: "2026-08-29" },
    ]);
    llmService.generateSummary.mockResolvedValue("Sintesi di prova.");

    const res = await request(app).post("/api/chat").send({ message: "economia", date: "2026-08-29" });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("Sintesi di prova.");
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.conversationId).toBeDefined();
    expect(llmService.generateSummary).toHaveBeenCalledTimes(1);
  });

  test("200 con messaggio dedicato e nessuna chiamata all'LLM se non ci sono articoli", async () => {
    newsService.fetchArticles.mockResolvedValue([]);

    const res = await request(app).post("/api/chat").send({ message: "tema di nicchia", date: "2026-08-29" });

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(0);
    expect(llmService.generateSummary).not.toHaveBeenCalled();
  });

  test("500 se il servizio notizie lancia un errore", async () => {
    newsService.fetchArticles.mockRejectedValue(new Error("Errore dal servizio notizie: quota superata"));

    const res = await request(app).post("/api/chat").send({ message: "x", date: "2026-08-29" });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Errore dal servizio notizie");
  });
});

describe("GET /api/conversations/:id", () => {
  test("400 per un id non valido", async () => {
    const res = await request(app).get("/api/conversations/not-uuid");
    expect(res.status).toBe(400);
  });

  test("404 per un UUID valido ma inesistente", async () => {
    const res = await request(app).get(`/api/conversations/${VALID_UUID}`);
    expect(res.status).toBe(404);
  });
});
