/**
 * Rotte del dominio "chat": solo definizione di endpoint e collegamento a
 * middleware di validazione + controller. Nessuna logica qui.
 */

const express = require("express");
const chatController = require("../controllers/chat.controller");
const { validateBody, validateParams } = require("../middlewares/validate");
const { chatBodySchema, conversationIdParamSchema } = require("../validators/chat.validators");

const router = express.Router();

router.get("/health", chatController.health);

router.post("/chat", validateBody(chatBodySchema), chatController.postChat);

router.get(
  "/conversations/:id",
  validateParams(conversationIdParamSchema),
  chatController.getConversation
);

module.exports = router;
