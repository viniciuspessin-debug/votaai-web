const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seed() {
  // Gera votos realistas com leve maioria no Sim
  const votesA = Math.floor(Math.random() * 800) + 3200; // Sim: 3200-4000
  const votesB = Math.floor(Math.random() * 600) + 2400; // Não: 2400-3000
  const total = votesA + votesB;

  const slug = 'red-pill-violencia-contra-mulher-rj-' + Math.random().toString(36).slice(2, 7);

  const poll = {
    question: 'O movimento red pill influencia jovens a condutas violentas contra a mulher como ocorrido no RJ?',
    optionA: { emoji: '✅', label: 'Sim, influencia' },
    optionB: { emoji: '❌', label: 'Não influencia' },
    tag: 'vida',
    color: '#FF4E8C',
    votesA,
    votesB,
    totalVotes: total,
    createdBy: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    slug,
    hotOfDay: true,
    order: 0,
  };

  // Remove hotOfDay de outras enquetes
  const snap = await db.collection('polls').where('hotOfDay', '==', true).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { hotOfDay: false }));
  await batch.commit();

  // Cria a nova polêmica
  const ref = await db.collection('polls').add(poll);
  console.log(`✅ Polêmica criada! ID: ${ref.id}`);
  console.log(`   Votos Sim: ${votesA} | Votos Não: ${votesB} | Total: ${total}`);
  console.log(`   Slug: ${slug}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
