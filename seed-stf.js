const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  console.log('Conectando ao Firestore...');
  
  const total = Math.floor(Math.random() * 2000) + 7000;
  const votesA = Math.round(total * 0.43);
  const votesB = total - votesA;

  const poll = {
    question: 'A crise institucional no STF ⚖️ abre caminho para anulação do julgamento do ex-presidente Jair Bolsonaro 🇧🇷?',
    optionA: {
      emoji: '✅',
      label: 'Sim, abre caminho',
      sublabel: 'A crise enfraquece a legitimidade das decisões do tribunal',
    },
    optionB: {
      emoji: '❌',
      label: 'Não, decisão é definitiva',
      sublabel: 'Crises institucionais não invalidam julgamentos já concluídos',
    },
    tag: 'política',
    color: '#6C63FF',
    votesA,
    votesB,
    totalVotes: total,
    createdBy: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    pinned: false,
    hotOfDay: false,
    slug: 'crise-stf-bolsonaro-' + Math.random().toString(36).substr(2, 5),
    order: 0,
  };

  console.log('Inserindo enquete...');
  const ref = await db.collection('polls').add(poll);
  console.log(`✅ Enquete criada! ID: ${ref.id}`);
  console.log(`✅ Sim: ${votesA} votos (43%)`);
  console.log(`❌ Não: ${votesB} votos (57%)`);
  console.log(`Total: ${total} votos`);
  console.log(`\n👉 Acesse o admin e marque como Fixada + Polêmica do Dia!`);
  
  await admin.app().delete();
  process.exit(0);
}

const timeout = setTimeout(() => {
  console.error('❌ Timeout — verifique sua conexão ou as credenciais do serviceAccountKey.json');
  process.exit(1);
}, 15000);

main().catch(err => {
  clearTimeout(timeout);
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
