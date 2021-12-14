/**
 * To find your Firebase config object:
 * 
 * 1. Go to your [Project settings in the Firebase console](https://console.firebase.google.com/project/_/settings/general/)
 * 2. In the "Your apps" card, select the nickname of the app for which you need a config object.
 * 3. Select Config from the Firebase SDK snippet pane.
 * 4. Copy the config object snippet, then add it here.
 */
const config = {
  /* TODO: ADD YOUR FIREBASE CONFIGURATION OBJECT HERE */
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