const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'votaai-9b91d',
});

const db = admin.firestore();

async function deleteDuplicates() {
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
  let deleted = 0;

  for (const [question, group] of duplicates) {
    // Keep the one with most votes, delete the rest
    const sorted = group.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    const keep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`✅ Mantendo: "${question}" (${keep.totalVotes || 0} votos)`);
    for (const p of toDelete) {
      await db.collection('polls').doc(p.id).delete();
      console.log(`  🗑️  Deletado: ${p.id} (${p.totalVotes || 0} votos)`);
      deleted++;
    }
  }

  console.log(`\n🎉 ${deleted} duplicadas deletadas!`);
  process.exit(0);
}

deleteDuplicates().catch(e => { console.error('❌', e); process.exit(1); });
