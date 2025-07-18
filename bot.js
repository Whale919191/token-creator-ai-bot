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
