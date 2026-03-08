// seed-polls.js — rodar com: node seed-polls.js
// npm install firebase antes de rodar

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, getDocs } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAts2gnUCTGn6JNYm3p6bSloKIbqp6vhsI",
  authDomain: "votaai-9b91d.firebaseapp.com",
  projectId: "votaai-9b91d",
  storageBucket: "votaai-9b91d.firebasestorage.app",
  messagingSenderId: "397158117689",
  appId: "1:397158117689:web:9caba03f7a21e97721f8e8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const POLLS = [
  // ==================== POLÍTICA ====================
  { question: 'Você votaria em:', optionA: { emoji: '🔴', label: 'Lula', sublabel: 'PT' }, optionB: { emoji: '🟦', label: 'Bolsonaro', sublabel: 'PL' }, tag: 'política', color: '#FF5252' },
  { question: 'O Brasil deveria ter:', optionA: { emoji: '👑', label: 'Monarquia', sublabel: 'como antigamente' }, optionB: { emoji: '🗳️', label: 'República', sublabel: 'como hoje' }, tag: 'política', color: '#6C63FF' },
  { question: 'Você apoia:', optionA: { emoji: '🔫', label: 'Posse de armas', sublabel: 'direito do cidadão' }, optionB: { emoji: '🕊️', label: 'Desarmamento', sublabel: 'menos violência' }, tag: 'política', color: '#FF6B35' },
  { question: 'Qual sistema é melhor?', optionA: { emoji: '📺', label: 'Voto eletrônico', sublabel: 'mais rápido' }, optionB: { emoji: '📄', label: 'Voto impresso', sublabel: 'mais seguro' }, tag: 'política', color: '#00C9A7' },
  { question: 'Você prefere governos:', optionA: { emoji: '⬅️', label: 'De esquerda', sublabel: 'mais sociais' }, optionB: { emoji: '➡️', label: 'De direita', sublabel: 'mais liberais' }, tag: 'política', color: '#F7B731' },
  { question: 'O Brasil deveria:', optionA: { emoji: '🌿', label: 'Legalizar maconha', sublabel: 'como outros países' }, optionB: { emoji: '🚫', label: 'Manter proibição', sublabel: 'é droga' }, tag: 'política', color: '#FF4E8C' },
  { question: 'Pena de morte no Brasil:', optionA: { emoji: '⚖️', label: 'A favor', sublabel: 'para crimes graves' }, optionB: { emoji: '✋', label: 'Contra', sublabel: 'Estado não mata' }, tag: 'política', color: '#7C4DFF' },
  { question: 'Aborto no Brasil:', optionA: { emoji: '✅', label: 'Deve ser legalizado', sublabel: 'direito da mulher' }, optionB: { emoji: '🙏', label: 'Deve ser proibido', sublabel: 'vida é sagrada' }, tag: 'política', color: '#FF5252' },
  { question: 'Você apoia cotas raciais?', optionA: { emoji: '✅', label: 'Sim, apóio', sublabel: 'reduz desigualdade' }, optionB: { emoji: '❌', label: 'Não apóio', sublabel: 'meritocracia' }, tag: 'política', color: '#6C63FF' },
  { question: 'Redução da maioridade penal:', optionA: { emoji: '✅', label: 'A favor', sublabel: '16 anos' }, optionB: { emoji: '❌', label: 'Contra', sublabel: 'são crianças' }, tag: 'política', color: '#FF6B35' },
  { question: 'O Congresso brasileiro é:', optionA: { emoji: '💩', label: 'Corrupto demais', sublabel: 'não representa o povo' }, optionB: { emoji: '⚖️', label: 'Necessário', sublabel: 'apesar dos problemas' }, tag: 'política', color: '#00C9A7' },
  { question: 'Reforma tributária:', optionA: { emoji: '✅', label: 'Era necessária', sublabel: 'simplifica impostos' }, optionB: { emoji: '❌', label: 'Vai piorar', sublabel: 'mais impostos' }, tag: 'política', color: '#F7B731' },
  { question: 'Você confia nas pesquisas eleitorais?', optionA: { emoji: '✅', label: 'Sim, confio', sublabel: 'são técnicas' }, optionB: { emoji: '❌', label: 'Não confio', sublabel: 'são manipuladas' }, tag: 'política', color: '#FF4E8C' },
  { question: 'O STF tem poder demais?', optionA: { emoji: '✅', label: 'Sim, tem', sublabel: 'julga demais' }, optionB: { emoji: '❌', label: 'Não tem', sublabel: 'cumpre papel' }, tag: 'política', color: '#7C4DFF' },
  { question: 'Você pagaria mais imposto por:', optionA: { emoji: '🏥', label: 'Saúde pública', sublabel: 'melhor SUS' }, optionB: { emoji: '💰', label: 'Nunca pagaria mais', sublabel: 'governo é ineficiente' }, tag: 'política', color: '#FF5252' },

  // ==================== FUTEBOL ====================
  { question: 'Maior time do Brasil:', optionA: { emoji: '⚫', label: 'Flamengo', sublabel: 'mais títulos recentes' }, optionB: { emoji: '⚪', label: 'Corinthians', sublabel: 'maior torcida' }, tag: 'esporte', color: '#FF5252' },
  { question: 'O melhor da história do Brasil:', optionA: { emoji: '👑', label: 'Pelé', sublabel: '3 Copas' }, optionB: { emoji: '🐮', label: 'Ronaldo Fenômeno', sublabel: '2 Copas' }, tag: 'esporte', color: '#F7B731' },
  { question: 'A Copa de 2026 o Brasil:', optionA: { emoji: '🏆', label: 'Vai ganhar', sublabel: 'hexacampeão!' }, optionB: { emoji: '😞', label: 'Vai decepcionар', sublabel: 'como sempre' }, tag: 'esporte', color: '#00C9A7' },
  { question: 'Brasileirão ou:', optionA: { emoji: '🇧🇷', label: 'Brasileirão', sublabel: 'melhor futebol' }, optionB: { emoji: '🇪🇸', label: 'La Liga', sublabel: 'mais técnico' }, tag: 'esporte', color: '#6C63FF' },
  { question: 'O VAR no futebol:', optionA: { emoji: '✅', label: 'Melhorou o jogo', sublabel: 'mais justo' }, optionB: { emoji: '❌', label: 'Estragou o jogo', sublabel: 'tirou a emoção' }, tag: 'esporte', color: '#FF6B35' },
  { question: 'Neymar é:', optionA: { emoji: '🌟', label: 'Maior do mundo', sublabel: 'quando quer' }, optionB: { emoji: '🎭', label: 'Muito frescura', sublabel: 'desperdiça talento' }, tag: 'esporte', color: '#FF4E8C' },
  { question: 'Time que tem mais títulos nacionais:', optionA: { emoji: '🔵🔴', label: 'Flamengo', sublabel: 'o maior do Brasil' }, optionB: { emoji: '⬛⬜', label: 'Santos', sublabel: 'era de Pelé' }, tag: 'esporte', color: '#7C4DFF' },
  { question: 'Libertadores ou Champions League?', optionA: { emoji: '🌎', label: 'Libertadores', sublabel: 'mais emocionante' }, optionB: { emoji: '🌍', label: 'Champions', sublabel: 'melhor nível' }, tag: 'esporte', color: '#FF5252' },
  { question: 'O maior clássico do Brasil:', optionA: { emoji: '🔴⚫', label: 'Fla x Flu', sublabel: 'RJ' }, optionB: { emoji: '⬛⬜', label: 'Corinthians x Palmeiras', sublabel: 'SP' }, tag: 'esporte', color: '#F7B731' },
  { question: 'Você assistiria à Copa do Mundo pelo:', optionA: { emoji: '📺', label: 'Brasil jogando', sublabel: 'só por amor' }, optionB: { emoji: '⚽', label: 'Qualquer jogo', sublabel: 'sou fã do esporte' }, tag: 'esporte', color: '#00C9A7' },
  { question: 'Dorival Júnior na seleção:', optionA: { emoji: '✅', label: 'Confiança total', sublabel: 'vai dar certo' }, optionB: { emoji: '❌', label: 'Escolha errada', sublabel: 'troca logo' }, tag: 'esporte', color: '#6C63FF' },
  { question: 'Maior goleiro brasileiro:', optionA: { emoji: '🧤', label: 'Taffarel', sublabel: 'Copa 94' }, optionB: { emoji: '🧤', label: 'Cássio', sublabel: 'geração atual' }, tag: 'esporte', color: '#FF6B35' },
  { question: 'MMA ou Boxe?', optionA: { emoji: '🥊', label: 'MMA', sublabel: 'mais completo' }, optionB: { emoji: '🥊', label: 'Boxe', sublabel: 'mais técnico' }, tag: 'esporte', color: '#FF4E8C' },
  { question: 'Você apoia o esporte feminino?', optionA: { emoji: '✅', label: 'Muito, igual ao masculino', sublabel: 'mesmo investimento' }, optionB: { emoji: '🤔', label: 'Apoio mas não assisto', sublabel: 'nível diferente' }, tag: 'esporte', color: '#7C4DFF' },
  { question: 'Fórmula 1 sem Verstappen seria:', optionA: { emoji: '🏎️', label: 'Mais emocionante', sublabel: 'competição real' }, optionB: { emoji: '😔', label: 'Menos interessante', sublabel: 'ele é o show' }, tag: 'esporte', color: '#FF5252' },

  // ==================== TECNOLOGIA ====================
  { question: 'iPhone ou Android?', optionA: { emoji: '🍎', label: 'iPhone', sublabel: 'ecosistema Apple' }, optionB: { emoji: '🤖', label: 'Android', sublabel: 'mais liberdade' }, tag: 'tecnologia', color: '#6C63FF' },
  { question: 'Você confia na IA?', optionA: { emoji: '🤖', label: 'Sim, é o futuro', sublabel: 'vai melhorar tudo' }, optionB: { emoji: '😨', label: 'Não, é perigosa', sublabel: 'vai tomar empregos' }, tag: 'tecnologia', color: '#00C9A7' },
  { question: 'Trabalho remoto ou presencial?', optionA: { emoji: '🏠', label: 'Remoto sempre', sublabel: 'mais produtivo' }, optionB: { emoji: '🏢', label: 'Presencial', sublabel: 'melhor para equipe' }, tag: 'tecnologia', color: '#F7B731' },
  { question: 'Redes sociais:', optionA: { emoji: '✅', label: 'Melhoraram o mundo', sublabel: 'conectam pessoas' }, optionB: { emoji: '❌', label: 'Pioraram o mundo', sublabel: 'toxicidade' }, tag: 'tecnologia', color: '#FF4E8C' },
  { question: 'Você usaria chip no cérebro?', optionA: { emoji: '✅', label: 'Sim, com certeza', sublabel: 'Neuralink' }, optionB: { emoji: '❌', label: 'Jamais', sublabel: 'muito invasivo' }, tag: 'tecnologia', color: '#7C4DFF' },
  { question: 'TikTok deveria ser banido?', optionA: { emoji: '✅', label: 'Sim, é prejudicial', sublabel: 'vicia crianças' }, optionB: { emoji: '❌', label: 'Não, é entretenimento', sublabel: 'censura' }, tag: 'tecnologia', color: '#FF5252' },
  { question: 'Metaverso:', optionA: { emoji: '🚀', label: 'É o futuro', sublabel: 'vai crescer muito' }, optionB: { emoji: '💀', label: 'Já morreu', sublabel: 'foi um fracasso' }, tag: 'tecnologia', color: '#F7B731' },
  { question: 'Criptomoedas são:', optionA: { emoji: '💰', label: 'O futuro do dinheiro', sublabel: 'descentralizado' }, optionB: { emoji: '🎰', label: 'Um cassino digital', sublabel: 'especulação pura' }, tag: 'tecnologia', color: '#00C9A7' },
  { question: 'Você prefere:', optionA: { emoji: '📚', label: 'Livro físico', sublabel: 'cheiro de papel' }, optionB: { emoji: '📱', label: 'E-book/Kindle', sublabel: 'prático e leve' }, tag: 'tecnologia', color: '#6C63FF' },
  { question: 'Privacidade ou conveniência?', optionA: { emoji: '🔒', label: 'Privacidade primeiro', sublabel: 'meus dados são meus' }, optionB: { emoji: '✨', label: 'Conveniência', sublabel: 'uso os dados, ok' }, tag: 'tecnologia', color: '#FF6B35' },
  { question: 'PlayStation ou Xbox?', optionA: { emoji: '🎮', label: 'PlayStation', sublabel: 'exclusivos melhores' }, optionB: { emoji: '🎮', label: 'Xbox', sublabel: 'Game Pass' }, tag: 'tecnologia', color: '#FF4E8C' },
  { question: 'Carros elétricos:', optionA: { emoji: '⚡', label: 'São o futuro', sublabel: 'compro logo' }, optionB: { emoji: '⛽', label: 'Prefiro a gasolina', sublabel: 'mais prático' }, tag: 'tecnologia', color: '#7C4DFF' },
  { question: 'Você usa mais:', optionA: { emoji: '💬', label: 'WhatsApp', sublabel: 'todo mundo usa' }, optionB: { emoji: '📸', label: 'Instagram', sublabel: 'mais visual' }, tag: 'tecnologia', color: '#FF5252' },
  { question: 'Streaming preferido:', optionA: { emoji: '🎬', label: 'Netflix', sublabel: 'clássico' }, optionB: { emoji: '📺', label: 'Prime Video', sublabel: 'mais conteúdo' }, tag: 'tecnologia', color: '#F7B731' },
  { question: 'Inteligência artificial vai:', optionA: { emoji: '💼', label: 'Criar mais empregos', sublabel: 'novos mercados' }, optionB: { emoji: '💀', label: 'Destruir empregos', sublabel: 'automação total' }, tag: 'tecnologia', color: '#00C9A7' },

  // ==================== COMIDA ====================
  { question: 'A melhor comida do Brasil:', optionA: { emoji: '🍖', label: 'Churrasco', sublabel: 'sul do Brasil' }, optionB: { emoji: '🫘', label: 'Feijoada', sublabel: 'Rio de Janeiro' }, tag: 'comida', color: '#FF6B35' },
  { question: 'Pizza com ou sem:', optionA: { emoji: '🍍', label: 'Abacaxi na pizza', sublabel: 'doce e salgado' }, optionB: { emoji: '🚫🍍', label: 'Jamais abacaxi', sublabel: 'crime culinário' }, tag: 'comida', color: '#FF5252' },
  { question: 'Café da manhã ideal:', optionA: { emoji: '🥞', label: 'Tapioca e frutas', sublabel: 'nordestino' }, optionB: { emoji: '🥖', label: 'Pão na chapa', sublabel: 'café com leite' }, tag: 'comida', color: '#F7B731' },
  { question: 'Melhor fast food:', optionA: { emoji: '🍟', label: "McDonald's", sublabel: 'clássico' }, optionB: { emoji: '🍔', label: "Burger King", sublabel: 'whopper' }, tag: 'comida', color: '#00C9A7' },
  { question: 'Açaí com ou sem:', optionA: { emoji: '🫐', label: 'Açaí puro', sublabel: 'na tigela' }, optionB: { emoji: '🍓', label: 'Açaí com granola', sublabel: 'e frutas' }, tag: 'comida', color: '#6C63FF' },
  { question: 'Você come:', optionA: { emoji: '🥩', label: 'Carne bem passada', sublabel: 'sem sangue' }, optionB: { emoji: '🩸', label: 'Carne ao ponto', sublabel: 'com suco' }, tag: 'comida', color: '#FF4E8C' },
  { question: 'Melhor churrasco:', optionA: { emoji: '🥩', label: 'Picanha', sublabel: 'rainha do churrasco' }, optionB: { emoji: '🍖', label: 'Costela', sublabel: 'fogo de chão' }, tag: 'comida', color: '#7C4DFF' },
  { question: 'Guaraná ou Coca?', optionA: { emoji: '🟢', label: 'Guaraná Antarctica', sublabel: 'sabor brasileiro' }, optionB: { emoji: '🔴', label: 'Coca-Cola', sublabel: 'a original' }, tag: 'comida', color: '#FF5252' },
  { question: 'Você é:', optionA: { emoji: '🥦', label: 'Vegetariano/vegan', sublabel: 'sem carne' }, optionB: { emoji: '🥩', label: 'Carnívoro assumido', sublabel: 'amo carne' }, tag: 'comida', color: '#F7B731' },
  { question: 'Brigadeiro ou:', optionA: { emoji: '🍫', label: 'Brigadeiro', sublabel: 'clássico brasileiro' }, optionB: { emoji: '🍰', label: 'Bolo de cenoura', sublabel: 'com ganache' }, tag: 'comida', color: '#00C9A7' },
  { question: 'Comida baiana:', optionA: { emoji: '🫙', label: 'Acarajé', sublabel: 'dendê na veia' }, optionB: { emoji: '🍲', label: 'Moqueca', sublabel: 'prato completo' }, tag: 'comida', color: '#6C63FF' },
  { question: 'Salgado mais gostoso:', optionA: { emoji: '🥟', label: 'Coxinha', sublabel: 'a rainha' }, optionB: { emoji: '🥧', label: 'Esfiha', sublabel: 'árabe brasileiro' }, tag: 'comida', color: '#FF6B35' },
  { question: 'Café com leite ou:', optionA: { emoji: '☕', label: 'Café puro', sublabel: 'forte e amargo' }, optionB: { emoji: '🥛', label: 'Café com leite', sublabel: 'suave' }, tag: 'comida', color: '#FF4E8C' },
  { question: 'Melhor docinho de festa:', optionA: { emoji: '🍫', label: 'Brigadeiro', sublabel: 'original' }, optionB: { emoji: '🍬', label: 'Beijinho', sublabel: 'de coco' }, tag: 'comida', color: '#7C4DFF' },
  { question: 'Frango ou peixe?', optionA: { emoji: '🍗', label: 'Frango grelhado', sublabel: 'todo dia' }, optionB: { emoji: '🐟', label: 'Peixe assado', sublabel: 'mais saudável' }, tag: 'comida', color: '#FF5252' },

  // ==================== VIDA E COMPORTAMENTO ====================
  { question: 'Você prefere:', optionA: { emoji: '🎉', label: 'Festa com amigos', sublabel: 'extrovertido' }, optionB: { emoji: '🏠', label: 'Netflix em casa', sublabel: 'introvertido' }, tag: 'vida', color: '#6C63FF' },
  { question: 'Relacionamento sério ou:', optionA: { emoji: '💍', label: 'Relacionamento sério', sublabel: 'compromisso' }, optionB: { emoji: '🆓', label: 'Solteiro e livre', sublabel: 'sem compromisso' }, tag: 'vida', color: '#FF4E8C' },
  { question: 'Você contaria uma mentira:', optionA: { emoji: '✅', label: 'Sim, se necessário', sublabel: 'mentira branca' }, optionB: { emoji: '❌', label: 'Nunca minto', sublabel: 'verdade sempre' }, tag: 'vida', color: '#F7B731' },
  { question: 'Casamento:', optionA: { emoji: '💍', label: 'Para sempre', sublabel: 'uma vez só' }, optionB: { emoji: '📃', label: 'Papel não importa', sublabel: 'amor é o que conta' }, tag: 'vida', color: '#00C9A7' },
  { question: 'Filhos:', optionA: { emoji: '👶', label: 'Quero ter filhos', sublabel: 'família completa' }, optionB: { emoji: '🚫', label: 'Não quero filhos', sublabel: 'childfree' }, tag: 'vida', color: '#FF5252' },
  { question: 'Você acredita em:', optionA: { emoji: '🙏', label: 'Deus', sublabel: 'tenho fé' }, optionB: { emoji: '🔬', label: 'Ciência apenas', sublabel: 'ateu/agnóstico' }, tag: 'vida', color: '#7C4DFF' },
  { question: 'Riqueza ou felicidade?', optionA: { emoji: '💰', label: 'Dinheiro', sublabel: 'resolve a maioria' }, optionB: { emoji: '😊', label: 'Felicidade', sublabel: 'saúde mental' }, tag: 'vida', color: '#FF6B35' },
  { question: 'Você perdoaria traição?', optionA: { emoji: '✅', label: 'Dependendo, sim', sublabel: 'errar é humano' }, optionB: { emoji: '❌', label: 'Nunca perdoaria', sublabel: 'zero tolerância' }, tag: 'vida', color: '#FF4E8C' },
  { question: 'Você acredita em:', optionA: { emoji: '💫', label: 'Amor à primeira vista', sublabel: 'acontece' }, optionB: { emoji: '🧠', label: 'Amor que se constrói', sublabel: 'é um processo' }, tag: 'vida', color: '#6C63FF' },
  { question: 'Você prefere ganhar:', optionA: { emoji: '💰', label: 'Muito dinheiro', sublabel: 'trabalho que odeia' }, optionB: { emoji: '❤️', label: 'Menos dinheiro', sublabel: 'trabalho que ama' }, tag: 'vida', color: '#F7B731' },
  { question: 'Faria cirurgia plástica?', optionA: { emoji: '✅', label: 'Sim, sem problema', sublabel: 'meu corpo, minha escolha' }, optionB: { emoji: '❌', label: 'Não faria', sublabel: 'natural é melhor' }, tag: 'vida', color: '#00C9A7' },
  { question: 'Você se importa com:', optionA: { emoji: '👗', label: 'Moda e estilo', sublabel: 'aparência importa' }, optionB: { emoji: '👕', label: 'Conforto acima de tudo', sublabel: 'quem liga?' }, tag: 'vida', color: '#FF5252' },
  { question: 'Viagem dos sonhos:', optionA: { emoji: '🗼', label: 'Europa', sublabel: 'cultura e história' }, optionB: { emoji: '🏖️', label: 'Caribe', sublabel: 'praia e calor' }, tag: 'vida', color: '#7C4DFF' },
  { question: 'Você é mais:', optionA: { emoji: '🧠', label: 'Racional', sublabel: 'pensa antes de agir' }, optionB: { emoji: '❤️', label: 'Emocional', sublabel: 'sente antes de pensar' }, tag: 'vida', color: '#FF6B35' },
  { question: 'Sucesso para você é:', optionA: { emoji: '🏆', label: 'Fama e reconhecimento', sublabel: 'ser conhecido' }, optionB: { emoji: '🏡', label: 'Paz e família', sublabel: 'vida simples' }, tag: 'vida', color: '#FF4E8C' },

  // ==================== ENTRETENIMENTO ====================
  { question: 'Marvel ou DC?', optionA: { emoji: '🕷️', label: 'Marvel', sublabel: 'Avengers' }, optionB: { emoji: '🦇', label: 'DC', sublabel: 'Batman' }, tag: 'entretenimento', color: '#FF5252' },
  { question: 'Melhor série brasileira:', optionA: { emoji: '🎭', label: '3%', sublabel: 'Netflix BR' }, optionB: { emoji: '🌿', label: 'Marighella', sublabel: 'Globoplay' }, tag: 'entretenimento', color: '#F7B731' },
  { question: 'Funk carioca:', optionA: { emoji: '🎵', label: 'É cultura brasileira', sublabel: 'patrimônio' }, optionB: { emoji: '🚫', label: 'Não é música', sublabel: 'é barulho' }, tag: 'entretenimento', color: '#00C9A7' },
  { question: 'Sertanejo universitário:', optionA: { emoji: '🤠', label: 'Amo demais', sublabel: 'trilha da vida' }, optionB: { emoji: '😣', label: 'Não suporto', sublabel: 'muito repetitivo' }, tag: 'entretenimento', color: '#6C63FF' },
  { question: 'Melhor cantor brasileiro:', optionA: { emoji: '🎸', label: 'Chico Buarque', sublabel: 'MPB clássica' }, optionB: { emoji: '🎤', label: 'Roberto Carlos', sublabel: 'Rei da música' }, tag: 'entretenimento', color: '#FF6B35' },
  { question: 'Você prefere:', optionA: { emoji: '🎬', label: 'Cinema em casa', sublabel: 'conforto total' }, optionB: { emoji: '🍿', label: 'Cinema de verdade', sublabel: 'experiência única' }, tag: 'entretenimento', color: '#FF4E8C' },
  { question: 'BBB:', optionA: { emoji: '📺', label: 'Assisto todo ano', sublabel: 'viciado' }, optionB: { emoji: '🙈', label: 'Nunca assisti', sublabel: 'tempo perdido' }, tag: 'entretenimento', color: '#7C4DFF' },
  { question: 'Carnaval:', optionA: { emoji: '🎊', label: 'Melhor festa do mundo', sublabel: 'amo carnaval' }, optionB: { emoji: '😤', label: 'Odeio carnaval', sublabel: 'barulho e sujeira' }, tag: 'entretenimento', color: '#FF5252' },
  { question: 'Melhor show no Brasil:', optionA: { emoji: '🤟', label: 'Rock in Rio', sublabel: 'multi-gênero' }, optionB: { emoji: '🥁', label: 'Lollapalooza', sublabel: 'alternativo' }, tag: 'entretenimento', color: '#F7B731' },
  { question: 'Game of Thrones vs Breaking Bad:', optionA: { emoji: '⚔️', label: 'Game of Thrones', sublabel: 'melhor série ever' }, optionB: { emoji: '🧪', label: 'Breaking Bad', sublabel: 'obra-prima' }, tag: 'entretenimento', color: '#00C9A7' },
  { question: 'Podcast ou YouTube?', optionA: { emoji: '🎙️', label: 'Podcast', sublabel: 'ouço no trânsito' }, optionB: { emoji: '▶️', label: 'YouTube', sublabel: 'preciso ver' }, tag: 'entretenimento', color: '#6C63FF' },
  { question: 'Você prefere música:', optionA: { emoji: '🎵', label: 'Com letra', sublabel: 'canto junto' }, optionB: { emoji: '🎸', label: 'Instrumental', sublabel: 'foco e relaxamento' }, tag: 'entretenimento', color: '#FF6B35' },
  { question: 'Melhor época da música:', optionA: { emoji: '🕺', label: 'Anos 80/90', sublabel: 'boa música de verdade' }, optionB: { emoji: '🎤', label: 'Música atual', sublabel: 'mais criativa' }, tag: 'entretenimento', color: '#FF4E8C' },
  { question: 'Tatuagem:', optionA: { emoji: '✅', label: 'Tenho ou quero ter', sublabel: 'arte no corpo' }, optionB: { emoji: '❌', label: 'Nunca faria', sublabel: 'para sempre é muito' }, tag: 'entretenimento', color: '#7C4DFF' },
  { question: 'Influencer digital:', optionA: { emoji: '👍', label: 'É uma profissão real', sublabel: 'muito trabalho' }, optionB: { emoji: '👎', label: 'Não é trabalho de verdade', sublabel: 'fácil demais' }, tag: 'entretenimento', color: '#FF5252' },

  // ==================== TRABALHO ====================
  { question: 'Empreender ou ser CLT?', optionA: { emoji: '🚀', label: 'Empreender', sublabel: 'meu próprio negócio' }, optionB: { emoji: '💼', label: 'CLT', sublabel: 'estabilidade' }, tag: 'trabalho', color: '#6C63FF' },
  { question: 'Salário mínimo no Brasil:', optionA: { emoji: '⬆️', label: 'Deveria ser muito maior', sublabel: 'não dá para viver' }, optionB: { emoji: '⚖️', label: 'Está razoável', sublabel: 'empresas pagariam mais' }, tag: 'trabalho', color: '#F7B731' },
  { question: 'Semana de 4 dias de trabalho:', optionA: { emoji: '✅', label: 'Deveria existir', sublabel: 'mais produtividade' }, optionB: { emoji: '❌', label: 'Inviável no Brasil', sublabel: 'perde competitividade' }, tag: 'trabalho', color: '#00C9A7' },
  { question: 'Você trabalharia de graça por:', optionA: { emoji: '❤️', label: 'Paixão pelo projeto', sublabel: 'causa importante' }, optionB: { emoji: '💰', label: 'Nunca, trabalho = dinheiro', sublabel: 'tem conta a pagar' }, tag: 'trabalho', color: '#FF5252' },
  { question: 'Melhor benefício no trabalho:', optionA: { emoji: '🏠', label: 'Home office', sublabel: 'trabalho remoto' }, optionB: { emoji: '🥗', label: 'Vale alimentação generoso', sublabel: 'comida boa' }, tag: 'trabalho', color: '#FF6B35' },
  { question: 'Faculdade é obrigatória?', optionA: { emoji: '✅', label: 'Sim, é essencial', sublabel: 'abre portas' }, optionB: { emoji: '❌', label: 'Não, é opcional', sublabel: 'cursos e habilidades' }, tag: 'trabalho', color: '#7C4DFF' },
  { question: 'Você prefere trabalhar:', optionA: { emoji: '🤝', label: 'Em equipe', sublabel: 'mais dinâmico' }, optionB: { emoji: '🧘', label: 'Sozinho', sublabel: 'mais eficiente' }, tag: 'trabalho', color: '#FF4E8C' },
  { question: 'Reforma da previdência:', optionA: { emoji: '✅', label: 'Era necessária', sublabel: 'país ia à falência' }, optionB: { emoji: '❌', label: 'Prejudicou trabalhadores', sublabel: 'aposentadoria tarde' }, tag: 'trabalho', color: '#6C63FF' },
  { question: 'Chefe ideal:', optionA: { emoji: '👥', label: 'Participativo e próximo', sublabel: 'feedback constante' }, optionB: { emoji: '🔓', label: 'Que deixa trabalhar livre', sublabel: 'autonomia total' }, tag: 'trabalho', color: '#F7B731' },
  { question: 'Burnout:', optionA: { emoji: '😰', label: 'Já tive ou tenho', sublabel: 'muito comum' }, optionB: { emoji: '💪', label: 'Nunca tive', sublabel: 'sei me cuidar' }, tag: 'trabalho', color: '#00C9A7' },
  { question: 'Networking:', optionA: { emoji: '🤝', label: 'Essencial na carreira', sublabel: 'quem indica é importante' }, optionB: { emoji: '💪', label: 'Prefiro competência', sublabel: 'resultados falam mais' }, tag: 'trabalho', color: '#FF5252' },
  { question: 'Você negociaria salário?', optionA: { emoji: '✅', label: 'Sempre negocie', sublabel: 'sem vergonha' }, optionB: { emoji: '😅', label: 'Fico com o que oferecem', sublabel: 'não gosto de negociar' }, tag: 'trabalho', color: '#FF6B35' },
  { question: 'Inteligência emocional no trabalho:', optionA: { emoji: '❤️', label: 'Mais importante que QI', sublabel: 'relações importam' }, optionB: { emoji: '🧠', label: 'Competência técnica primeiro', sublabel: 'resultado é tudo' }, tag: 'trabalho', color: '#7C4DFF' },

  // ==================== BRASIL ====================
  { question: 'O Brasil é:', optionA: { emoji: '🌟', label: 'O melhor país do mundo', sublabel: 'amo o Brasil' }, optionB: { emoji: '✈️', label: 'Preciso sair daqui', sublabel: 'sem futuro' }, tag: 'vida', color: '#00C9A7' },
  { question: 'Nordeste ou Sul do Brasil?', optionA: { emoji: '☀️', label: 'Nordeste', sublabel: 'calor e alegria' }, optionB: { emoji: '❄️', label: 'Sul', sublabel: 'cultura e chimarrão' }, tag: 'vida', color: '#6C63FF' },
  { question: 'Você viveria em:', optionA: { emoji: '🏙️', label: 'São Paulo', sublabel: 'a maior cidade' }, optionB: { emoji: '🌊', label: 'Rio de Janeiro', sublabel: 'Cidade Maravilhosa' }, tag: 'vida', color: '#FF6B35' },
  { question: 'O maior problema do Brasil é:', optionA: { emoji: '💰', label: 'Corrupção', sublabel: 'rouba demais' }, optionB: { emoji: '📚', label: 'Educação fraca', sublabel: 'base de tudo' }, tag: 'política', color: '#FF4E8C' },
  { question: 'Violência no Brasil:', optionA: { emoji: '👮', label: 'Mais policiamento', sublabel: 'mais segurança' }, optionB: { emoji: '📚', label: 'Educação e emprego', sublabel: 'ataca a raiz' }, tag: 'política', color: '#7C4DFF' },
  { question: 'O sistema de saúde:', optionA: { emoji: '🏥', label: 'SUS funciona', sublabel: 'para quem precisa' }, optionB: { emoji: '💊', label: 'Precisa de plano', sublabel: 'SUS é precário' }, tag: 'política', color: '#FF5252' },
  { question: 'Você mora ou moraria em:', optionA: { emoji: '🏙️', label: 'Grande cidade', sublabel: 'oportunidades' }, optionB: { emoji: '🌾', label: 'Interior', sublabel: 'qualidade de vida' }, tag: 'vida', color: '#F7B731' },
  { question: 'Trânsito nas cidades:', optionA: { emoji: '🚗', label: 'Prefiro meu carro', sublabel: 'mais conforto' }, optionB: { emoji: '🚇', label: 'Prefiro transporte público', sublabel: 'mais rápido' }, tag: 'vida', color: '#00C9A7' },
  { question: 'Segurança pública no Brasil:', optionA: { emoji: '👮', label: 'Polícia precisa de mais poder', sublabel: 'bandido bom é...' }, optionB: { emoji: '⚖️', label: 'Reforma na segurança', sublabel: 'menos violência policial' }, tag: 'política', color: '#6C63FF' },
  { question: 'Educação pública ou privada?', optionA: { emoji: '🏫', label: 'Pública de qualidade', sublabel: 'investir no Estado' }, optionB: { emoji: '🏛️', label: 'Privada é melhor', sublabel: 'concorrência melhora' }, tag: 'política', color: '#FF6B35' },

  // ==================== SUPERPODERES ====================
  { question: 'Superpoder ideal:', optionA: { emoji: '🦅', label: 'Voar', sublabel: 'liberdade total' }, optionB: { emoji: '⚡', label: 'Super velocidade', sublabel: 'The Flash' }, tag: 'superpoderes', color: '#7C4DFF' },
  { question: 'Você preferiria:', optionA: { emoji: '🧠', label: 'Ler mentes', sublabel: 'saber tudo' }, optionB: { emoji: '👻', label: 'Ficar invisível', sublabel: 'ir onde quiser' }, tag: 'superpoderes', color: '#FF5252' },
  { question: 'Super habilidade:', optionA: { emoji: '⏱️', label: 'Parar o tempo', sublabel: 'mais horas no dia' }, optionB: { emoji: '🔮', label: 'Ver o futuro', sublabel: 'nunca errar' }, tag: 'superpoderes', color: '#F7B731' },
  { question: 'Você escolheria:', optionA: { emoji: '♾️', label: 'Imortalidade', sublabel: 'viver para sempre' }, optionB: { emoji: '💊', label: 'Nunca ficar doente', sublabel: 'saúde perfeita' }, tag: 'superpoderes', color: '#00C9A7' },
  { question: 'Superpoder financeiro:', optionA: { emoji: '💰', label: 'Criar dinheiro do nada', sublabel: 'ilimitado' }, optionB: { emoji: '🎲', label: 'Ganhar qualquer aposta', sublabel: 'sempre certo' }, tag: 'superpoderes', color: '#6C63FF' },
  { question: 'Você preferiria ser:', optionA: { emoji: '🦸', label: 'Super forte', sublabel: 'Hulk' }, optionB: { emoji: '🧲', label: 'Controlar objetos', sublabel: 'telecinese' }, tag: 'superpoderes', color: '#FF6B35' },
  { question: 'Habilidade de comunicação:', optionA: { emoji: '🌍', label: 'Falar todos os idiomas', sublabel: 'sem tradutor' }, optionB: { emoji: '🐾', label: 'Falar com animais', sublabel: 'entender tudo' }, tag: 'superpoderes', color: '#FF4E8C' },
  { question: 'Você escolheria:', optionA: { emoji: '🔙', label: 'Voltar no tempo', sublabel: 'corrigir erros' }, optionB: { emoji: '🔜', label: 'Ir para o futuro', sublabel: 'ver como fica' }, tag: 'superpoderes', color: '#7C4DFF' },

  // ==================== ROTINA ====================
  { question: 'Você acorda:', optionA: { emoji: '🐔', label: 'Antes das 7h', sublabel: 'madrugador' }, optionB: { emoji: '🦉', label: 'Depois das 9h', sublabel: 'precisa dormir' }, tag: 'rotina', color: '#F7B731' },
  { question: 'Academia:', optionA: { emoji: '💪', label: 'Vou regularmente', sublabel: 'saúde em dia' }, optionB: { emoji: '🛋️', label: 'Detesto academia', sublabel: 'prefiro descanso' }, tag: 'rotina', color: '#00C9A7' },
  { question: 'Você come:', optionA: { emoji: '🌅', label: 'Café da manhã todo dia', sublabel: 'refeição mais importante' }, optionB: { emoji: '🚫', label: 'Pulo o café da manhã', sublabel: 'não tenho fome' }, tag: 'rotina', color: '#6C63FF' },
  { question: 'Final de semana perfeito:', optionA: { emoji: '🎉', label: 'Sair, explorar, se divertir', sublabel: 'aproveitar a vida' }, optionB: { emoji: '😴', label: 'Descansar e recarregar', sublabel: 'introvertido feliz' }, tag: 'rotina', color: '#FF6B35' },
  { question: 'Você dorme:', optionA: { emoji: '🌙', label: 'Antes de meia-noite', sublabel: 'sono certo' }, optionB: { emoji: '⭐', label: 'Depois da 1h da manhã', sublabel: 'coruja' }, tag: 'rotina', color: '#FF4E8C' },
  { question: 'Meditação:', optionA: { emoji: '🧘', label: 'Medito ou quero meditar', sublabel: 'mindfulness' }, optionB: { emoji: '😅', label: 'Não consigo ficar parado', sublabel: 'muito agitado' }, tag: 'rotina', color: '#7C4DFF' },
  { question: 'Você faz:', optionA: { emoji: '📝', label: 'Lista de tarefas', sublabel: 'organizado' }, optionB: { emoji: '🌊', label: 'Vai na intuição', sublabel: 'fluindo' }, tag: 'rotina', color: '#FF5252' },
  { question: 'Quanto tempo no celular?', optionA: { emoji: '📱', label: 'Mais de 5 horas', sublabel: 'viciado' }, optionB: { emoji: '⌚', label: 'Menos de 2 horas', sublabel: 'saudável' }, tag: 'rotina', color: '#F7B731' },
  { question: 'Faz compras:', optionA: { emoji: '🛒', label: 'Uma vez na semana', sublabel: 'planejado' }, optionB: { emoji: '📦', label: 'Delivery e online', sublabel: 'não saio de casa' }, tag: 'rotina', color: '#00C9A7' },
  { question: 'Você prefere pagar:', optionA: { emoji: '💳', label: 'Cartão sempre', sublabel: 'cashback e pontos' }, optionB: { emoji: '💵', label: 'Dinheiro/Pix', sublabel: 'mais consciente' }, tag: 'rotina', color: '#6C63FF' },

  // ==================== ESTILO DE VIDA ====================
  { question: 'Moda rápida ou slow fashion?', optionA: { emoji: '🛍️', label: 'Shein e Zara', sublabel: 'tendências baratas' }, optionB: { emoji: '♻️', label: 'Qualidade e durabilidade', sublabel: 'menos é mais' }, tag: 'estilo de vida', color: '#FF6B35' },
  { question: 'Você cuida da saúde mental?', optionA: { emoji: '🛋️', label: 'Faço terapia', sublabel: 'essencial hoje' }, optionB: { emoji: '💪', label: 'Me resolvo sozinho', sublabel: 'não preciso' }, tag: 'estilo de vida', color: '#FF4E8C' },
  { question: 'Animais de estimação:', optionA: { emoji: '🐕', label: 'Cachorro', sublabel: 'melhor amigo' }, optionB: { emoji: '🐈', label: 'Gato', sublabel: 'independente' }, tag: 'estilo de vida', color: '#7C4DFF' },
  { question: 'Você se importa com sustentabilidade?', optionA: { emoji: '♻️', label: 'Muito, mudo hábitos', sublabel: 'futuro do planeta' }, optionB: { emoji: '🤷', label: 'Pouco, um por um não muda', sublabel: 'empresas poluem mais' }, tag: 'estilo de vida', color: '#FF5252' },
  { question: 'Seu ideal de corpo:', optionA: { emoji: '💪', label: 'Musculoso e definido', sublabel: 'academia todo dia' }, optionB: { emoji: '🧘', label: 'Saudável e ativo', sublabel: 'equilíbrio' }, tag: 'estilo de vida', color: '#F7B731' },
  { question: 'Álcool:', optionA: { emoji: '🍺', label: 'Bebo socialmente', sublabel: 'sem exageros' }, optionB: { emoji: '🚫', label: 'Não bebo', sublabel: 'escolha pessoal' }, tag: 'estilo de vida', color: '#00C9A7' },
  { question: 'Férias ideais:', optionA: { emoji: '🌍', label: 'Viagem internacional', sublabel: 'conhecer o mundo' }, optionB: { emoji: '🏡', label: 'Descanso em casa', sublabel: 'staycation' }, tag: 'estilo de vida', color: '#6C63FF' },
  { question: 'Você gasta mais com:', optionA: { emoji: '🍽️', label: 'Comer fora', sublabel: 'experiências' }, optionB: { emoji: '📦', label: 'Compras online', sublabel: 'coisas materiais' }, tag: 'estilo de vida', color: '#FF6B35' },
  { question: 'Casa própria ou aluguel?', optionA: { emoji: '🏠', label: 'Casa própria', sublabel: 'patrimônio' }, optionB: { emoji: '🔑', label: 'Aluguel', sublabel: 'liberdade e flexibilidade' }, tag: 'estilo de vida', color: '#FF4E8C' },
  { question: 'Você investe?', optionA: { emoji: '📈', label: 'Sim, regularmente', sublabel: 'futuro garantido' }, optionB: { emoji: '💸', label: 'Não, vivo o presente', sublabel: 'YOLO' }, tag: 'estilo de vida', color: '#7C4DFF' },

  // ==================== POLÊMICAS DIVERSAS ====================
  { question: 'Você apoiaria:', optionA: { emoji: '🏳️‍🌈', label: 'Casamento gay', sublabel: 'amor é amor' }, optionB: { emoji: '💍', label: 'Só entre homem e mulher', sublabel: 'tradicional' }, tag: 'política', color: '#FF5252' },
  { question: 'Drogas leves deveriam ser:', optionA: { emoji: '✅', label: 'Legalizadas', sublabel: 'descriminalizar o usuário' }, optionB: { emoji: '❌', label: 'Proibidas', sublabel: 'não normalizar' }, tag: 'política', color: '#F7B731' },
  { question: 'Prostituição:', optionA: { emoji: '✅', label: 'Deveria ser regulamentada', sublabel: 'proteger quem exerce' }, optionB: { emoji: '❌', label: 'Não deveria ser normalizada', sublabel: 'exploração' }, tag: 'política', color: '#00C9A7' },
  { question: 'Você é a favor de:', optionA: { emoji: '🌿', label: 'Descriminalização de drogas', sublabel: 'abordagem de saúde' }, optionB: { emoji: '👮', label: 'Combate policial', sublabel: 'drogas são crime' }, tag: 'política', color: '#6C63FF' },
  { question: 'Feminismo hoje:', optionA: { emoji: '✊', label: 'É necessário e urgente', sublabel: 'desigualdade existe' }, optionB: { emoji: '🤔', label: 'Foi longe demais', sublabel: 'perdeu o foco' }, tag: 'política', color: '#FF6B35' },
  { question: 'Machismo no Brasil:', optionA: { emoji: '😡', label: 'É gravíssimo', sublabel: 'precisa mudar urgente' }, optionB: { emoji: '🤷', label: 'É exagerado', sublabel: 'melhorou muito' }, tag: 'política', color: '#FF4E8C' },
  { question: 'Religião na política:', optionA: { emoji: '⛪', label: 'Tem espaço legítimo', sublabel: 'representa muitos' }, optionB: { emoji: '🚫', label: 'Deve ser separada', sublabel: 'Estado laico' }, tag: 'política', color: '#7C4DFF' },
  { question: 'Racismo no Brasil:', optionA: { emoji: '🔥', label: 'É estrutural e grave', sublabel: 'herança da escravidão' }, optionB: { emoji: '🤝', label: 'Está melhorando', sublabel: 'sociedade avança' }, tag: 'política', color: '#FF5252' },
  { question: 'Você se considera:', optionA: { emoji: '🟡', label: 'Conservador', sublabel: 'valores tradicionais' }, optionB: { emoji: '🔵', label: 'Progressista', sublabel: 'mudança social' }, tag: 'política', color: '#F7B731' },
  { question: 'Desmatamento da Amazônia:', optionA: { emoji: '🌿', label: 'Crime inaceitável', sublabel: 'pulmão do mundo' }, optionB: { emoji: '🌾', label: 'Desenvolvimento necessário', sublabel: 'agronegócio' }, tag: 'política', color: '#00C9A7' },

  // ==================== MAIS ESPORTES ====================
  { question: 'Olympics ou Copa do Mundo?', optionA: { emoji: '🏅', label: 'Olimpíadas', sublabel: 'múltiplos esportes' }, optionB: { emoji: '⚽', label: 'Copa do Mundo', sublabel: 'paixão global' }, tag: 'esporte', color: '#6C63FF' },
  { question: 'Basquete: NBA ou EuroLeague?', optionA: { emoji: '🏀', label: 'NBA', sublabel: 'melhor do mundo' }, optionB: { emoji: '🇪🇺', label: 'EuroLeague', sublabel: 'mais estratégico' }, tag: 'esporte', color: '#FF6B35' },
  { question: 'Maior lutador brasileiro:', optionA: { emoji: '🥊', label: 'Anderson Silva', sublabel: 'Spider' }, optionB: { emoji: '🦁', label: 'José Aldo', sublabel: 'Cigano' }, tag: 'esporte', color: '#FF4E8C' },
  { question: 'Atletismo ou natação?', optionA: { emoji: '🏃', label: 'Atletismo', sublabel: 'Usain Bolt' }, optionB: { emoji: '🏊', label: 'Natação', sublabel: 'Michael Phelps' }, tag: 'esporte', color: '#7C4DFF' },
  { question: 'eSports é esporte?', optionA: { emoji: '✅', label: 'Sim, com certeza', sublabel: 'competição e habilidade' }, optionB: { emoji: '❌', label: 'Não é esporte', sublabel: 'é jogo apenas' }, tag: 'esporte', color: '#FF5252' },
  { question: 'Ciclismo ou corrida?', optionA: { emoji: '🚴', label: 'Ciclismo', sublabel: 'velocidade e técnica' }, optionB: { emoji: '🏃', label: 'Corrida', sublabel: 'simples e eficaz' }, tag: 'esporte', color: '#F7B731' },
  { question: 'O maior tenista de todos os tempos:', optionA: { emoji: '🎾', label: 'Federer', sublabel: 'elegância e técnica' }, optionB: { emoji: '🎾', label: 'Djokovic', sublabel: 'mais títulos' }, tag: 'esporte', color: '#00C9A7' },

  // ==================== MAIS COMIDA ====================
  { question: 'Melhor comida de rua:', optionA: { emoji: '🌽', label: 'Milho na espiga', sublabel: 'com manteiga' }, optionB: { emoji: '🥪', label: 'X-burguer', sublabel: 'da esquina' }, tag: 'comida', color: '#6C63FF' },
  { question: 'Almoço de domingo:', optionA: { emoji: '🍗', label: 'Frango assado', sublabel: 'com farofa' }, optionB: { emoji: '🍖', label: 'Churrasco', sublabel: 'com a família' }, tag: 'comida', color: '#FF6B35' },
  { question: 'Sorvete favorito:', optionA: { emoji: '🍫', label: 'Chocolate', sublabel: 'o clássico' }, optionB: { emoji: '🍓', label: 'Morango', sublabel: 'frutas' }, tag: 'comida', color: '#FF4E8C' },
  { question: 'Café ou energético?', optionA: { emoji: '☕', label: 'Café puro', sublabel: 'adulto de verdade' }, optionB: { emoji: '⚡', label: 'Red Bull', sublabel: 'quando precisa mesmo' }, tag: 'comida', color: '#7C4DFF' },
  { question: 'Melhor petisco:', optionA: { emoji: '🫒', label: 'Tábua de frios', sublabel: 'chique' }, optionB: { emoji: '🍟', label: 'Batata frita', sublabel: 'comfort food' }, tag: 'comida', color: '#FF5252' },
  { question: 'Pão francês ou pão de queijo?', optionA: { emoji: '🥖', label: 'Pão francês', sublabel: 'SP e RJ' }, optionB: { emoji: '🧀', label: 'Pão de queijo', sublabel: 'MG no coração' }, tag: 'comida', color: '#F7B731' },

  // ==================== DINHEIRO E FINANÇAS ====================
  { question: 'Você pouparia ou investiria?', optionA: { emoji: '🏦', label: 'Poupança', sublabel: 'seguro e fácil' }, optionB: { emoji: '📈', label: 'Ações e fundos', sublabel: 'maior retorno' }, tag: 'estilo de vida', color: '#00C9A7' },
  { question: 'Parcelaria uma viagem?', optionA: { emoji: '✅', label: 'Sim, se precisar', sublabel: 'experiência vale' }, optionB: { emoji: '❌', label: 'Não, prefiro guardar', sublabel: 'sem dívidas' }, tag: 'estilo de vida', color: '#6C63FF' },
  { question: 'Você gastaria R$10.000 em:', optionA: { emoji: '✈️', label: 'Viagem dos sonhos', sublabel: 'experiência' }, optionB: { emoji: '📱', label: 'Eletrônicos e gadgets', sublabel: 'tecnologia' }, tag: 'estilo de vida', color: '#FF6B35' },
  { question: 'Previdência privada:', optionA: { emoji: '✅', label: 'Vale a pena', sublabel: 'complementar' }, optionB: { emoji: '❌', label: 'Prefiro investir só', sublabel: 'mais retorno' }, tag: 'trabalho', color: '#FF4E8C' },
  { question: 'Você daria dinheiro para:', optionA: { emoji: '👪', label: 'Família que precisa', sublabel: 'sem pensar' }, optionB: { emoji: '🤔', label: 'Emprestaria com prazo', sublabel: 'aprendi na vida' }, tag: 'vida', color: '#7C4DFF' },

  // ==================== CELEBRIDADES BR ====================
  { question: 'Melhor apresentador do Brasil:', optionA: { emoji: '🎤', label: 'Luciano Huck', sublabel: 'Domingão' }, optionB: { emoji: '🎙️', label: 'Faustão', sublabel: 'uma era' }, tag: 'entretenimento', color: '#FF5252' },
  { question: 'Melhor humorista brasileiro:', optionA: { emoji: '😂', label: 'Chico Anysio', sublabel: 'clássico' }, optionB: { emoji: '🤣', label: 'Whindersson Nunes', sublabel: 'internet' }, tag: 'entretenimento', color: '#F7B731' },
  { question: 'Anitta ou Ivete Sangalo?', optionA: { emoji: '🎤', label: 'Anitta', sublabel: 'pop global' }, optionB: { emoji: '🎉', label: 'Ivete', sublabel: 'axé rainha' }, tag: 'entretenimento', color: '#00C9A7' },
  { question: 'Melhor ator brasileiro:', optionA: { emoji: '🎬', label: 'Wagner Moura', sublabel: 'Pablo Escobar' }, optionB: { emoji: '🎭', label: 'Rodrigo Santoro', sublabel: 'Hollywood' }, tag: 'entretenimento', color: '#6C63FF' },
  { question: 'Globo ou Record?', optionA: { emoji: '📺', label: 'Globo', sublabel: 'produção técnica' }, optionB: { emoji: '📺', label: 'Record', sublabel: 'Record News' }, tag: 'entretenimento', color: '#FF6B35' },

  // ==================== MAIS POLÊMICAS ====================
  { question: 'Você acredita em vida extraterrestre?', optionA: { emoji: '👽', label: 'Com certeza', sublabel: 'universo é enorme' }, optionB: { emoji: '🌍', label: 'Somos únicos', sublabel: 'não tem prova' }, tag: 'vida', color: '#FF4E8C' },
  { question: 'Escola em casa (homeschooling):', optionA: { emoji: '✅', label: 'É um direito', sublabel: 'família decide' }, optionB: { emoji: '❌', label: 'Prejudica socialização', sublabel: 'escola é importante' }, tag: 'política', color: '#7C4DFF' },
  { question: 'Você acredita que a Terra é:', optionA: { emoji: '🌍', label: 'Redonda (esfera)', sublabel: 'ciência confirmou' }, optionB: { emoji: '🥞', label: 'Plana', sublabel: 'questiono tudo' }, tag: 'vida', color: '#FF5252' },
  { question: 'Conspiração: chegamos à Lua?', optionA: { emoji: '🚀', label: 'Sim, chegamos', sublabel: 'tenho provas' }, optionB: { emoji: '🎬', label: 'Foi filmado em estúdio', sublabel: 'não acredito' }, tag: 'vida', color: '#F7B731' },
  { question: 'Você acredita em:', optionA: { emoji: '👼', label: 'Céu e inferno', sublabel: 'depois da morte' }, optionB: { emoji: '♾️', label: 'Reencarnação', sublabel: 'voltamos' }, tag: 'vida', color: '#00C9A7' },
  { question: 'Horóscopo e signos:', optionA: { emoji: '⭐', label: 'Acredito sim', sublabel: 'influencia personalidade' }, optionB: { emoji: '🙄', label: 'É besteira', sublabel: 'sem base científica' }, tag: 'vida', color: '#6C63FF' },
  { question: 'Você se vacinou contra Covid?', optionA: { emoji: '💉', label: 'Sim, tomei todas', sublabel: 'ciência funciona' }, optionB: { emoji: '❌', label: 'Não tomei', sublabel: 'minha escolha' }, tag: 'política', color: '#FF6B35' },
  { question: 'Mudanças climáticas são:', optionA: { emoji: '🌡️', label: 'A maior crise atual', sublabel: 'ação urgente' }, optionB: { emoji: '🌊', label: 'Exageradas pela mídia', sublabel: 'planeta se adapta' }, tag: 'política', color: '#FF4E8C' },
  { question: 'Você confia mais em:', optionA: { emoji: '📰', label: 'Mídia tradicional', sublabel: 'Globo, Folha...' }, optionB: { emoji: '📱', label: 'Mídia independente', sublabel: 'YouTubers, podcasts' }, tag: 'política', color: '#7C4DFF' },
  { question: 'Fake news é culpa:', optionA: { emoji: '📱', label: 'Das redes sociais', sublabel: 'algorítmo espalha' }, optionB: { emoji: '🧠', label: 'Das pessoas crédulas', sublabel: 'educação resolve' }, tag: 'política', color: '#FF5252' },
];

async function main() {
  await signInAnonymously(auth);
  console.log('🔐 Autenticado!');

  const existing = await getDocs(collection(db, 'polls'));
  console.log(`📊 Enquetes existentes: ${existing.size}`);

  let count = 0;
  const batch = [];

  for (let i = 0; i < POLLS.length; i++) {
    const p = POLLS[i];
    const vA = Math.floor(Math.random() * 5000) + 100;
    const vB = Math.floor(Math.random() * 5000) + 100;
    batch.push(
      addDoc(collection(db, 'polls'), {
        ...p,
        votesA: vA,
        votesB: vB,
        totalVotes: vA + vB,
        cities: {},
        order: existing.size + i,
        createdBy: 'system',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      })
    );

    if (batch.length >= 10) {
      await Promise.all(batch.splice(0, 10));
      count += 10;
      process.stdout.write(`\r📝 Inseridas: ${count}/${POLLS.length}`);
    }
  }

  if (batch.length > 0) {
    await Promise.all(batch);
    count += batch.length;
  }

  console.log(`\n✅ Concluído! ${count} enquetes inseridas.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
