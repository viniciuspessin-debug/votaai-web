const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'votaai-9b91d',
});

const db = admin.firestore();

async function clearMembers() {
  console.log('🗑️ Deletando coleção members...');
  const snap = await db.collection('members').get();
  
  if (snap.empty) {
    console.log('✅ Coleção já está vazia!');
    process.exit(0);
  }

  await Promise.all(snap.docs.map(d => d.ref.delete()));
  console.log(`✅ ${snap.size} documentos deletados!`);
  process.exit(0);
}

clearMembers().catch(e => { console.error('❌ Erro:', e); process.exit(1); });
