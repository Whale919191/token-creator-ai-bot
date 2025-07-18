const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;
const URL = process.env.BASE_URL;

const bot = new TelegramBot(TOKEN, { webHook: { port: process.env.PORT || 3000 } });
bot.setWebHook(`${URL}/bot${TOKEN}`);

const app = express();
app.use(express.json());

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Benvenuto su Token Creator AI!\nDigita /generate per creare il tuo meme token.');
});

bot.onText(/\/generate/, async (msg) => {
  const chatId = msg.chat.id;

  const tokenName = generateName();
  const ticker = generateTicker();
  const logoUrl = `https://robohash.org/${encodeURIComponent(tokenName)}.png`;

  const caption = `🪙 *Token generato!*\n\n*Nome:* ${tokenName}\n*Ticker:* $${ticker}`;
  await bot.sendPhoto(chatId, logoUrl, {
    caption,
    parse_mode: 'Markdown'
  });
});

// Funzioni generazione nome e ticker
function generateName() {
  const names = ['Inu', 'Pepe', 'Moon', 'Floki', 'Wen', 'Giga', 'Meme', 'Pump', 'Bonk', 'Shiba'];
  const prefixes = ['Mega', 'Ultra', 'Baby', 'Super', 'El', 'Mini', 'Hyper', 'Lord', 'Turbo', 'AI'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${names[Math.floor(Math.random() * names.length)]}`;
}

function generateTicker() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ticker = '';
  for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
    ticker += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return ticker;
}

// Avvio server Express per Render
app.get('/', (req, res) => {
  res.send('Token Creator AI bot is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
