import {
  collection, doc, getDocs, addDoc, updateDoc,
  increment, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from './firebase';

export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser!;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function subscribeToPolls(callback: (polls: any[]) => void) {
  const q = query(collection(db, 'polls'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function getUserVotes(userId: string) {
  const snap = await getDocs(collection(db, `users/${userId}/votes`));
  const votes: Record<string, string> = {};
  snap.forEach(d => { votes[d.id] = d.data().choice; });
  return votes;
}

export async function castVote(pollId: string, choice: string, userId: string, city?: string) {
  await setDoc(doc(db, `users/${userId}/votes/${pollId}`), {
    choice, votedAt: serverTimestamp(), city: city || null,
  });
  const field = choice === 'A' ? 'votesA' : 'votesB';
  const cityField = city ? `cities.${city}.${choice === 'A' ? 'votesA' : 'votesB'}` : null;
  const update: any = { [field]: increment(1), totalVotes: increment(1) };
  if (cityField) update[cityField] = increment(1);
  await updateDoc(doc(db, 'polls', pollId), update);
}

export async function createPoll({ question, optionA, optionB, tag, color, userId }: any) {
  return addDoc(collection(db, 'polls'), {
    question, optionA, optionB, tag, color,
    votesA: 0, votesB: 0, totalVotes: 0,
    cities: {},
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
}

export async function seedPolls() {
  const existing = await getDocs(collection(db, 'polls'));
  if (!existing.empty) return;
  const polls = [
    { question: 'Você preferiria:', optionA: { emoji: '🍕', label: 'Pizza todo dia', sublabel: 'sem exceção' }, optionB: { emoji: '🍔', label: 'Hambúrguer todo dia', sublabel: 'sem exceção' }, tag: 'comida', color: '#FF6B35', votesA: 6312, votesB: 3841 },
    { question: 'Você aceitaria:', optionA: { emoji: '💰', label: 'R$1 milhão agora', sublabel: 'mas sem voltar no tempo' }, optionB: { emoji: '🕐', label: 'Voltar aos 18', sublabel: 'sem dinheiro' }, tag: 'vida', color: '#6C63FF', votesA: 4521, votesB: 7893 },
    { question: 'Quem é maior?', optionA: { emoji: '🐐', label: 'Messi', sublabel: 'Argentina' }, optionB: { emoji: '🔴', label: 'Cristiano Ronaldo', sublabel: 'Portugal' }, tag: 'esporte', color: '#00C9A7', votesA: 14230, votesB: 12891 },
    { question: 'Onde você moraria?', optionA: { emoji: '🏝️', label: 'Na praia', sublabel: 'calor e areia' }, optionB: { emoji: '🏔️', label: 'Na montanha', sublabel: 'frio e natureza' }, tag: 'estilo de vida', color: '#FF4E8C', votesA: 8943, votesB: 5612 },
    { question: 'Você prefere:', optionA: { emoji: '🌙', label: 'Ser coruja', sublabel: 'dormir tarde' }, optionB: { emoji: '☀️', label: 'Ser madrugador', sublabel: 'acordar cedo' }, tag: 'rotina', color: '#F7B731', votesA: 9871, votesB: 4320 },
    { question: 'Se pudesse escolher:', optionA: { emoji: '🦸', label: 'Voar', sublabel: 'sem limites' }, optionB: { emoji: '🧠', label: 'Ler mentes', sublabel: 'de qualquer pessoa' }, tag: 'superpoderes', color: '#FF5252', votesA: 11203, votesB: 9874 },
  ];
  for (const p of polls) {
    await addDoc(collection(db, 'polls'), {
      ...p, totalVotes: p.votesA + p.votesB, cities: {},
      createdBy: 'system', createdAt: serverTimestamp(),
    });
  }
}
