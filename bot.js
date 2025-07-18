require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();

// === Variabili d'ambiente ===
const TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

// === Inizializza il bot con webhook ===
const bot = new TelegramBot(TOKEN, { webHook: { port: PORT } });
bot.setWebHook(`${BASE_URL}/bot${TOKEN}`)
  .then(() => console.log('✅ Webhook impostato correttamente!'))
  .catch(err => console.error('❌ Errore nel setWebhook:', err));

// === Middleware Express ===
app.use(express.json());

// === Endpoint webhook ===
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// === /start ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '👋 Benvenuto! Sono Token Creator AI. Inviami un comando per iniziare.');
});

// === Avvia server Express ===
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
