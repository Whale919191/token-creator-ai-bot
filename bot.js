const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// ✅ Variabili d'ambiente
const TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

// ✅ Inizializza il bot senza polling
const bot = new TelegramBot(TOKEN, { webHook: true });

// ✅ Endpoint webhook
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto su Token Creator AI!');
});

// ✅ Avvia Express e poi imposta il webhook
app.listen(PORT, async () => {
  console.log(`🚀 Server Express attivo sulla porta ${PORT}`);

  try {
    await bot.setWebHook(`${BASE_URL}/webhook/${TOKEN}`, {
      allowed_updates: ['message'],
      drop_pending_updates: true
    });
    console.log('✅ Webhook impostato correttamente!');
  } catch (error) {
    if (error.response && error.response.body) {
      console.error('❌ Telegram error:', error.response.body);
    } else {
      console.error('❌ Errore generico:', error);
    }
  }
});
