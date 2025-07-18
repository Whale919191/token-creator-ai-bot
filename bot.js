import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';     // ✅ AGGIUNGI QUESTA RIGA
dotenv.config();                 // ✅ E QUESTA

const app = express();

// ✅ Variabili d'ambiente
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_TOKEN;
const BASE_URL = process.env.BASE_URL;

// ✅ Istanzia il bot
const bot = new TelegramBot(TOKEN);

// ✅ Imposta il webhook
(async () => {
  try {
    await bot.deleteWebHook();
    const url = `${BASE_URL}/webhook/${TOKEN}`;
    const success = await bot.setWebHook(url);
    console.log('✅ Webhook impostato:', success);
  } catch (err) {
    console.error('❌ Errore nel setWebhook:', err);
  }
})();

// ✅ Middleware per JSON
app.use(express.json());

// ✅ Endpoint per ricevere update da Telegram
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
