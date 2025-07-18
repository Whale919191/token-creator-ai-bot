import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const TOKEN = process.env.TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

// Inizializza Express
const app = express();
app.use(express.json());

// Inizializza il bot con Webhook
const bot = new TelegramBot(TOKEN, {
  webHook: {
    port: PORT,
  },
});

// Imposta il Webhook
const webhookURL = `${BASE_URL}/bot${TOKEN}`;
bot.setWebHook(webhookURL).then(() => {
  console.log("✅ Webhook impostato:", webhookURL);
});

// Endpoint per ricevere i messaggi dal Webhook
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Risposta al comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "👋 Ciao! Benvenuto su Token Creator AI Bot!");
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
