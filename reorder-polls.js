// reorder-polls.js — reordena enquetes por polêmica
// node reorder-polls.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, orderBy, query } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const app = initializeApp({
  apiKey: 'AIzaSyAts2gnUCTGn6JNYm3p6bSloKIbqp6vhsI',
  authDomain: 'votaai-9b91d.firebaseapp.com',
  projectId: 'votaai-9b91d',
});
const db = getFirestore(app);
const auth = getAuth(app);

// Score de polêmica por tag e palavras-chave
function controversyScore(poll) {
  let score = 0;
  const q = (poll.question || '').toLowerCase();
  const lA = (poll.optionA?.label || '').toLowerCase();
  const lB = (poll.optionB?.label || '').toLowerCase();
  const text = q + ' ' + lA + ' ' + lB;

  // Tags mais polêmicas ganham mais pontos
  const tagScores = {
    'política': 100,
    'esporte': 80,
    'entretenimento': 70,
    'vida': 60,
    'trabalho': 55,
    'tecnologia': 50,
    'estilo de vida': 45,
    'comida': 40,
    'rotina': 30,
    'superpoderes': 20,
    'outro': 10,
  };
  score += tagScores[poll.tag] || 10;

  // Palavras ultra-polêmicas
  const hotWords = [
    'lula', 'bolsonaro', 'aborto', 'arma', 'pena de morte', 'maconha', 'droga',
    'racismo', 'feminismo', 'gay', 'lgbtq', 'religião', 'deus', 'vacina', 'stf',
    'corrupção', 'ditadura', 'golpe', 'voto', 'eleição', 'imposto', 'socialismo',
    'capitalismo', 'cotas', 'maioridade penal', 'aborto', 'prostituição',
    'amazônia', 'desmatamento', 'traição', 'inferno', 'bíblia', 'terraplana',
  ];
  hotWords.forEach(w => { if (text.includes(w)) score += 80; });

  // Palavras quentes
  const warmWords = [
    'flamengo', 'corinthians', 'palmeiras', 'neymar', 'messi', 'ronaldo',
    'iphone', 'android', 'trabalho remoto', 'home office', 'faculdade',
    'salário', 'casamento', 'filhos', 'traição', 'mentira', 'cirurgia',
    'funk', 'sertanejo', 'carnaval', 'bbb', 'influencer',
  ];
  warmWords.forEach(w => { if (text.includes(w)) score += 40; });

  // Enquetes com votos muito divididos (50/50) são mais polêmicas
  const total = poll.totalVotes || 1;
  const pctA = (poll.votesA || 0) / total;
  const balance = 1 - Math.abs(pctA - 0.5) * 2; // 1 = 50/50, 0 = 100/0
  score += balance * 50;

  // Mais votos = mais engajamento = mais relevante
  score += Math.min(Math.log(total + 1) * 10, 50);

  // Enquetes fixadas sempre no topo
  if (poll.pinned) score += 10000;

  return score;
}

async function main() {
  await signInAnonymously(auth);
  console.log('🔐 Autenticado!');

  const snap = await getDocs(query(collection(db, 'polls'), orderBy('createdAt', 'desc')));
  const polls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`📊 Total de enquetes: ${polls.length}`);

  // Ordena por score de polêmica
  const sorted = [...polls].sort((a, b) => controversyScore(b) - controversyScore(a));

  console.log('\n🔥 Top 10 mais polêmicas:');
  sorted.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i+1}. [${controversyScore(p).toFixed(0)}pts] ${p.question} — ${p.optionA?.label} vs ${p.optionB?.label}`);
  });

  console.log('\n⏳ Salvando nova ordem...');
  
  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    await updateDoc(doc(db, 'polls', sorted[i].id), { order: i });
    count++;
    process.stdout.write(`\r✏️  ${count}/${sorted.length}`);
  }

  console.log(`\n✅ Pronto! ${sorted.length} enquetes reordenadas.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
