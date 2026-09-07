/**
 * Entry point del backend Tongue.
 * Avvia il server HTTP; tutta la configurazione dell'app sta in src/app.js.
 */

const app = require("./src/app");
const config = require("./src/config/env");

app.listen(config.port, () => {
  console.log(
    `Tongue backend in ascolto sulla porta ${config.port} (modello: ${config.openaiModel})`
  );
});
