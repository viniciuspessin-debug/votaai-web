// add-vorcaro-poll.js — rodar com: node add-vorcaro-poll.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, orderBy } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAts2gnUCTGn6JNYm3p6bSloKIbqp6vhsI",
  authDomain: "votaai-9b91d.firebaseapp.com",
  projectId: "votaai-9b91d",
  storageBucket: "votaai-9b91d.firebasestorage.app",
  messagingSenderId: "397158117689",
  appId: "1:397158117689:web:9caba03f7a21e97721f8e8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  await signInAnonymously(auth);

  // Remove hotOfDay de todas as outras enquetes
  console.log('Removendo Polêmica do Dia anterior...');
  const snap = await getDocs(collection(db, 'polls'));
  const removePromises = snap.docs
    .filter(d => d.data().hotOfDay)
    .map(d => updateDoc(doc(db, 'polls', d.id), { hotOfDay: false }));
  await Promise.all(removePromises);
  console.log(`${removePromises.length} enquetes atualizadas.`);

  // Pega o menor order atual para colocar no topo
  const allDocs = snap.docs.map(d => d.data().order ?? 9999);
  const minOrder = Math.min(...allDocs);

  // Votos inflados
  const vA = Math.floor(Math.random() * 5000) + 100;
  const vB = Math.floor(Math.random() * 5000) + 100;

  // Cria a enquete
  console.log('Criando enquete do Vorcaro...');
  const docRef = await addDoc(collection(db, 'polls'), {
    question: 'Vorcaro é bandido ou bode expiatório?',
    optionA: {
      emoji: '🦹',
      label: 'Bandido',
      sublabel: 'roubou dinheiro do povo',
    },
    optionB: {
      emoji: '🐐',
      label: 'Bode expiatório',
      sublabel: 'perseguição política',
    },
    tag: 'política',
    color: '#FF5252',
    votesA: vA,
    votesB: vB,
    totalVotes: vA + vB,
    createdBy: 'admin',
    createdAt: serverTimestamp(),
    hotOfDay: true,
    pinned: true,
    order: minOrder - 1,
  });

  console.log(`✅ Enquete criada! ID: ${docRef.id}`);
  console.log('🔥 Polêmica do Dia definida!');
  console.log('📌 Fixada no topo do feed!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
