const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// === CONFIGURA QUI ===
const TOKEN = process.env.BOT_TOKEN; // Token del bot Telegram
const URL = process.env.BASE_URL; // Es: https://token-creator-ai-bot.onrender.com

// === CREA BOT CON WEBHOOK ===
const bot = new TelegramBot(TOKEN, { webHook: { port: 3000 } });
const app = express();

// === WEBHOOK PATH ===
const webhookPath = `/bot${TOKEN}`;

// === AVVIA WEBHOOK ===
bot.setWebHook(`${URL}${webhookPath}`);

// === MIDDLEWARE TELEGRAM ===
app.use(express.json());
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// === COMANDO /start ===
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Ciao! Inviami un'idea o descrizione e ti genererò un token con nome, ticker e logo!");
});

// === COMANDO /genera ===
bot.onText(/\/genera (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const idea = match[1];

  // Genera nome e ticker da prompt (semplificato qui)
  const name = idea.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const tokenName = name.charAt(0).toUpperCase() + name.slice(1) + "AI";
  const ticker = name.toUpperCase().slice(0, 4) || "AIBT";

  bot.sendMessage(chatId, `🧠 Nome: ${tokenName}\n🔤 Ticker: ${ticker}\n🎨 Sto generando il logo...`);

  // Genera logo con Robohash
  const logoUrl = `https://robohash.org/${encodeURIComponent(tokenName)}.png?set=set1`;

  await bot.sendPhoto(chatId, logoUrl, {
    caption: `✅ Ecco il logo per *${tokenName}* (${ticker})`,
    parse_mode: "Markdown",
  });
});

// === AVVIA EXPRESS SERVER ===
app.get("/", (req, res) => res.send("🤖 Bot attivo con Webhook"));
app.listen(3000, () => {
  console.log("Server Express in ascolto sulla porta 3000");
});
