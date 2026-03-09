// add-slugs.js — adiciona slugs a todas as enquetes existentes
// rodar com: node add-slugs.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAts2gnUCTGn6JNYm3p6bSloKIbqp6vhsI",
  authDomain: "votaai-9b91d.firebaseapp.com",
  projectId: "votaai-9b91d",
  storageBucket: "votaai-9b91d.firebasestorage.app",
  messagingSenderId: "397158117689",
  appId: "1:397158117689:web:9caba03f7a21e97721f8e8",
};

function generateSlug(question, id) {
  const base = question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  // Usa os últimos 5 chars do ID para garantir unicidade
  return base + '-' + id.slice(-5);
}

async function run() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  await signInAnonymously(auth);

  const snap = await getDocs(collection(db, 'polls'));
  const withoutSlug = snap.docs.filter(d => !d.data().slug);

  console.log(`Total de enquetes: ${snap.size}`);
  console.log(`Sem slug: ${withoutSlug.length}`);

  let count = 0;
  for (const d of withoutSlug) {
    const slug = generateSlug(d.data().question, d.id);
    await updateDoc(doc(db, 'polls', d.id), { slug });
    count++;
    if (count % 20 === 0) console.log(`${count}/${withoutSlug.length}...`);
  }

  console.log(`✅ ${count} enquetes atualizadas com slug!`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
