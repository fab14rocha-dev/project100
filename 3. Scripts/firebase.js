// firebase.js — Firebase setup and Firestore submission
// firebaseConfig comes from firebase-config.js, loaded before this script

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentSessionId = null;

async function saveSubmission(data) {
  const docRef = await db.collection('ai-business-leads').add(data);
  return docRef.id;
}

async function startSession() {
  const docRef = await db.collection('ai-business-sessions').add({
    startedAt:   new Date().toISOString(),
    lastStep:    1,
    completed:   false
  });
  currentSessionId = docRef.id;
}

function updateSession(step, extraData = {}) {
  if (!currentSessionId) return;
  db.collection('ai-business-sessions').doc(currentSessionId).update({
    lastStep:    step,
    lastUpdated: new Date().toISOString(),
    ...extraData
  });
}

function completeSession() {
  if (!currentSessionId) return;
  db.collection('ai-business-sessions').doc(currentSessionId).update({
    completed:   true,
    completedAt: new Date().toISOString()
  });
}
