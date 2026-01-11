// public/firebase.js (GLOBAL Firebase)

const firebaseConfig = {
  apiKey: "REPLACED_BY_SECRET",
  authDomain: "markindia-b758a.firebaseapp.com",
  projectId: "markindia-b758a",
  storageBucket: "markindia-b758a.appspot.com",
  messagingSenderId: "304348482528",
  appId: "1:304348482528:web:52644a6b25d8c4b1e17985"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  // Make auth global
  window.auth = firebase.auth();
}
