require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Comando /start
bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!');
});

// Risposta unica ai messaggi: generazione logo
bot.on('text', async (ctx) => {
  const idea = ctx.message.text;

  const prompt = `logo crypto meme per: ${idea}`;
  const fakeImageUrl = `https://api.dicebear.com/8.x/bottts/png?seed=${encodeURIComponent(idea)}`;

  await ctx.reply(`💡 Bella idea: *${idea}*\nSto generando il logo...`, { parse_mode: 'Markdown' });
  await ctx.replyWithPhoto({ url: fakeImageUrl }, { caption: `Ecco il logo generato per *${idea}*`, parse_mode: 'Markdown' });
});

// Avvia il bot
bot.launch();
console.log("🤖 Bot attivo!");

// Web server per Render (altrimenti va in timeout)
app.get("/", (req, res) => {
  res.send("Bot attivo!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web service attivo sulla porta 3000!");
});
