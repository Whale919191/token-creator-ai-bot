import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const TOKEN = process.env.TOKEN;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(TOKEN, { webHook: { port: PORT } });

// Imposta il webhook
const webhookURL = `${BASE_URL}/bot${TOKEN}`;
bot.setWebHook(webhookURL).then(() => {
  console.log("✅ Webhook impostato:", webhookURL);
});

// Express app per ricevere i messaggi del webhook
const app = express();
app.use(express.json());
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (_, res) => res.send("🤖 Token Creator AI è online"));
app.listen(PORT, () => {
  console.log("🚀 Server avviato sulla porta", PORT);
});

// Funzione per generare nome e ticker
function generateTokenName() {
  const adjectives = ["Crazy", "Mega", "Wild", "Magic", "Degen", "Fat"];
  const animals = ["Cat", "Dog", "Frog", "Ape", "Whale", "Pepe"];
  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}`;
  const ticker = name.replace(/[aeiou]/gi, "").substring(0, 4).toUpperCase();
  return { name, ticker };
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Benvenuto su Token Creator AI! 👋\nUsa /create per generare un token meme.`);
});

// Comando /create
bot.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;
  const { name, ticker } = generateTokenName();
  const logoUrl = `https://robohash.org/${encodeURIComponent(name)}.png`;

  const caption = `🪙 *Nome*: ${name}\n🔤 *Ticker*: ${ticker}\n🖼 *Logo generato automaticamente*`;

  try {
    await bot.sendPhoto(chatId, logoUrl, {
      caption,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Errore invio foto:", err.message);
    bot.sendMessage(chatId, "Si è verificato un errore nella generazione del logo.");
  }
});
