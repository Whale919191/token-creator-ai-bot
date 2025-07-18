// 📦 Importa le librerie
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

// 🔐 Variabili ambiente
const TOKEN = process.env.TELEGRAM_TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 3000;

// 🤖 Inizializza il bot in modalità webhook
const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${BASE_URL}/webhook/${TOKEN}`);

// 🚀 Crea server Express
const app = express();
app.use(express.json());

// 🌐 Endpoint per ricevere aggiornamenti da Telegram
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Benvenuto su Token Creator AI!');
});

// 🚀 Avvia Express e imposta il webhook dopo 2s
app.listen(PORT, async () => {
  console.log(`🚀 Server Express attivo sulla porta ${PORT}`);

  setTimeout(async () => {
    try {
      const webhookUrl = `${BASE_URL}/webhook/${TOKEN}`;
      console.log('🌐 Imposto webhook su URL:', webhookUrl);

      await bot.setWebHook(webhookUrl, {
        allowed_updates: ['message'],
        drop_pending_updates: true,
      });

      console.log('✅ Webhook impostato correttamente!');
    } catch (error) {
      if (error.response && error.response.body) {
        console.error('❌ Telegram error:', error.response.body);
      } else {
        console.error('❌ Errore generico:', error);
      }
    }
  }, 2000);
});
