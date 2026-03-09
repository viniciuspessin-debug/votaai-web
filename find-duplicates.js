const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'votaai-9b91d',
});

const db = admin.firestore();

async function findDuplicates() {
  const snap = await db.collection('polls').get();
  const polls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Group by question
  const groups = {};
  polls.forEach(p => {
    const key = p.question?.trim().toLowerCase();
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const duplicates = Object.entries(groups).filter(([, group]) => group.length > 1);
  
  console.log(`\n📋 ${polls.length} enquetes no total`);
  console.log(`⚠️  ${duplicates.length} grupos com duplicadas:\n`);
  
  duplicates.forEach(([question, group]) => {
    console.log(`"${question}"`);
    group.forEach(p => console.log(`  → id: ${p.id} | votos: ${p.totalVotes || 0}`));
    console.log('');
  });

  process.exit(0);
}

findDuplicates().catch(e => { console.error('❌', e); process.exit(1); });
