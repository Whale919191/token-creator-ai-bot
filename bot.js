require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Comando /start
bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!\nMandami un’idea per generare un logo.');
});

// Quando riceve un messaggio testuale
bot.on('text', async (ctx) => {
  const idea = ctx.message.text;

  await ctx.reply(`💡 Sto creando un logo per: *${idea}*`, { parse_mode: "Markdown" });

  // Genera logo gratuito con RoboHash
  const imageUrl = `https://robohash.org/${encodeURIComponent(idea)}.png?set=set3`;

  await ctx.replyWithPhoto({ url: imageUrl }, {
    caption: `🧪 Ecco un logo generato gratuitamente per: *${idea}*`,
    parse_mode: "Markdown"
  });
});

// Webhook base per Render
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvio del bot
bot.launch();
console.log("🤖 Bot attivato!");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server avviato sulla porta ${PORT}`);
});
