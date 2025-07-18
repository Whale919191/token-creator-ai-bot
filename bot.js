require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Comando /start
bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!');
});

// Risposta a qualsiasi messaggio di testo
bot.on('text', (ctx) => {
  const idea = ctx.message.text;
  ctx.reply(`💡 Bella idea! Genero nome e logo...`);
});

// Avvia il bot
bot.launch();
console.log("🤖 Bot attivo!");

// Crea un web server per Render (serve per tenerlo online)
app.get("/", (req, res) => {
  res.send("Bot attivo!");
});

// Avvia il web server su porta 3000 o quella fornita da Render
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web service attivo sulla porta 3000");
});
bot.on('text', async (ctx) => {
  const idea = ctx.message.text;

  // Costruiamo un prompt per generare un logo
  const prompt = `logo crypto meme per: ${idea}`;

  // Finta immagine generata (prossimo step: AI vera)
  const fakeImageUrl = `https://api.dicebear.com/8.x/bottts/png?seed=${encodeURIComponent(idea)}`;

  await ctx.reply(`💡 Bella idea: *${idea}*\nSto generando il logo...`, { parse_mode: 'Markdown' });
  await ctx.replyWithPhoto({ url: fakeImageUrl }, { caption: `Ecco il logo generato per *${idea}*`, parse_mode: 'Markdown' });
});
