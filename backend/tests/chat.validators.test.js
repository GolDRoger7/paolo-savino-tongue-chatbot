/**
 * Test unitari dei validatori zod.
 */

const { chatBodySchema, conversationIdParamSchema } = require("../src/validators/chat.validators");

const VALID_UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("chatBodySchema", () => {
  test("accetta un body valido con solo message", () => {
    const result = chatBodySchema.safeParse({ message: "notizie di economia" });
    expect(result.success).toBe(true);
  });

  test("accetta message + date + conversationId validi", () => {
    const result = chatBodySchema.safeParse({
      message: "cronaca",
      date: "2026-08-29",
      conversationId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  test("rifiuta message vuoto o composto da soli spazi", () => {
    expect(chatBodySchema.safeParse({ message: "   " }).success).toBe(false);
  });

  test("rifiuta message mancante", () => {
    expect(chatBodySchema.safeParse({}).success).toBe(false);
  });

  test("rifiuta una data in formato errato", () => {
    expect(chatBodySchema.safeParse({ message: "x", date: "29-08-2026" }).success).toBe(false);
  });

  test("rifiuta una data inesistente", () => {
    expect(chatBodySchema.safeParse({ message: "x", date: "2026-13-40" }).success).toBe(false);
  });

  test("rifiuta un conversationId non UUID", () => {
    expect(chatBodySchema.safeParse({ message: "x", conversationId: "abc" }).success).toBe(false);
  });
});

describe("conversationIdParamSchema", () => {
  test("accetta un UUID valido", () => {
    expect(conversationIdParamSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  test("rifiuta un id non valido", () => {
    expect(conversationIdParamSchema.safeParse({ id: "123" }).success).toBe(false);
  });
});
