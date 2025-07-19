import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { Keypair } from '@solana/web3.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
  bot.setMyCommands([
    { command: 'start', description: 'Avvia il bot' },
    { command: 'create', description: 'Genera un nuovo token AI' },
    { command: 'launch', description: 'Lancia un token personalizzato' },
    { command: 'wallet', description: 'Crea o collega un wallet Solana' }
  ]);
}).catch((err) => {
  console.error('❌ Errore nel setWebhook:', err);
});

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🔧 Utility
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybeAddNumber(str) {
  const nums = ['420', '69', '9000'];
  return Math.random() < 0.4 ? str + getRandomElement(nums) : str;
}

function modifyName(name) {
  const prefixes = ['HYPER', 'DOGE', 'SHIBA', 'BABY'];
  const suffixes = ['X', 'INU', 'AI', 'FLOKI'];
  let newName = name.replace(/\s+/g, '');
  if (Math.random() < 0.5) newName = getRandomElement(prefixes) + newName;
  if (Math.random() < 0.5) newName += getRandomElement(suffixes);
  return maybeAddNumber(newName);
}

function modifyTicker(symbol) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let base = symbol.slice(0, 3).toUpperCase();
  base += getRandomElement(letters);
  if (Math.random() < 0.3) base += Math.floor(Math.random() * 10);
  return base.slice(0, 5);
}

async function getTrendingToken() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const json = await res.json();
    const item = getRandomElement(json.coins).item;
    return {
      name: modifyName(item.name),
      ticker: modifyTicker(item.symbol)
    };
  } catch (err) {
    console.error('❌ Errore fetch trending:', err);
    return null;
  }
}

// 🟢 /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `👾 <b>Token Creator AI</b>\n\nCrea token meme sulla blockchain Solana in pochi tap.\n\nUsa:\n• /create — genera token AI\n• /launch — crea token personalizzato\n• /wallet — collega o genera un wallet`, {
    parse_mode: 'HTML'
  });
});

// 🧠 /create
bot.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;
  const tokenData = await getTrendingToken();
  const name = tokenData?.name || 'MemeToken';
  const ticker = tokenData?.ticker || 'MEME';
  const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;

  const caption = `✨ <b>Token AI Generato</b>\n\n<b>Nome:</b> ${name}\n<b>Ticker:</b> ${ticker}\n\nVuoi modificare o confermare?`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔁 Cambia', callback_data: 'regenerate' },
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

// 🔁 Callback
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  if (query.data === 'regenerate') {
    const tokenData = await getTrendingToken();
    const name = tokenData?.name || 'MemeToken';
    const ticker = tokenData?.ticker || 'MEME';
    const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;

    const caption = `✨ <b>Nuovo Token</b>\n\n<b>Nome:</b> ${name}\n<b>Ticker:</b> ${ticker}\n\nModifica o conferma:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔁 Cambia', callback_data: 'regenerate' },
          { text: '✅ Conferma', callback_data: `confirm|${name}|${ticker}` }
        ]
      ]
    };

    await bot.editMessageMedia({ type: 'photo', media: logo }, { chat_id: chatId, message_id: messageId });
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } else if (query.data.startsWith('confirm|')) {
    const [_, name, ticker] = query.data.split('|');
    await bot.editMessageCaption(`✅ <b>Token Confermato</b>\n\n<b>${name}</b> (${ticker}) pronto al lancio.`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML'
    });
  } else if (query.data === 'generate_wallet') {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toBase58();
    const bs58 = (await import('bs58')).default;
    const privateKey = bs58.encode(wallet.secretKey);

    await bot.sendMessage(chatId, `🔐 <b>Nuovo Wallet</b>\n\n<b>Pubblico:</b>\n<code>${publicKey}</code>\n\n<b>Privato:</b>\n<code>${privateKey}</code>\n\n⚠️ Salva questi dati in un posto sicuro.`, {
      parse_mode: 'HTML'
    });
  } else if (query.data === 'link_wallet') {
    await bot.sendMessage(chatId, '📩 Inviami ora il tuo indirizzo wallet Solana:');
    bot.once('message', async (msg2) => {
      const input = msg2.text.trim();
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
        await bot.sendMessage(chatId, `🔗 Wallet collegato:\n<code>${input}</code>`, { parse_mode: 'HTML' });
      } else {
        await bot.sendMessage(chatId, '❌ Indirizzo non valido. Riprova.');
      }
    });
  }

  bot.answerCallbackQuery(query.id);
});

// 🚀 /launch
bot.onText(/\/launch/, (msg) => {
  const chatId = msg.chat.id;
  const launchUrl = `${baseUrl}/launch?chat_id=${chatId}`;
  bot.sendMessage(chatId, '🚀 <b>Token Personalizzato</b>\n\nCrea il tuo token su misura cliccando qui:', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎨 Lancia Token', url: launchUrl }]
      ]
    }
  });
});

// 🔐 /wallet
bot.onText(/\/wallet/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🧬 Nuovo Wallet', callback_data: 'generate_wallet' },
        { text: '🔗 Collega Wallet', callback_data: 'link_wallet' }
      ]
    ]
  };

  bot.sendMessage(chatId, '🔐 <b>Wallet Solana</b>\n\nScegli un\'opzione:', {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
});

// Web endpoint
app.get('/launch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/launch.html'));
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// Avvio server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
