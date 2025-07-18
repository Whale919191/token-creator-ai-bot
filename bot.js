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
  const { nome, ticker } = generaNomeETicker();
  const logoUrl = `https://robohash.org/${nome}.png`;

  const message = `🪙 *Nome:* ${nome}\n🔤 *Ticker:* ${ticker}\n🖼️ *Logo generato:*`;
  
  await bot.sendPhoto(chatId, logoUrl, {
    caption: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔁 Rigenera', callback_data: 'rigenera' },
          { text: '✅ Conferma', callback_data: `conferma_${nome}_${ticker}` }
        ]
      ]
    }
  });
});
// 🔽 Incollalo subito sotto il blocco /create
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'rigenera') {
    const { nome, ticker } = generaNomeETicker();
    const logoUrl = `https://robohash.org/${nome}.png`;
    const message = `🪙 *Nome:* ${nome}\n🔤 *Ticker:* ${ticker}\n🖼️ *Logo generato:*`;

    await bot.sendPhoto(chatId, logoUrl, {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔁 Rigenera', callback_data: 'rigenera' },
            { text: '✅ Conferma', callback_data: `conferma_${nome}_${ticker}` }
          ]
        ]
      }
    });
  }

  if (data.startsWith('conferma_')) {
    const [, nome, ticker] = data.split('_');
    await bot.sendMessage(chatId, `✅ Token confermato:\n*Nome:* ${nome}\n*Ticker:* ${ticker}`, {
      parse_mode: 'Markdown'
    });

    // Qui potrai inserire la logica di deploy automatico su Solana in futuro
  }

  await bot.answerCallbackQuery(query.id);
});

// Avvia Express
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
