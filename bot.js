import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_TOKEN;
const BASE_URL = process.env.BASE_URL;

const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${BASE_URL}/webhook/${TOKEN}`);

app.use(express.json());

app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto su Token Creator AI!');
});

// ✅ Avvia Express e imposta il webhook
app.listen(PORT, () => {
  console.log(`🚀 Server Express attivo sulla porta ${PORT}`);
});
