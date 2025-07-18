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

const bot = new TelegramBot(token, { webHook: true });

bot.setWebHook(WEBHOOK_URL).then(() => {
  console.log(`✅ Webhook impostato su: ${WEBHOOK_URL}`);
}).catch((err) => {
  console.error('❌ Errore nel setWebhook:', err);
});

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🔥 Funzione per nome/ticker trending da CoinGecko
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
    console.error('❌ Errore fetch trending:', err);
    return null;
  }
}

// 🟢 /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto in Token Creator AI!\nUsa /create per generare un nuovo token!');
});

// 🪙 /create
bot.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;
  const tokenData = await getTrendingToken();

  const name = tokenData?.name || 'Meme Token';
  const ticker = tokenData?.ticker || 'MEME';
  const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;

  const caption = `🎉 <b>Token generato</b>\n\n🏷️ Nome: <b>${name}</b>\n💲 Ticker: <b>${ticker}</b>\n\nVuoi confermare o rigenerare?`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔁 Rigenera', callback_data: 'regenerate' },
        { text: '✅ Conferma', callback_data: `confirm|${name}|${ticker}` }
      ]
    ]
  };

  await bot.sendPhoto(chatId, logo, {
    caption,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
});

// 🧠 Gestione callback query
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  if (query.data === 'regenerate') {
    const tokenData = await getTrendingToken();
    const name = tokenData?.name || 'Meme Token';
    const ticker = tokenData?.ticker || 'MEME';
    const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;

    const caption = `🎉 <b>Token rigenerato</b>\n\n🏷️ Nome: <b>${name}</b>\n💲 Ticker: <b>${ticker}</b>\n\nVuoi confermare o rigenerare?`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔁 Rigenera', callback_data: 'regenerate' },
          { text: '✅ Conferma', callback_data: `confirm|${name}|${ticker}` }
        ]
      ]
    };

    await bot.editMessageMedia({
      type: 'photo',
      media: logo,
      caption,
      parse_mode: 'HTML'
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard
    });

  } else if (query.data.startsWith('confirm|')) {
    const [_, name, ticker] = query.data.split('|');

    await bot.editMessageCaption(`✅ <b>Token confermato!</b>\n\n🏷️ Nome: <b>${name}</b>\n💲 Ticker: <b>${ticker}</b>\n\n🚀 A breve sarà deployato!`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML'
    });

    console.log(`✅ Confermato: ${name} (${ticker})`);
    // 👉 Qui in futuro: avvia deploy automatico
  }

  // Rimuove spinner di caricamento
  bot.answerCallbackQuery(query.id);
});

// 🚀 Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
