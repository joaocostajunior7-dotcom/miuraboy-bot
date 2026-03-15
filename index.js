const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// ===== 1. VERIFICACAO DE CHAVES =====
const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

if (!token || !apiKey) {
  console.error("ERRO: Variaveis TELEGRAM_TOKEN ou GEMINI_API_KEY nao encontradas!");
  console.error("Configure no painel do Render em: Environment > Add Environment Variable");
  process.exit(1);
}

// ===== 2. SERVIDOR HTTP (mante o Render acordado) =====
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Miuraboy Bot operando!');
});

// ===== COOLDOWN ANTI-SPAM =====
const cooldown = {};

// ===== 3. INICIALIZA SERVIDOR =====
server.listen(PORT, '0.0.0.0', () => {

  console.log(`Servidor HTTP ativo na porta ${PORT}`);

  // ===== 4. CONFIGURACAO DA IA =====
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `
Voce e o Miuraboy, assistente virtual de um app para motoboys do Rio de Janeiro.

Fale como um motoboy experiente.
Tom direto, parceiro, sem enrolacao.

Use girias leves quando fizer sentido:
cria, mano, correria, na pista, visao.

Voce ajuda com:
- controle financeiro de entregas
- economia de combustivel
- mecanica de moto
- manutencao preventiva
- rotas e postos

Respostas curtas e uteis.
Maximo 3 paragrafos.
`
  });

  // ===== 5. BOT TELEGRAM =====
  const bot = new TelegramBot(token, {
    polling: {
      autoStart: true,
      params: { timeout: 10 }
    }
  });

  console.log("Miuraboy Bot online!");

  // ===== 6. COMANDO START =====
  bot.onText(/\/start/, (msg) => {
    const nome = msg.from.first_name || "cria";
    bot.sendMessage(msg.chat.id,
`Fala ${nome}!

Sou o Miuraboy, parceiro da correria.

Posso ajudar com:

- Controle de ganhos
- Manutencao de moto
- Economia de combustivel
- Dicas da rua

Comandos uteis:
/ajuda
/manutencao
/lucro

Manda o papo!`);
  });

  // ===== 7. COMANDO AJUDA =====
  bot.onText(/\/ajuda/, (msg) => {
    bot.sendMessage(msg.chat.id,
`Comandos do Miuraboy:

/start - iniciar conversa
/ajuda - ver comandos
/manutencao - manutencao da moto
/lucro - calculo rapido de lucro

Ou manda qualquer pergunta sobre moto ou delivery.`);
  });

  // ===== 8. COMANDO MANUTENCAO =====
  bot.onText(/\/manutencao/, (msg) => {
    bot.sendMessage(msg.chat.id,
`Manutencao basica da moto (uso delivery):

3000 km - troca de oleo
6000 km - filtro de ar
10000 km - vela + limpeza de bico
15000 km - verificar relacao
20000 km - kit relacao completo

Se roda pesado no delivery, antecipa essas revisoes.`);
  });

  // ===== 9. COMANDO LUCRO =====
  bot.onText(/\/lucro/, (msg) => {
    bot.sendMessage(msg.chat.id,
`Calculadora simples:

Lucro = Corridas - Gasolina - Manutencao

Exemplo:
200 reais corridas
40 gasolina
10 manutencao

Lucro final = 150 no bolso.`);
  });

  // ===== 10. MENSAGENS GERAIS =====
  bot.on('message', async (msg) => {

    const chatId = msg.chat.id;
    const texto = msg.text;

    if (!texto || texto.startsWith('/')) return;

    // COOLDOWN
    if (cooldown[chatId] && Date.now() - cooldown[chatId] < 3000) {
      return bot.sendMessage(chatId, "Calma cria, manda uma pergunta por vez!");
    }

    cooldown[chatId] = Date.now();

    bot.sendChatAction(chatId, 'typing');

    try {
      const result = await model.generateContent(texto);
      const resposta = result.response.text();
      bot.sendMessage(chatId, resposta.substring(0, 3500));

    } catch (error) {
      console.error("ERRO NA IA:", error.message);

      if (error.message.includes('API_KEY') || error.message.includes('apiKey')) {
        bot.sendMessage(chatId, "Problema com a chave da IA. Avisa o administrador.");
      } else if (error.message.includes('quota') || error.message.includes('QUOTA')) {
        bot.sendMessage(chatId, "A cota da IA acabou hoje. Tenta amanha parceiro.");
      } else {
        bot.sendMessage(chatId, "Deu um prego aqui no motor. Tenta de novo em um minuto.");
      }
    }
  });

  // ===== 11. ERROS DE POLLING =====
  bot.on('polling_error', (error) => {
    console.error("Erro de polling:", error.message);
  });

});

// ===== 12. ERROS DO SERVIDOR =====
server.on('error', (error) => {
  console.error("Erro no servidor HTTP:", error.message);
});
