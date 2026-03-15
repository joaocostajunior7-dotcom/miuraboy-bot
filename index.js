require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// 1. Verificação de Segurança (Impede o bot de ligar se faltar peça)
const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

if (!token || !apiKey) {
  console.error("❌ ERRO CRÍTICO: Chaves TELEGRAM_TOKEN ou GEMINI_API_KEY não encontradas no Render!");
  process.exit(1);
}

// 2. Configuração da IA Gemini (Ajustado para o modelo Flash 1.5)
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  // Instrução de Sistema: O "Manual de Conduta" do Miuraboy
  systemInstruction: "Você é o Miuraboy, um motoboy experiente do Rio de Janeiro. Use gírias cariocas leves (corre, parceiro, papo reto, visão, asfalto). Seja prestativo, dê dicas de mecânica, rotas e finanças para entregadores. Respostas curtas e diretas."
});

// 3. Inicialização do Bot do Telegram
const bot = new TelegramBot(token, { polling: true });

console.log("🚀 Miuraboy v2.0 online e acelerando no Render!");

// 4. Lógica de Mensagens
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const textoUsuario = msg.text;

  // Ignora o que não for texto (fotos, figurinhas) para não dar erro
  if (!textoUsuario) return;

  // Feedback visual para o usuário
  bot.sendChatAction(chatId, 'typing');

  try {
    // 5. Chamada da IA com Tratamento de Segurança
    const result = await model.generateContent(textoUsuario);
    const response = await result.response;
    const respostaIA = response.text();

    // Envia a resposta da IA
    bot.sendMessage(chatId, respostaIA);

  } catch (error) {
    // 6. Diagnóstico Meticuloso de Erros (O Pulo do Gato)
    console.error("🚨 FALHA NO MOTOR:", error.message);

    let mensagemErro = "Putz irmão, o motor deu um engasgo aqui. Tenta de novo!";

    // Se o erro for na chave da API
    if (error.message.includes("API key")) {
      mensagemErro = "Ih parceiro, minha chave da IA tá com defeito. Avisa o administrador!";
    } 
    // Se o erro for excesso de mensagens (Quota)
    else if (error.message.includes("429") || error.message.includes("quota")) {
      mensagemErro = "Calma aí, parceiro! Muita gente falando ao mesmo tempo. Espera um minutinho.";
    }
    // Se a IA bloquear por segurança (filtro de conteúdo)
    else if (error.message.includes("safety")) {
      mensagemErro = "Papo reto: não posso falar sobre esse assunto. Vamos focar no corre?";
    }

    bot.sendMessage(chatId, mensagemErro);
  }
});
