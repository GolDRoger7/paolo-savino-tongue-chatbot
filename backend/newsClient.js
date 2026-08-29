/**
 * Client per il recupero degli articoli da una testata giornalistica.
 *
 * Usa NewsAPI.org (https://newsapi.org) tramite l'endpoint /v2/everything,
 * che permette di filtrare per parole chiave e per intervallo di date:
 * esattamente ciò che serve al chatbot Tongue (l'utente sceglie una data
 * e scrive cosa vuole leggere).
 *
 * NOTA sul piano gratuito di NewsAPI:
 *  - le richieste lato server (come questa) sono consentite;
 *  - gli articoli disponibili risalgono al massimo all'ultimo mese;
 *  - limite di ~100 richieste al giorno.
 */

const NEWS_API_URL = "https://newsapi.org/v2/everything";

/**
 * Recupera gli articoli per una richiesta utente e una data specifica.
 *
 * @param {string} query   Testo/keyword di ricerca (ciò che scrive l'utente).
 * @param {string} date    Data in formato YYYY-MM-DD.
 * @returns {Promise<Array<{title,description,source,url,publishedAt}>>}
 */
async function fetchArticles(query, date) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NEWS_API_KEY non configurata. Aggiungila alle variabili d'ambiente."
    );
  }

  const language = process.env.NEWS_LANGUAGE || "it";
  const pageSize = Number(process.env.NEWS_PAGE_SIZE || 20);

  // Costruisce la query verso NewsAPI.
  const params = new URLSearchParams({
    q: query && query.trim() ? query.trim() : "notizie",
    language,
    sortBy: "relevancy",
    pageSize: String(pageSize),
  });

  // Se è stata indicata una data valida, filtra l'intera giornata.
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    params.set("from", `${date}T00:00:00`);
    params.set("to", `${date}T23:59:59`);
  }

  const url = `${NEWS_API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
  });

  const data = await response.json();

  if (!response.ok || data.status === "error") {
    const message = data && data.message ? data.message : `HTTP ${response.status}`;
    throw new Error(`Errore dal servizio notizie: ${message}`);
  }

  const articles = Array.isArray(data.articles) ? data.articles : [];

  // Normalizza gli articoli tenendo solo i campi che servono all'LLM.
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
