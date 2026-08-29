# Tongue · Chatbot AI per le notizie

Chatbot intelligente che, a partire da una **data** e da una **richiesta in
linguaggio naturale**, recupera gli articoli di attualità da una testata
giornalistica e ne restituisce una **sintesi** generata da un LLM (OpenAI · gpt-4o-mini).

Progetto realizzato per il brief del cliente **Tongue**.

---

## 🏗️ Architettura

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────────┐
│   FRONTEND (Vue 3)      │  ───────────────────────▶ │   BACKEND (Node.js/Express)  │
│   GitHub Pages          │   POST /api/chat          │   Render                     │
│                         │   { message, date, ... }  │                              │
│  • single input-box     │ ◀───────────────────────  │  1) NewsAPI  → articoli      │
│  • date picker          │   { reply, articles }     │  2) OpenAI   → sintesi       │
│  • rende il risultato   │                           │  3) SQLite   → persistenza   │
└─────────────────────────┘                           └──────────────────────────────┘
```

- **Front end** — Vue 3 (via CDN, senza build step) con un unico box di input
  (textarea) + selettore data + bottone. Renderizza a schermo la sintesi e le
  fonti. Cartella [`docs/`](docs/) (nome scelto perché GitHub Pages può servire
  direttamente la cartella `/docs`).
- **Back end** — Node.js + Express con un endpoint principale `POST /api/chat`.
  Recupera gli articoli, chiama l'LLM e persiste la conversazione. Cartella
  [`backend/`](backend/).
- **Modello AI** — OpenAI (**gpt-4o-mini**), con un **system prompt** dedicato da
  news analyst (vedi [`backend/systemPrompt.js`](backend/systemPrompt.js)).
- **Fonte notizie** — [NewsAPI.org](https://newsapi.org) (endpoint
  `/v2/everything`, con filtro per keyword e per data).
- **Persistenza** — SQLite (file locale) con tabelle `conversations` e
  `messages`.

---

## 🤔 Perché queste scelte

| Ambito | Scelta | Motivo |
|---|---|---|
| Front end | **Vue 3 via CDN** | Nessun build step: si carica e si pubblica su GitHub Pages con un semplice upload di file statici. Framework moderno, reattivo, ideale per il pattern "single input-box". |
| Back end | **Node.js + Express** | Stack leggero e diffusissimo per esporre un'API JSON; ottima integrazione con l'SDK ufficiale di OpenAI. |
| LLM | **OpenAI · gpt-4o-mini** | SDK ufficiale, ottimo rapporto qualità/prezzo, risposte in italiano, controllo fine tramite system prompt. Il modello è configurabile via `OPENAI_MODEL`. |
| Notizie | **NewsAPI** | API gratuita con filtro per **data** e per keyword: combacia perfettamente con "l'utente seleziona una data e scrive cosa vuole leggere". |
| Persistenza | **SQLite** | Database reale, zero configurazione, un solo file. Dimostra la persistenza dei dati conversazionali senza dipendenze esterne. |
| Deploy | **GitHub Pages + Render** | Entrambi gratuiti. GitHub Pages ospita il front end statico; Render esegue il back end Node (GitHub Pages **non** può eseguire codice server). |

> ⚠️ **Nota importante sull'architettura del deploy.** GitHub Pages serve solo
> file **statici**: può ospitare il front end ma **non** un backend Node.
> Per questo il backend viene pubblicato su **Render** (gratuito). Il front end
> su GitHub Pages chiama il backend su Render. Tutti i passaggi sono spiegati in
> [`ISTRUZIONI.md`](ISTRUZIONI.md).

---

## 📁 Struttura del progetto

```
Tongue-News-Chatbot/
├── README.md              ← questo file
├── ISTRUZIONI.md          ← guida passo-passo al deploy (GitHub + Render + Pages)
├── docs/                  ← FRONT END (pubblicato su GitHub Pages)
│   ├── index.html
│   ├── app.js             ← qui va incollato l'URL del backend (BACKEND_URL)
│   └── styles.css
└── backend/               ← BACK END (pubblicato su Render)
    ├── server.js          ← Express + endpoint /api/chat
    ├── newsClient.js      ← chiamata a NewsAPI
    ├── llm.js             ← integrazione con OpenAI (gpt-4o-mini)
    ├── systemPrompt.js    ← system prompt dell'LLM
    ├── db.js              ← persistenza SQLite
    ├── package.json
    ├── render.yaml        ← config opzionale per Render
    └── .env.example       ← variabili d'ambiente da compilare
```

---

## 🔌 API del backend

### `POST /api/chat`
Corpo richiesta:
```json
{ "message": "notizie di economia", "date": "2026-08-29", "conversationId": "opzionale" }
```
Risposta:
```json
{
  "conversationId": "…",
  "reply": "…testo della sintesi…",
  "articlesCount": 12,
  "articles": [ { "title": "…", "source": "…", "url": "…" } ]
}
```

### `GET /api/conversations/:id`
Restituisce l'intera conversazione salvata (dimostra la persistenza).

### `GET /api/health`
Stato del servizio e modello in uso.

---

## 💻 Avvio in locale (facoltativo, per test)

```bash
cd backend
npm install
cp .env.example .env      # poi compila OPENAI_API_KEY e NEWS_API_KEY
npm start                 # backend su http://localhost:3000
```
Poi apri `docs/index.html` con un piccolo server statico (es. `npx serve docs`)
e assicurati che in `docs/app.js` la costante `BACKEND_URL` sia
`http://localhost:3000`.

---

## 🚀 Deploy

Vedi la guida completa passo-passo in **[ISTRUZIONI.md](ISTRUZIONI.md)**.
