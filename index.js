require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// ===== 1. VERIFICAÇÃO DE CHAVES =====
const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

if (!token || !apiKey) {
  console.error("❌ ERRO: Variáveis TELEGRAM_TOKEN ou GEMINI_API_KEY não encontradas!");
  console.error("Configure no painel do Render em: Environment → Add Environment Variable");
  process.exit(1);
}

// ===== 2. SERVIDOR HTTP (DEVE SER O PRIMEIRO — mantém o Render acordado) =====
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('🏍️ Miuraboy Bot operando!');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor HTTP ativo na porta ${PORT}`);

  // ===== 3. BOT E IA INICIAM DEPOIS DO SERVIDOR =====
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `Você é o Miuraboy, assistente virtual de um app para motoboys do Rio de Janeiro.
Seu tom é de parceria — fala como motoboy experiente, direto, sem enrolação.
Use gírias cariocas leves quando fizer sentido: "cria", "mano", "na fita", "correria".
Você ajuda com: controle financeiro de entregas, dicas de mecânica de moto, economia de combustível, 
peças compatíveis, postos de gasolina, e tudo relacionado ao dia a dia do motoboy.
Respostas curtas e úteis. Máximo 3 parágrafos.`
  });

  const bot = new TelegramBot(token, { polling: true });
  console.log("🚀 Miuraboy Bot online e aguardando chamados!");

  // ===== 4. COMANDO /start =====
  bot.onText(/\/start/, (msg) => {
    const nome = msg.from.first_name || "cria";
    bot.sendMessage(msg.chat.id,
      `Fala ${nome}! 🏍️\n\nSou o Miuraboy, seu parceiro na correria.\n\nPode me perguntar sobre:\n💰 Quanto você ganhou hoje\n🔧 Dicas de mecânica\n⛽ Como economizar combustível\n🚨 Postos na fita\n\nManda o papo! 👊`
    );
  });

  // ===== 5. MENSAGENS GERAIS =====
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texto = msg.text;

    // Ignora comandos já tratados e mensagens sem texto
    if (!texto || texto.startsWith('/')) return;

    // Indicador de digitando
    bot.sendChatAction(chatId, 'typing');

    try {
      const result = await model.generateContent(texto);
      const resposta = result.response.text();
      bot.sendMessage(chatId, resposta);

    } catch (error) {
      console.error("🚨 ERRO NA IA:", error.message);

      // Mensagem de erro específica por tipo
      if (error.message.includes('API_KEY') || error.message.includes('apiKey')) {
        bot.sendMessage(chatId, "Putz, problema com a chave da IA. Avisa o admin! 🔑");
      } else if (error.message.includes('quota') || error.message.includes('QUOTA')) {
        bot.sendMessage(chatId, "Esgotou a cota da IA hoje mano, tenta amanhã! 📊");
      } else {
        bot.sendMessage(chatId, "Deu um prego aqui no motor, tenta de novo em um minuto! 🔧");
      }
    }
  });

  // ===== 6. ERROS DE POLLING =====
  bot.on('polling_error', (error) => {
    console.error("❌ Erro de polling:", error.message);
  });
});

// ===== 7. ERROS DO SERVIDOR =====
server.on('error', (error) => {
  console.error("❌ Erro no servidor HTTP:", error.message);
});
