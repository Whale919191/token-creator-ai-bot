require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const Replicate = require('replicate');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// Comando /start
bot.start((ctx) => {
  ctx.reply('👋 Benvenuto su Token Creator AI!');
});

// Comando /replicate per generare logo AI realistico
bot.command('replicate', async (ctx) => {
  const prompt = ctx.message.text.replace('/replicate', '').trim();

  if (!prompt) {
    return ctx.reply("Scrivi qualcosa dopo /replicate per generare un'immagine.\nEsempio: `/replicate logo meme token neon`", { parse_mode: 'Markdown' });
  }

  await ctx.reply("🎨 Sto generando il logo con AI...");

  try {
    const output = await replicate.run(
      "stability-ai/sdxl", // puoi cambiare modello qui se vuoi
      {
        input: {
          prompt: prompt,
          negative_prompt: "blurry, bad quality, text",
          width: 512,
          height: 512,
          guidance_scale: 7,
          num_inference_steps: 30
        }
      }
    );

    const imageUrl = output[0];
    await ctx.replyWithPhoto({ url: imageUrl }, { caption: `✨ Ecco il logo generato per:\n*${prompt}*`, parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply("❌ Errore durante la generazione dell'immagine.");
  }
});

// Logo gratuito con RoboHash su qualsiasi messaggio testuale
bot.on('text', async (ctx) => {
  const idea = ctx.message.text;

  await ctx.reply(`💡 Bella idea: *${idea}*\nSto generando un logo finto...`, { parse_mode: 'Markdown' });

  const fakeImageUrl = `https://robohash.org/${encodeURIComponent(idea)}.png?set=set3`;

  await ctx.replyWithPhoto({ url: fakeImageUrl }, {
    caption: `🧪 Ecco un logo generato gratis per: *${idea}*`,
    parse_mode: 'Markdown'
  });
});

// Webhook per Render
app.get("/", (req, res) => {
  res.send("✅ Bot attivo!");
});

// Avvio del bot
bot.launch();
console.log("🤖 Bot attivato!");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service attivo sulla porta ${PORT}`);
});
