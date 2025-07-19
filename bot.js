import import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import multer from 'multer';
import fs from 'fs';
import FormData from 'form-data';

dotenv.config();

const app = express();
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

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

  // Imposta i comandi / disponibili
  bot.setMyCommands([
    { command: 'start', description: 'Avvia il bot' },
    { command: 'create', description: 'Genera un nuovo token AI' },
    { command: 'launch', description: 'Crea un token personalizzato' }
  ]);
}).catch((err) => {
  console.error('❌ Errore nel setWebhook:', err);
});

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🔥 Funzioni utili
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
  if (Math.random() < 0.5) name += getRandomElement(suffixes);
  return maybeAddNumber(name);
}

function modifyTicker(original) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ticker = original.slice(0, 3).toUpperCase();
  ticker += letters[Math.floor(Math.random() * letters.length)];
  if (Math.random() < 0.3) ticker += Math.floor(Math.random() * 10);
  return ticker.slice(0, 5);
}

async function getTrendingToken() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const json = await res.json();
    if (!json.coins || json.coins.length === 0) return null;
    const random = json.coins[Math.floor(Math.random() * json.coins.length)];
    return {
      name: modifyName(random.item.name),
      ticker: modifyTicker(random.item.symbol)
    };
  } catch (err) {
    console.error('❌ Errore fetch trending:', err);
    return null;
  }
}

// ✅ Memoria temporanea utenti
const userState = {};

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto in Token Creator AI!\nUsa /create per generare un token AI o /launch per crearne uno personalizzato.');
});

// /create
bot.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;
  const tokenData = await getTrendingToken();
  const name = tokenData?.name || 'Meme Token';
  const ticker = tokenData?.ticker || 'MEME';
  const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;

  const caption = `🎉 <b>Token generato</b>\n\n🏷️ Nome: <b>${name}</b>\n💲 Ticker: <b>${ticker}</b>\n\nVuoi confermare o rigenerare?`;
  const keyboard = {
    inline_keyboard: [
      [{ text: '🔁 Rigenera', callback_data: 'regenerate' }, { text: '✅ Conferma', callback_data: `confirm|${name}|${ticker}` }]
    ]
  };

  await bot.sendPhoto(chatId, logo, {
    caption,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
});

// /launch
bot.onText(/\/launch/, async (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'awaiting_name' };
  bot.sendMessage(chatId, '📝 Invia il nome del tuo token personalizzato:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const state = userState[chatId];

  if (!state || !msg.text || msg.text.startsWith('/')) return;

  if (state.step === 'awaiting_name') {
    state.name = msg.text;
    state.step = 'awaiting_ticker';
    return bot.sendMessage(chatId, '🔤 Ora invia il ticker (sigla breve):');
  }

  if (state.step === 'awaiting_ticker') {
    state.ticker = msg.text.slice(0, 5).toUpperCase();
    state.step = 'awaiting_logo_choice';
    return bot.sendMessage(chatId, '🎨 Vuoi generare un logo AI o caricarne uno?\n\nScrivi "genera" o "carica":');
  }

  if (state.step === 'awaiting_logo_choice') {
    const choice = msg.text.toLowerCase();
    if (choice === 'genera') {
      state.logo = `https://robohash.org/${state.name}.png?size=200x200&set=set5`;
      state.step = 'awaiting_platform';
      return bot.sendMessage(chatId, '🧠 Generato! Ora scegli dove lanciare:\n- pump\n- bonk');
    } else if (choice === 'carica') {
      state.step = 'awaiting_logo_upload';
      return bot.sendMessage(chatId, '📤 Invia ora l\'immagine del logo come file o immagine.');
    } else {
      return bot.sendMessage(chatId, '❌ Risposta non valida. Scrivi "genera" o "carica".');
    }
  }

  if (state.step === 'awaiting_platform') {
    const platform = msg.text.toLowerCase();
    if (platform !== 'pump' && platform !== 'bonk') {
      return bot.sendMessage(chatId, '❌ Scrivi "pump" o "bonk" per scegliere la piattaforma.');
    }

    if (platform === 'pump') {
      bot.sendMessage(chatId, '🚀 Deploy su Pump.fun in corso...');

      try {
        const form = new FormData();
        form.append('name', state.name);
        form.append('symbol', state.ticker);
        form.append('image', state.logo);

        const res = await fetch('https://api.pump.fun/api/deploy', {
          method: 'POST',
          headers: {
            'accept': 'application/json'
          },
          body: form
        });

        const json = await res.json();
        if (json?.transaction_url) {
          bot.sendMessage(chatId, `✅ Token lanciato con successo!\n\n🔗 ${json.transaction_url}`);
        } else {
          bot.sendMessage(chatId, '❌ Errore durante il deploy su Pump.fun.');
        }
      } catch (err) {
        console.error('❌ Errore pump.fun:', err);
        bot.sendMessage(chatId, '❌ Errore interno durante il deploy.');
      }
    } else {
      bot.sendMessage(chatId, '⚠️ Deploy su LetsBonk non ancora disponibile. In arrivo!');
    }

    delete userState[chatId];
  }
});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state = userState[chatId];
  if (!state || state.step !== 'awaiting_logo_upload') return;

  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  state.logo = fileUrl;
  state.step = 'awaiting_platform';
  bot.sendMessage(chatId, '✅ Logo caricato!\nOra scegli dove lanciare:\n- pump\n- bonk');
});

// 🔁 Callback rigenera/conferma da /create
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
        [{ text: '🔁 Rigenera', callback_data: 'regenerate' }, { text: '✅ Conferma', callback_data: `confirm|${name}|${ticker}` }]
      ]
    };

    await bot.editMessageMedia({
      type: 'photo',
      media: logo
    }, { chat_id: chatId, message_id: messageId });

    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
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
  }

  bot.answerCallbackQuery(query.id);
});

// 🚀 Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
});
