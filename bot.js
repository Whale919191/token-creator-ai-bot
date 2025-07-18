import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

const app = express();

// ✅ Variabili d'ambiente
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_TOKEN;
const BASE_URL = process.env.BASE_URL;

// ✅ Istanzia il bot
const bot = new TelegramBot(TOKEN);

(async () => {
  try {
    await bot.deleteWebHook(); // 💣 Elimina vecchio webhook
    const success = await bot.setWebHook(`${BASE_URL}/webhook/${TOKEN}`);
    console.log("✅ Webhook impostato:", success);
  } catch (err) {
    console.error("❌ Errore nel setWebhook:", err);
  }
})();

// ✅ Middleware per JSON
app.use(express.json());

// ✅ Endpoint per ricevere gli update da Telegram
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto su Token Creator AI!');
});

// ✅ Avvia il server Express
app.listen(PORT, () => {
  console.log(`🚀 Server Express attivo sulla porta ${PORT}`);
});
