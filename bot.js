const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// ✅ Variabili d'ambiente
const TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

// ✅ Inizializza il bot senza polling
const bot = new TelegramBot(TOKEN);

// ✅ Webhook corretto
bot.setWebHook(`${BASE_URL}/webhook/${TOKEN}`, {
  allowed_updates: ['message'],
  drop_pending_updates: true
});
  .then(() => console.log('✅ Webhook impostato correttamente!'))
  .catch((error) => {
    if (error.response && error.response.body) {
      console.error('❌ Telegram error:', error.response.body);
    } else {
      console.error('❌ Errore generico:', error);
    }
  });

// ✅ Endpoint corretto
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
});

// ✅ Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto su Token Creator AI!');
});

// ✅ Server Express obbligatorio su Render
app.listen(PORT, () => {
  console.log(`🚀 Server Express attivo sulla porta ${PORT}`);
});
