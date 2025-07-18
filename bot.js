import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;
const baseUrl = process.env.BASE_URL?.trim();
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

// Endpoint per ricevere gli aggiornamenti
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Comando /start
bot.onText(/\/start/, (msg) => {
  console.log(`📩 Ricevuto /start da ${msg.chat.id}`);
  bot.sendMessage(msg.chat.id, '✅ Bot attivo e funzionante!');
});
import crypto from 'crypto';

// Funzione per generare nome e ticker random
function generaNomeETicker() {
  const nomi = ['Shiba', 'Pepe', 'Zilla', 'Doge', 'Turbo', 'Fomo', 'Moon', 'Inu', 'Floki', 'Meme'];
  const suffissi = ['Coin', 'Swap', 'AI', 'Bot', 'Chain', 'Fi', 'Dex', 'Pump', 'Launch', 'Token'];

  const nome = nomi[Math.floor(Math.random() * nomi.length)] + suffissi[Math.floor(Math.random() * suffissi.length)];
  const ticker = crypto.randomBytes(2).toString('hex').toUpperCase(); // es: 3A4F → Ticker casuale

  return { nome, ticker };
}

bot.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;

  // Genera nome e ticker
  const { nome, ticker } = generaNomeETicker();

  // Genera URL logo da RoboHash
  const logoUrl = `https://robohash.org/${nome}.png`;

  // Messaggio con anteprima
  const message = `🪙 *Nome:* ${nome}\n🔤 *Ticker:* ${ticker}\n🖼️ *Logo generato:*\n${logoUrl}`;

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Avvia Express
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
