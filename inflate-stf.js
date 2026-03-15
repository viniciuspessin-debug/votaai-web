const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  console.log('Conectando...');
  
  const pollId = 'gR8wEW4jsZTWmeqIDy9s';
  const ref = db.collection('polls').doc(pollId);
  
  const snap = await ref.get();
  if (!snap.exists) {
    console.error('❌ Enquete não encontrada!');
    process.exit(1);
  }

  const data = snap.data();
  const currentA = data.votesA || 0;
  const currentB = data.votesB || 0;
  const currentTotal = data.totalVotes || 0;
  
  console.log(`Votos atuais: A=${currentA} B=${currentB} Total=${currentTotal}`);

  // Adicionar votos para chegar em ~43% sim / 57% não
  const addTotal = Math.floor(Math.random() * 2000) + 6000; // +6000-8000
  const addA = Math.round(addTotal * 0.43);
  const addB = addTotal - addA;

  const newA = currentA + addA;
  const newB = currentB + addB;
  const newTotal = currentTotal + addTotal;

  await ref.update({
    votesA: newA,
    votesB: newB,
    totalVotes: newTotal,
  });

  console.log(`✅ Votos inflados!`);
  console.log(`✅ Sim: ${newA} votos (${Math.round(newA/newTotal*100)}%)`);
  console.log(`❌ Não: ${newB} votos (${Math.round(newB/newTotal*100)}%)`);
  console.log(`Total: ${newTotal} votos`);

  await admin.app().delete();
  process.exit(0);
}

const timeout = setTimeout(() => {
  console.error('❌ Timeout');
  process.exit(1);
}, 15000);

main().catch(err => {
  clearTimeout(timeout);
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
