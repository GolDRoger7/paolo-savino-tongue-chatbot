/**
 * Gestione centralizzata degli errori e delle rotte non trovate.
 */

function notFound(req, res) {
  res.status(404).json({ error: "Risorsa non trovata." });
}

// La firma a 4 argomenti è necessaria affinché Express lo riconosca come
// error handler.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("Errore:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Errore interno del server.",
  });
}

module.exports = { notFound, errorHandler };
