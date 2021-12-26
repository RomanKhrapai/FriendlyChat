
import {getAuth, onAuthStateChanged, GoogleAuthProvider,
     signInWithPopup, signOut,} from 'firebase/auth';
  import { getMessaging, getToken, onMessage } from 'firebase/messaging';
  import {getFirestore, setDoc, doc,} from 'firebase/firestore';
  import {elementRef} from "./elementRef";
  import {addSizeToGoogleProfilePic} from "./shiftData";

export async function signIn() {
    var provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
  }
 
  export function signOutUser() {
    signOut(getAuth());
  }

  export function initFirebaseAuth() {
  onAuthStateChanged(getAuth(), authStateObserver);
}

  export function getProfilePicUrl() {
    return getAuth().currentUser.photoURL || '../images/profile_placeholder.png';
  }

  export function getUserName() {
    return getAuth().currentUser.displayName;
  }

  export function isUserSignedIn() {
  return getAuth().currentUser.displayName;
}

function authStateObserver(user) { 
    if (user) { 
      var profilePicUrl = getProfilePicUrl();
      var userName = getUserName();
      elementRef.userPicElement.style.backgroundImage =
        'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
        elementRef.userNameElement.textContent = userName;
  
      // Show user's profile and sign-out button.
      elementRef.userNameElement.removeAttribute('hidden');
      elementRef.userPicElement.removeAttribute('hidden');
      elementRef.signOutButtonElement.removeAttribute('hidden');
  
      // Hide sign-in button.
      elementRef.signInButtonElement.setAttribute('hidden', 'true');
  
      // We save the Firebase Messaging Device token and enable notifications.     
      saveMessagingDeviceToken();
    } else {
      // User is signed out!
      // Hide user's profile and sign-out button.
      elementRef.userNameElement.setAttribute('hidden', 'true');
      elementRef.userPicElement.setAttribute('hidden', 'true');
      elementRef.signOutButtonElement.setAttribute('hidden', 'true');
  
      // Show sign-in button.
      elementRef.signInButtonElement.removeAttribute('hidden');
    }
  }
  // Saves the messaging device token to Cloud Firestore.
async function saveMessagingDeviceToken() {
    try {
      const currentToken = await getToken(getMessaging());
      if (currentToken) {
       // console.log('Got FCM device token:', currentToken);
        // Saving the Device Token to Cloud Firestore.
        const tokenRef = doc(getFirestore(), 'fcmTokens', currentToken);
        await setDoc(tokenRef, { uid: getAuth().currentUser.uid });
  
        // This will fire when a message is received while the app is in the foreground.
        // When the app is in the background, firebase-messaging-sw.js will receive the message instead.
        onMessage(getMessaging(), (message) => {
          console.log(
            'New foreground notification from Firebase Messaging!',
            message.notification
          );
        });
      } else {
        // Need to request permissions to show notifications.
        requestNotificationsPermissions();
      }
    } catch(error) {
      console.error('Unable to get messaging token.', error);
    };
  }
  
  // Requests permissions to show notifications.
  async function requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // Notification permission granted.
      await saveMessagingDeviceToken();
    } else {
      console.log('Unable to get permission to notify.');
    }
  }
