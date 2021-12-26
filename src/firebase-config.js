
const config = {
  apiKey: "AIzaSyD7I-p4ka_gNeHMby1vLhBA0uLSUsAbv64",
  authDomain: "friendlychat-b2db5.firebaseapp.com",
  databaseURL: "https://friendlychat-b2db5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "friendlychat-b2db5",
  storageBucket: "friendlychat-b2db5.appspot.com",
  messagingSenderId: "188498649015",
  appId: "1:188498649015:web:90ecf6a20ad776bfc21232"
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error('No Firebase configuration object provided.' + '\n' +
    'Add your web app\'s configuration object to firebase-config.js');
  } else {
    return config;
  }
}