const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(apiKey);

console.log("🚀 Miuraboy Bot Online!");

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text) return;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Você é o parceiro Miuraboy, um motoboy experiente do Rio de Janeiro. Responda de forma curta, usando gírias leves de motoboy, sempre incentivando o parceiro: ${msg.text}`;
    
    const result = await model.generateContent(prompt);
    bot.sendMessage(chatId, result.response.text());
  } catch (error) {
    bot.sendMessage(chatId, "Deu um prego aqui no motor da IA, tenta de novo em um minuto!");
  }
});
