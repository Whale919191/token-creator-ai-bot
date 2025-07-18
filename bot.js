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
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvia bot Telegram
bot.launch();
console.log("🤖 Bot attivato!");

// Web server su porta fornita da Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service attivo sulla porta ${PORT}`);
});
