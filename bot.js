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
const WEBHOOK_URL = `${baseUrl.trim()}${WEBHOOK_PATH}`;

if (!token || !baseUrl) {
  console.error('❌ TELEGRAM_TOKEN o BASE_URL mancante in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { webHook: true });

bot.setWebHook(WEBHOOK_URL).then(() => {
  console.log(`✅ Webhook impostato su: ${WEBHOOK_URL}`);

  // ✅ Comandi disponibili con "/"
  bot.setMyCommands([
    { command: 'start', description: 'Avvia il bot' },
    { command: 'create', description: 'Genera un token AI' },
    { command: 'launch', description: 'Lancia un token personalizzato' }
  ]);
}).catch((err) => {
  console.error('❌ Errore nel setWebhook:', err);
});

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🔥 Utilità per nome e ticker
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function maybeAddNumber(str) {
  const numbers = ['420', '69', '9000', '1337'];
  return Math.random() < 0.4 ? str + getRandomElement(numbers) : str;
}

function modifyName(original) {
  const suffixes = ['X', 'INU', 'FLOKI', 'AI', 'PUMP', 'MOON'];
  const prefixes = ['SUPER', 'MEGA', 'ULTRA', 'HYPER', 'DOGE', 'BABY', 'SHIBA'];
  let name = original.replace(/\s+/g, '');
  if (Math.random() < 0.5) name = getRandomElement(prefixes) + name;
  if (Math.random() < 0.5) name = name + getRandomElement(suffixes);
  return maybeAddNumber(name);
}

function modifyTicker(original) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ticker = original.slice(0, 3).toUpperCase();
  ticker += letters[Math.floor(Math.random() * letters.length)];
  if (Math.random() < 0.3) ticker += Math.floor(Math.random() * 10);
  return ticker.slice(0, 5);
}

// 🔥 Trending da CoinGecko
async function getTrendingToken() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const json = await res.json();
    if (!json.coins || json.coins.length === 0) return null;
    const random = json.coins[Math.floor(Math.random() * json.coins.length)];
    const name = modifyName(random.item.name);
    const ticker = modifyTicker(random.item.symbol);
    return { name, ticker };
  } catch (err) {
    console.error('❌ Errore fetch trending:', err);
    return null;
  }
}

// 🟢 /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto in Token Creator AI!\n\nUsa:\n/create per token AI\n/launch per token personalizzato');
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

// 🧠 Callback (regenera o conferma)
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

    try {
      await bot.editMessageMedia({ type: 'photo', media: logo }, { chat_id: chatId, message_id: messageId });
      await bot.editMessageCaption(caption, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (err) {
      console.error("❌ Errore nel cambio media/caption:", err.message);
    }
  } else if (query.data.startsWith('confirm|')) {
    const [_, name, ticker] = query.data.split('|');
    await bot.editMessageCaption(`✅ <b>Token confermato!</b>\n\n🏷️ <b>${name}</b>\n💲 <b>${ticker}</b>\n\n🚀 Deploy manuale in arrivo!`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML'
    });
    console.log(`✅ Confermato: ${name} (${ticker})`);
  }

  bot.answerCallbackQuery(query.id);
});

// 🧑‍🚀 /launch: Token personalizzato
const userSession = {};

bot.onText(/\/launch/, async (msg) => {
  const chatId = msg.chat.id;
  userSession[chatId] = {};
  bot.sendMessage(chatId, '📛 Scrivi il nome del token che vuoi creare:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userSession[chatId]) return;

  const step = Object.keys(userSession[chatId]).length;

  if (step === 0 && !text.startsWith('/')) {
    userSession[chatId].name = text;
    return bot.sendMessage(chatId, '💲 Ora scrivi il ticker (max 5 lettere):');
  }

  if (step === 1 && !text.startsWith('/')) {
    userSession[chatId].ticker = text.toUpperCase().slice(0, 5);
    return bot.sendMessage(chatId, '🖼 Vuoi generare un logo o inviarne uno?\nScrivi "genera" oppure invia una immagine:');
  }

  if (step === 2 && text?.toLowerCase() === 'genera') {
    const name = userSession[chatId].name;
    const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;
    userSession[chatId].logo = logo;
    return bot.sendMessage(chatId, '🛰️ Dove vuoi lanciare il token?\nScrivi "pumpfun" o "letsbonk":');
  }

  if (step === 2 && msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const fileUrl = await bot.getFileLink(fileId);
    userSession[chatId].logo = fileUrl;
    return bot.sendMessage(chatId, '🛰️ Dove vuoi lanciare il token?\nScrivi "pumpfun" o "letsbonk":');
  }

  if (step === 3 && text) {
    const platform = text.toLowerCase();
    const { name, ticker, logo } = userSession[chatId];

    let launchUrl = '';
    if (platform === 'pumpfun') {
      launchUrl = `https://pump.fun/launch?name=${encodeURIComponent(name)}&symbol=${encodeURIComponent(ticker)}`;
    } else if (platform === 'letsbonk') {
      launchUrl = `https://letsbonk.io/launch?name=${encodeURIComponent(name)}&symbol=${encodeURIComponent(ticker)}`;
    } else {
      return bot.sendMessage(chatId, '❌ Piattaforma non valida. Scrivi "pumpfun" o "letsbonk"');
    }

    await bot.sendPhoto(chatId, logo, {
      caption: `🚀 Token pronto!\n\n🏷️ <b>${name}</b>\n💲 <b>${ticker}</b>\n\n👉 <a href="${launchUrl}">Lancia su ${platform.toUpperCase()}</a>`,
      parse_mode: 'HTML'
    });

    delete userSession[chatId];
  }
});

// 🚀 Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
