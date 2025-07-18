require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Risposta al comando /start
bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!');
});

// Risponde a qualsiasi messaggio testuale
bot.on('text', async (ctx) => {
  const idea = ctx.message.text;

  await ctx.reply(`💡 Bella idea: *${idea}*\nSto generando un logo finto...`);

  // Usa RoboHash (gratuito) per generare una immagine partendo da testo
  const fakeImageUrl = `https://robohash.org/${encodeURIComponent(idea)}.png?set=set3`;

  await ctx.replyWithPhoto({ url: fakeImageUrl }, {
    caption: `🧪 Ecco un logo generato gratis per: *${idea}*`
  });
});

// Webhook per Render (serve per tenerlo attivo)
app.get('/', (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvia bot + server web
bot.launch();
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web service attivo sulla porta 3000!");
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service attivo sulla porta ${PORT}`);
});
  console.log("🌐 Web service attivo sulla porta 3000!");
});
