// firebase-config.js
// Firebase configuration for the project
const firebaseConfig = {
  apiKey: "AIzaSyB83l-KO_EmbxO1JOF84tOi2JDo8WWW2BA",
  authDomain: "markindia-b758a.firebaseapp.com",
  projectId: "markindia-b758a",
  storageBucket: "markindia-b758a.appspot.com",
  messagingSenderId: "304348482528",
  appId: "1:304348482528:web:52644a6b25d8c4b1e17985"
};

// Initialize Firebase using the compat SDK
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const storage = firebase.storage();

  // Expose globally for script.js
  window.auth = auth;
  window.firebase = firebase;
  window.storage = storage;
}

