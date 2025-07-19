// IMPORTAZIONI
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Keypair, Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
bot.setWebHook(WEBHOOK_URL);

// === WALLET PERSISTENZA ===

const walletFilePath = path.join(__dirname, 'wallet.json');
let walletDB = {};

if (fs.existsSync(walletFilePath)) {
  walletDB = JSON.parse(fs.readFileSync(walletFilePath, 'utf-8'));
}

// Funzioni helper
function saveWallets() {
  fs.writeFileSync(walletFilePath, JSON.stringify(walletDB, null, 2));
}

function getUserWallet(userId) {
  return walletDB[userId];
}

function setUserWallet(userId, publicKey) {
  walletDB[userId] = publicKey;
  saveWallets();
}

function deleteUserWallet(userId) {
  delete walletDB[userId];
  saveWallets();
}

// === COMANDI ===

const OWNER_ID = 2065900708;

bot.setMyCommands([
  { command: 'start', description: 'Avvia il bot' },
  { command: 'create', description: 'Genera un nuovo token AI' },
  { command: 'wallet', description: 'Gestisci il tuo wallet Solana' },
  { command: 'walletbalance', description: 'Mostra il saldo del wallet' }
]);

function isAuthorized(msg) {
  return msg.from.id === OWNER_ID;
}

// ===== TOKEN GENERATION =====

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

// ===== COMANDI TELEGRAM =====

bot.onText(/\/start/, (msg) => {
  if (!isAuthorized(msg)) return;
  bot.sendMessage(msg.chat.id, '👋 Benvenuto in Token Creator AI!\n\nUsa /create per generare un token AI.\nUsa /wallet per gestire il tuo wallet Solana.');
});

bot.onText(/\/create/, async (msg) => {
  if (!isAuthorized(msg)) return;
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

bot.onText(/\/wallet/, (msg) => {
  if (!isAuthorized(msg)) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const wallet = getUserWallet(userId);

  if (wallet) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🗑️ Cancella wallet', callback_data: 'delete_wallet' }]
      ]
    };
    bot.sendMessage(chatId, `🔐 <b>Wallet collegato</b>\n\n📬 <code>${wallet}</code>`, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } else {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🧬 Genera nuovo wallet', callback_data: 'generate_wallet' },
          { text: '🔗 Collega wallet esistente', callback_data: 'link_wallet' }
        ]
      ]
    };
    bot.sendMessage(chatId, '🔐 <b>Nessun wallet collegato</b>\n\nScegli un\'opzione:', {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
});

bot.onText(/\/walletbalance/, async (msg) => {
  if (!isAuthorized(msg)) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const pubKey = getUserWallet(userId);

  if (!pubKey) {
    return bot.sendMessage(chatId, '❌ Nessun wallet collegato. Usa /wallet per iniziare.');
  }

  try {
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const balanceLamports = await connection.getBalance(new PublicKey(pubKey));
    const sol = balanceLamports / 1e9;
    await bot.sendMessage(chatId, `💰 <b>Saldo del wallet</b>\n\n📬 <code>${pubKey}</code>\n💸 <b>${sol.toFixed(4)} SOL</b>`, {
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Errore durante il recupero del saldo.');
  }
});

// === CALLBACK QUERY ===

bot.on('callback_query', async (query) => {
  if (query.from.id !== OWNER_ID) return;
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;

  if (query.data === 'regenerate') {
    const tokenData = await getTrendingToken();
    const name = tokenData?.name || 'Meme Token';
    const ticker = tokenData?.ticker || 'MEME';
    const logo = `https://robohash.org/${name}.png?size=200x200&set=set5`;
    const caption = `🎉 <b>Token rigenerato</b>\n\n🏷️ <b>${name}</b>\n💲 <b>${ticker}</b>\n\nVuoi confermare o rigenerare?`;

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
    setUserWallet(userId, publicKey);
    await bot.sendMessage(chatId, `🧬 <b>Wallet generato</b>\n\n📬 <b>Public Key:</b> <code>${publicKey}</code>\n🔐 <b>Private Key:</b> <code>${privateKey}</code>\n\n⚠️ Salva queste informazioni!`, {
      parse_mode: 'HTML'
    });
  } else if (query.data === 'link_wallet') {
    await bot.sendMessage(chatId, '🔗 Inviami il tuo indirizzo wallet Solana (public key):');
    bot.once('message', async (msg2) => {
      if (!isAuthorized(msg2)) return;
      const input = msg2.text.trim();
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
        setUserWallet(userId, input);
        await bot.sendMessage(chatId, `✅ Wallet collegato:\n\n<code>${input}</code>`, { parse_mode: 'HTML' });
      } else {
        await bot.sendMessage(chatId, '❌ Indirizzo non valido. Riprova.');
      }
    });
  } else if (query.data === 'delete_wallet') {
    deleteUserWallet(userId);
    await bot.sendMessage(chatId, '🗑️ Wallet eliminato con successo. Usa /wallet per crearne uno nuovo.');
  }

  bot.answerCallbackQuery(query.id);
});

// === SERVER ===

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
