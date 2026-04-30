// firebase.js — Firebase setup and Firestore submission
// Get your config from: Firebase Console → Project Settings → Your apps → SDK setup and config

const firebaseConfig = {
  apiKey:            "AIzaSyCMDs9nE7WmwR8ZKVhlJ3K8AvjzK99P7V0",
  authDomain:        "ai-project-74ae8.firebaseapp.com",
  projectId:         "ai-project-74ae8",
  storageBucket:     "ai-project-74ae8.firebasestorage.app",
  messagingSenderId: "1082716823633",
  appId:             "1:1082716823633:web:73c127a01e108604861870",
  measurementId:     "G-6D01FZTZ0R"
};

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
