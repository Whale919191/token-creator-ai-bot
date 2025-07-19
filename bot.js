import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { Keypair, Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

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
bot.setWebHook(WEBHOOK_URL);

bot.setMyCommands([
  { command: 'start', description: 'Avvia il bot' },
  { command: 'create', description: 'Genera un nuovo token AI' },
  { command: 'launch', description: 'Lancia un token personalizzato' },
  { command: 'wallet', description: 'Crea o collega un wallet Solana' },
  { command: 'walletbalance', description: 'Mostra il saldo del wallet' }
]);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const userWallets = new Map(); // user_id => publicKey

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
  let ticker = original.slice(0, 3).toUpperCase() + letters[Math.floor(Math.random() * letters.length)];
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

// 🟢 /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto in Token Creator AI!\n\nUsa /create per generare un token AI oppure /launch per creare il tuo token personalizzato!\n\nPuoi anche usare /wallet per generare o collegare un wallet Solana.');
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

// 🔁 Callback query
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
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

    await bot.editMessageMedia({ type: 'photo', media: logo }, { chat_id: chatId, message_id: messageId });
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } else if (query.data.startsWith('confirm|')) {
    const [_, name, ticker] = query.data.split('|');
    await bot.editMessageCaption(`✅ <b>Token confermato!</b>\n\n🏷️ <b>${name}</b>\n💲 <b>${ticker}</b>\n\n🚀 A breve sarà deployato!`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML'
    });
  } else if (query.data === 'generate_wallet') {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toBase58();
    const privateKey = bs58.encode(wallet.secretKey);

    userWallets.set(userId, publicKey);

    await bot.sendMessage(chatId, `🧬 <b>Wallet generato</b>\n\n📬 <b>Public Key:</b> <code>${publicKey}</code>\n🔐 <b>Private Key:</b> <code>${privateKey}</code>\n\n⚠️ Salva queste informazioni!`, {
      parse_mode: 'HTML'
    });
  } else if (query.data === 'link_wallet') {
    await bot.sendMessage(chatId, '🔗 Inviami ora il tuo indirizzo wallet Solana (public key):');
    bot.once('message', async (msg2) => {
      const input = msg2.text.trim();
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
        userWallets.set(userId, input);
        await bot.sendMessage(chatId, `✅ Wallet collegato con successo:\n\n<code>${input}</code>`, { parse_mode: 'HTML' });
      } else {
        await bot.sendMessage(chatId, '❌ Indirizzo non valido. Riprova.');
      }
    });
  }

  bot.answerCallbackQuery(query.id);
});

// 🚀 /launch
bot.onText(/\/launch/, async (msg) => {
  const chatId = msg.chat.id;
  const launchUrl = `${baseUrl}/launch?chat_id=${chatId}`;

  bot.sendMessage(chatId, '🚀 <b>Token Personalizzato</b>\n\nPremi il bottone qui sotto per configurare e lanciare il tuo token:', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Crea ora', url: launchUrl }]
      ]
    }
  });
});

// 🌐 Pagina web /launch
app.get('/launch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/launch.html'));
});

// 🔐 /wallet
bot.onText(/\/wallet/, (msg) => {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🧬 Genera nuovo wallet', callback_data: 'generate_wallet' },
        { text: '🔗 Collega wallet esistente', callback_data: 'link_wallet' }
      ]
    ]
  };

  bot.sendMessage(msg.chat.id, '🔐 <b>Gestione Wallet</b>\n\nScegli un\'opzione:', {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
});

// 💰 /walletbalance
bot.onText(/\/walletbalance/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const publicKeyStr = userWallets.get(userId);
  if (!publicKeyStr) {
    return bot.sendMessage(chatId, '❌ Nessun wallet collegato. Usa /wallet per collegarne uno.');
  }

  try {
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const balanceLamports = await connection.getBalance(new PublicKey(publicKeyStr));
    const sol = balanceLamports / 1e9;

    bot.sendMessage(chatId, `💰 <b>Saldo attuale</b>\n\n📬 <code>${publicKeyStr}</code>\n💸 <b>${sol.toFixed(4)} SOL</b>`, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('❌ Errore recupero balance:', err);
    bot.sendMessage(chatId, '❌ Errore durante il recupero del saldo.');
  }
});

// ✅ Ping
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});

// Avvio server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
