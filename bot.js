import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;
const baseUrl = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = `/bot${token}`;
const WEBHOOK_URL = `${baseUrl}${WEBHOOK_PATH}`;

if (!token || !baseUrl) {
  console.error('❌ TELEGRAM_TOKEN o BASE_URL mancante in .env');
  process.exit(1);
}

console.log('✅ Token e Base URL caricati correttamente');

const bot = new TelegramBot(token, { webHook: true });

// Imposta webhook
bot.setWebHook(WEBHOOK_URL).then(() => {
  console.log(`✅ Webhook impostato su: ${WEBHOOK_URL}`);
}).catch((err) => {
  console.error('❌ Errore nel setWebhook:', err);
});

// Endpoint per ricevere aggiornamenti da Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Funzione per ottenere un nome/ticker trending da CoinGecko
async function getTrendingToken() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const json = await res.json();
    if (!json.coins || json.coins.length === 0) return null;

    const random = json.coins[Math.floor(Math.random() * json.coins.length)];
    return {
      name: random.item.name,
      ticker: random.item.symbol.toUpperCase()
    };
  } catch (err) {
    console.error('❌ Errore durante il fetch trending:', err);
    return null;
  }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  console.log(`📩 Ricevuto /start da ${msg.chat.id}`);
  bot.sendMessage(msg.chat.id, '👋 Benvenuto in Token Creator AI!\nUsa /create per generare un nuovo token!');
});

// Comando /create
bot.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;

  const trending = await getTrendingToken();
  let tokenName = trending?.name || "Meme Token";
  let tokenTicker = trending?.ticker || "MEME";

  const logoUrl = `https://robohash.org/${tokenName}.png?size=200x200&set=set5`;

  const caption = `🎉 <b>Token generato</b>\n\n🏷️ Nome: <b>${tokenName}</b>\n💲 Ticker: <b>${tokenTicker}</b>`;

  await bot.sendPhoto(chatId, logoUrl, {
    caption,
    parse_mode: 'HTML'
  });

  console.log(`✅ Token generato per ${chatId}: ${tokenName} (${tokenTicker})`);
});

// Avvia Express
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
