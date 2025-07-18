import dotenv from 'dotenv';
import express from 'express';
import { Telegraf } from 'telegraf';

dotenv.config();
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!');
});

bot.on('text', async (ctx) => {
  const idea = ctx.message.text;
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

// Endpoint per mantenere vivo il bot su Render
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvia il webserver
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server attivo sulla porta ${PORT}`);
});

// Avvia il bot
bot.launch();
console.log("🤖 Bot Telegram avviato!");
