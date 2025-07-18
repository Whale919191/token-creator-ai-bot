import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});

const bot = new TelegramBot(TOKEN, { webHook: { port: PORT } });

// Imposta il webhook
const webhookURL = `${BASE_URL}/bot${TOKEN}`;
bot.setWebHook(webhookURL).then(() => {
  console.log("✅ Webhook impostato su:", webhookURL);
});

// Express per ricevere i messaggi da Telegram
app.use(express.json());
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Log porta
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});

// Risposta al comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Ciao! Sono Token Creator AI. 🚀");
});
