require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();

const TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

// Inizializza il bot senza server integrato
const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${BASE_URL}/bot${TOKEN}`)
  .then(() => console.log('✅ Webhook impostato correttamente!'))
 .catch((error) => {
  if (error.response && error.response.body) {
    console.error('❌ Telegram error:', error.response.body);
  } else {
    console.error('❌ Errore generico:', error);
  }
});
// Webhook Express
app.use(express.json());
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto! Sono Token Creator AI.');
});

// Server Express
app.listen(PORT, () => {
  console.log(`🚀 Server Express attivo sulla porta ${PORT}`);
});
