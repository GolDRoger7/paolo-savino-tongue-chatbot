/**
 * Validatori delle richieste in ingresso, con zod.
 * Centralizzano le regole di validità: message, date e conversationId.
 */

const { z } = require("zod");

// Data in formato ISO YYYY-MM-DD e realmente esistente.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La data deve essere nel formato YYYY-MM-DD.")
  .refine((s) => !Number.isNaN(Date.parse(s)), "La data indicata non è valida.");

// Corpo della richiesta POST /api/chat
const chatBodySchema = z.object({
  message: z
    .string({ required_error: "Il campo 'message' è obbligatorio." })
    .trim()
    .min(1, "Il messaggio non può essere vuoto.")
    .max(2000, "Il messaggio è troppo lungo (max 2000 caratteri)."),
  date: isoDate.optional(),
  conversationId: z
    .string()
    .uuid("conversationId non è un identificatore valido.")
    .optional(),
});

// Parametro :id di GET /api/conversations/:id
const conversationIdParamSchema = z.object({
  id: z.string().uuid("id non è un identificatore valido."),
});

module.exports = { chatBodySchema, conversationIdParamSchema };
