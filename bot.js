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

  // Genera nome e ticker fake
  const fakeName = idea.split(' ')[0].toUpperCase() + ' Coin';
  const fakeTicker = idea
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 4)
    .toUpperCase();

  await ctx.reply(`💡 Nome token: *${fakeName}*\n🔤 Ticker: *${fakeTicker}*`, { parse_mode: "Markdown" });

  const logoUrl = `https://robohash.org/${encodeURIComponent(idea)}.png?set=set3`;

  await ctx.replyWithPhoto({ url: logoUrl }, {
    caption: `🧪 Logo generato per: *${idea}*`,
    parse_mode: "Markdown"
  });
});

// Endpoint di salute per Render
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvia il bot
bot.launch();
console.log("🤖 Bot attivato!");

// Web server necessario per Render (Webhook)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service attivo sulla porta ${PORT}`);
});
