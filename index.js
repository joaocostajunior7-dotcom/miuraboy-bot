require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Verificação de Segurança
const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

if (!token || !apiKey) {
  console.error("❌ ERRO: Chaves não encontradas!");
  process.exit(1);
}

// 2. Configuração da IA (DNA do Miuraboy)
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Você é o Miuraboy, um motoboy experiente do Rio de Janeiro. Use gírias cariocas leves. Seja prestativo e direto."
});

// 3. Inicialização
const bot = new TelegramBot(token, { polling: true });
console.log("🚀 Miuraboy v2.0 online!");

// 4. Lógica de Mensagens
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const textoUsuario = msg.text;

  if (!textoUsuario) return;
  bot.sendChatAction(chatId, 'typing');

  try {
    const result = await model.generateContent(textoUsuario);
    const response = await result.response;
    bot.sendMessage(chatId, response.text());

  } catch (error) {
    console.error("🚨 FALHA NO MOTOR:", error.message);
    bot.sendMessage(chatId, "Putz irmão, deu um prego aqui. Tenta de novo!");
  }
});
