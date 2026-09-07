/**
 * Service: recupero degli articoli da una testata giornalistica (NewsAPI).
 *
 * Usa l'endpoint /v2/everything, che filtra per parole chiave e per data:
 * l'utente sceglie una data e scrive cosa vuole leggere.
 */

const config = require("../config/env");

const NEWS_API_URL = "https://newsapi.org/v2/everything";

/**
 * Recupera gli articoli per una richiesta utente e una data specifica.
 *
 * @param {string} query   Testo/keyword di ricerca (ciò che scrive l'utente).
 * @param {string} [date]  Data in formato YYYY-MM-DD (opzionale).
 * @returns {Promise<Array<{title,description,source,url,publishedAt}>>}
 */
async function fetchArticles(query, date) {
  if (!config.newsApiKey) {
    throw new Error("NEWS_API_KEY non configurata. Aggiungila alle variabili d'ambiente.");
  }

  const params = new URLSearchParams({
    q: query && query.trim() ? query.trim() : "notizie",
    language: config.newsLanguage,
    sortBy: "relevancy",
    pageSize: String(config.newsPageSize),
  });

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    params.set("from", `${date}T00:00:00`);
    params.set("to", `${date}T23:59:59`);
  }

  const response = await fetch(`${NEWS_API_URL}?${params.toString()}`, {
    headers: { "X-Api-Key": config.newsApiKey },
  });

  const data = await response.json();

  if (!response.ok || data.status === "error") {
    const message = data && data.message ? data.message : `HTTP ${response.status}`;
    throw new Error(`Errore dal servizio notizie: ${message}`);
  }

  const articles = Array.isArray(data.articles) ? data.articles : [];

  return articles
    .filter((a) => a && (a.title || a.description))
    .map((a) => ({
      title: a.title || "(senza titolo)",
      description: a.description || a.content || "",
      source: (a.source && a.source.name) || "Fonte sconosciuta",
      url: a.url || "",
      publishedAt: a.publishedAt || "",
    }));
}

/**
 * Trasforma la lista di articoli in un blocco di testo compatto da passare
 * all'LLM all'interno dei marcatori <articoli>...</articoli>.
 */
function articlesToContext(articles) {
  if (!articles.length) {
    return "<articoli>\nNessun articolo disponibile per la richiesta e la data indicate.\n</articoli>";
  }

  const body = articles
    .map((a, i) => {
      const data = a.publishedAt ? a.publishedAt.slice(0, 10) : "data n/d";
      return [
        `Articolo ${i + 1}`,
        `Titolo: ${a.title}`,
        `Testata: ${a.source}`,
        `Data: ${data}`,
        `Descrizione: ${a.description}`,
      ].join("\n");
    })
    .join("\n\n");

  return `<articoli>\n${body}\n</articoli>`;
}

module.exports = { fetchArticles, articlesToContext };
