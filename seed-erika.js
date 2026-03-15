const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  console.log('Conectando...');

  const total = Math.floor(Math.random() * 2000) + 6000; // 6000-8000
  const votesA = Math.round(total * 0.54); // 54% avanço
  const votesB = total - votesA;             // 46% ativismo

  const slug = 'erika-hilton-comissao-mulher-' + Math.random().toString(36).substr(2, 5);

  const poll = {
    question: 'Érika Hilton na Comissão da Mulher é avanço institucional ou ativismo excessivo?',
    optionA: {
      emoji: '✅',
      label: 'Avanço institucional',
      sublabel: 'Atualiza a representação dentro do espaço público',
    },
    optionB: {
      emoji: '❌',
      label: 'Ativismo excessivo',
      sublabel: 'Para críticos, a nomeação carrega mais símbolo que função',
    },
    tag: 'política',
    color: '#FF4E8C',
    votesA,
    votesB,
    totalVotes: total,
    createdBy: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    pinned: false,
    hotOfDay: false,
    slug,
    order: 0,
  };

  const ref = await db.collection('polls').add(poll);
  console.log(`✅ Enquete criada! ID: ${ref.id}`);
  console.log(`✅ Avanço: ${votesA} votos (${Math.round(votesA/total*100)}%)`);
  console.log(`❌ Ativismo: ${votesB} votos (${Math.round(votesB/total*100)}%)`);
  console.log(`Total: ${total} votos`);
  console.log(`\n👉 Acesse o admin e marque como Polêmica do Dia!`);

  await admin.app().delete();
  process.exit(0);
}

const timeout = setTimeout(() => {
  console.error('❌ Timeout — problema de conexão com Firebase');
  process.exit(1);
}, 15000);

main().catch(err => {
  clearTimeout(timeout);
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
