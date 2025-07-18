require('dotenv').config();
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN;
const URL = process.env.BASE_URL;

const bot = new TelegramBot(TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

bot.setWebHook(`${URL}/bot${TOKEN}`);

// Middleware
app.use(express.json());

// Endpoint per Telegram webhook
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Root per ping
app.get('/', (req, res) => {
  res.send('Token Creator AI bot is live');
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Benvenuto su Token Creator AI! Scrivi /generate per creare un meme token.');
});

// /generate
bot.onText(/\/generate/, async (msg) => {
  const chatId = msg.chat.id;

  const adjectives = ['Crazy', 'Happy', 'Funky', 'Wild', 'Lucky', 'Angry'];
  const animals = ['Shark', 'Pepe', 'Cat', 'Doge', 'Ape', 'Frog'];

  const name = adjectives[Math.floor(Math.random() * adjectives.length)] + animals[Math.floor(Math.random() * animals.length)];
  const ticker = name.slice(0, 4).toUpperCase();
  const logoUrl = `https://robohash.org/${encodeURIComponent(name)}.png?set=set2`;

  bot.sendPhoto(chatId, logoUrl, {
    caption: `✅ Nome: ${name}\n✅ Ticker: $${ticker}`
  });
});
