const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'votaai-9b91d',
});

const db = admin.firestore();
const auth = admin.auth();

async function backfillMembers() {
  console.log('🔍 Buscando usuários...');
  let nextPageToken;
  let total = 0;
  let skipped = 0;

  do {
    const result = await auth.listUsers(1000, nextPageToken);

    await Promise.all(result.users.map(async user => {
      // Pula anônimos (sem email e sem provedor)
      if (!user.email) { skipped++; return; }

      await db.collection('members').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        provider: user.providerData[0]?.providerId || 'password',
        joinedAt: user.metadata.creationTime || null,
        lastLogin: user.metadata.lastSignInTime || null,
      }, { merge: true });

      console.log(`✅ ${user.email}`);
      total++;
    }));

    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`\n🎉 ${total} membros importados! (${skipped} anônimos ignorados)`);
  process.exit(0);
}

backfillMembers().catch(e => { console.error('❌ Erro:', e); process.exit(1); });
