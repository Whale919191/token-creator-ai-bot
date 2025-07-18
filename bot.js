const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
require('dotenv').config();

// Inizializza il bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Mini server per Render
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service attivo sulla porta ${PORT}`);
});

// Funzione per generare nome token e ticker casuali
function generaNomeETicker() {
  const nomi = ['Lupo', 'Gatto', 'Banana', 'Rocket', 'Pepe', 'Alieno', 'Sole', 'Luna'];
  const suffissi = ['Coin', 'Token', 'Inu', 'AI', 'Swap', 'Chain', 'DEX'];

  const nome = `${nomi[Math.floor(Math.random() * nomi.length)]}${suffissi[Math.floor(Math.random() * suffissi.length)]}`;
  const ticker = nome.slice(0, 4).toUpperCase();
  return { nome, ticker };
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Benvenuto su Token Creator AI!\nUsa /genera per creare un token casuale.");
});

// Comando /genera
bot.onText(/\/genera/, (msg) => {
  const chatId = msg.chat.id;
  const { nome, ticker } = generaNomeETicker();

  bot.sendMessage(chatId, `🪙 Nome: ${nome}\n🔤 Ticker: ${ticker}\n🎨 Sto generando il logo...`);

  const imageUrl = `https://robohash.org/${encodeURIComponent(nome)}.png`;

  bot.sendPhoto(chatId, imageUrl, {
    caption: `✅ Ecco il logo per *${nome}* (${ticker})`,
    parse_mode: 'Markdown'
  });
});
