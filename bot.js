require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Funzione per generare un nome token casuale
function generaNomeToken() {
  const aggettivi = ['Meme', 'Crypto', 'Degen', 'Magic', 'Rocket', 'Incredible', 'Super', 'Meta'];
  const animali = ['Cat', 'Dog', 'Frog', 'Pepe', 'Monkey', 'Banana', 'Shark', 'Tiger'];
  const randomA = aggettivi[Math.floor(Math.random() * aggettivi.length)];
  const randomB = animali[Math.floor(Math.random() * animali.length)];
  return `${randomA} ${randomB}`;
}

// Funzione per generare un ticker tipo "MCT"
function generaTicker(nome) {
  return nome
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 4); // max 4 lettere
}

// Comando /start
bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!\nScrivimi un’idea o premi /genera per creare un token!');
});

// Comando personalizzato /genera
bot.command('genera', async (ctx) => {
  const nome = generaNomeToken();
  const ticker = generaTicker(nome);
  const logoURL = `https://robohash.org/${encodeURIComponent(nome)}.png?set=set3`;

  await ctx.reply(`✨ *Nome Token:* ${nome}\n🔠 *Ticker:* ${ticker}`);
  await ctx.replyWithPhoto({ url: logoURL }, { caption: `🧪 Logo generato per *${nome}*` });
});

// Webhook per Render
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvio bot
bot.launch();
console.log("🤖 Bot attivato!");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service attivo sulla porta ${PORT}`);
});PORT}`);
});
