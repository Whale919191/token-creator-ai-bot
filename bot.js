require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!\nScrivimi un’idea per il tuo token meme 🚀');
});

bot.on('text', (ctx) => {
  const idea = ctx.message.text;
  ctx.reply(`💡 Bella idea! Genero nome e ticker per:\n"${idea}"...`);
});

bot.launch();
console.log("🤖 Bot attivo!");
const TelegramBot = require('node-telegram-bot-api');

// Carica token dal file .env o variabili ambiente
require('dotenv').config();
const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

// Comandi disponibili (menu)
bot.setMyCommands([
  { command: '/start', description: 'Avvia il bot' },
  { command: '/create', description: 'Crea un nuovo meme token' },
  { command: '/help', description: 'Guida e istruzioni' }
]);

// Risposta a /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 Benvenuto su Token Creator AI!

Ecco cosa puoi fare:
/create - Crea un nuovo meme token
/help - Mostra la guida`);
});

// Risposta a /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `📌 *Guida a Token Creator AI*:

1. Usa /create per avviare la creazione del tuo meme token
2. Il bot ti guiderà passo dopo passo
3. Il token sarà lanciato automaticamente su Solana 🔥`, { parse_mode: "Markdown" });
});
