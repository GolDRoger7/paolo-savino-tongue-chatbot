const BACKEND_URL = "https://tongue-chatbot.onrender.com";

// Tongue – Frontend in Vue 3 (caricato da CDN, senza build step).

const { createApp } = Vue;

createApp({
  data() {
    return {
      // Data di default: oggi (formato YYYY-MM-DD per l'input date).
      date: new Date().toISOString().slice(0, 10),
      message: "",
      reply: "",
      articles: [],
      articlesCount: 0,
      loading: false,
      error: "",
      // Id conversazione: riutilizzato tra i messaggi e salvato nel browser
      // per mantenere il filo della chat (persistenza lato server).
      conversationId: localStorage.getItem("tongue_conversation_id") || "",
    };
  },

  computed: {
    // Data massima selezionabile: oggi (non esistono notizie dal futuro).
    maxDate() {
      return new Date().toISOString().slice(0, 10);
    },
    // Trasforma il testo di risposta in paragrafi per la resa a schermo.
    replyParagraphs() {
      return this.reply
        .split(/\n{2,}|\n/)
        .map((p) => p.trim())
        .filter(Boolean);
    },
  },

  methods: {
    async invia() {
      const testo = this.message.trim();
      if (!testo) {
        this.error = "Scrivi cosa vuoi sapere prima di inviare.";
        return;
      }

      this.loading = true;
      this.error = "";
      this.reply = "";
      this.articles = [];
      this.articlesCount = 0;

      try {
        const res = await fetch(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: testo,
            date: this.date,
            conversationId: this.conversationId || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Errore ${res.status}`);
        }

        this.reply = data.reply;
        this.articles = data.articles || [];
        this.articlesCount = data.articlesCount || 0;

        // Salva/aggiorna l'id conversazione per i turni successivi.
        if (data.conversationId) {
          this.conversationId = data.conversationId;
          localStorage.setItem("tongue_conversation_id", data.conversationId);
        }
      } catch (err) {
        this.error =
          "Impossibile contattare il servizio. " +
          (err.message || "") +
          " (Verifica che il backend sia attivo e che BACKEND_URL sia corretto.)";
      } finally {
        this.loading = false;
      }
    },

    // Avvia una nuova conversazione (dimentica lo storico lato client).
    nuovaChat() {
      this.conversationId = "";
      localStorage.removeItem("tongue_conversation_id");
      this.reply = "";
      this.articles = [];
      this.articlesCount = 0;
      this.message = "";
      this.error = "";
    },
  },
}).mount("#app");
