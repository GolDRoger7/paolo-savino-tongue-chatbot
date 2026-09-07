/**
 * Punto di aggregazione delle rotte. Tutto è montato sotto /api.
 */

const express = require("express");
const chatRoutes = require("./chat.routes");

const router = express.Router();

router.use("/api", chatRoutes);

module.exports = router;
