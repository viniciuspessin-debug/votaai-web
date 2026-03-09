const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'votaai-9b91d',
});

const db = admin.firestore();
const auth = admin.auth();

async function clearAnonMembers() {
  const snap = await db.collection('members').get();
  let deleted = 0;

  await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    // Delete if no email
    if (!data.email) {
      await d.ref.delete();
      console.log(`🗑️ Removido anônimo: ${d.id}`);
      deleted++;
    }
  }));

  console.log(`\n✅ ${deleted} anônimos removidos! ${snap.size - deleted} membros reais mantidos.`);
  process.exit(0);
}

clearAnonMembers().catch(e => { console.error('❌', e); process.exit(1); });
