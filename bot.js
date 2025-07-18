import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;
const baseUrl = process.env.BASE_URL;
const bot = new TelegramBot(token, { webHook: { port: false } });

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = `${baseUrl}/bot${token}`;

// Imposta webhook
bot.setWebHook(WEBHOOK_URL);

// Endpoint per ricevere aggiornamenti Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '✅ Bot attivo e funzionante!');
});

// Avvia server Express
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
