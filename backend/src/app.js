/**
 * Configurazione dell'app Express: middleware, rotte e gestione errori.
 * Esportata (senza avviare il server) così da poter essere testata con Supertest.
 */

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(cors()); // consente le chiamate dal frontend (GitHub Pages)
app.use(express.json());

app.use(routes);

// Rotta non trovata + gestione centralizzata degli errori (per ultimi).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
