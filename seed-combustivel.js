const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  const votesA = Math.floor(Math.random() * 800) + 3200; // 3200-4000 (sim ~56%)
  const votesB = Math.floor(Math.random() * 600) + 2400; // 2400-3000 (não ~44%)
  const total = votesA + votesB;

  const poll = {
    question: 'Vender a BR Distribuidora foi um erro que nos deixou reféns dos preços hoje?',
    optionA: {
      emoji: '⛽',
      label: 'Sim, erro grave!',
      sublabel: 'Sem controle estatal, ficamos vulneráveis a qualquer crise internacional',
    },
    optionB: {
      emoji: '🏦',
      label: 'Não, mercado decide',
      sublabel: 'Privatização trouxe eficiência e o problema é a política de preços da Petrobras',
    },
    tag: 'política',
    color: '#FF6B35',
    votesA,
    votesB,
    totalVotes: total,
    createdBy: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    pinned: false,
    hotOfDay: false,
  };

  const ref = await db.collection('polls').add(poll);
  console.log(`✅ Enquete criada! ID: ${ref.id}`);
  console.log(`⛽ Sim: ${votesA} votos (${Math.round(votesA/total*100)}%)`);
  console.log(`🏦 Não: ${votesB} votos (${Math.round(votesB/total*100)}%)`);
  console.log(`\n👉 Agora acesse o admin e marque como Fixada + Polêmica do Dia!`);
  process.exit(0);
}

main().catch(console.error);
