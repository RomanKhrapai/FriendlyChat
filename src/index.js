
'use strict';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc, 
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { getPerformance } from 'firebase/performance';
import { getFirebaseConfig } from './firebase-config.js';
import { signIn,signOutUser,initFirebaseAuth, getProfilePicUrl,
  getUserName,isUserSignedIn} from "./js/auth";
import {elementRef} from "./js/elementRef";
import {addSizeToGoogleProfilePic} from "./js/shiftData";


// Saves a new message on the Cloud Firestore.
async function saveMessage(messageText) {
  try {
    await addDoc(collection(getFirestore(), 'messages'), {
      name: getUserName(),
      text: messageText,
      profilePicUrl: getProfilePicUrl(),
      timestamp: serverTimestamp()
    });
  }
  catch(error) {
    console.error('Error writing new message to Firebase Database', error);
  }
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  const recentMessagesQuery = query(collection(getFirestore(), 'messages'), orderBy('timestamp', 'desc'), limit(12));
  
  // Start listening to the query.
  onSnapshot(recentMessagesQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        var message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
                      message.text, message.profilePicUrl, message.imageUrl,message.fileUrl,message.fileName);
      }
    });
  });
}


async function saveImageMessage(file) {
  try {
    const messageRef = await addDoc(collection(getFirestore(), 'messages'), {
      name: getUserName(),
      imageUrl: LOADING_IMAGE_URL,
      profilePicUrl: getProfilePicUrl(),
      timestamp: serverTimestamp()
    });

    const filePath = `${getAuth().currentUser.uid}/${messageRef.id}/${file.name}`;
    const newImageRef = ref(getStorage(), filePath);
    const fileSnapshot = await uploadBytesResumable(newImageRef, file);
    
    const publicImageUrl = await getDownloadURL(newImageRef);

    await updateDoc(messageRef,{
      imageUrl: publicImageUrl,
      storageUri: fileSnapshot.metadata.fullPath
    });
  } catch (error) {
    console.error('There was an error uploading a image to Cloud Storage:', error);
  }
}

async function savefileMessage(file) {
 
  try {
    const messageRef = await addDoc(collection(getFirestore(), 'messages'), {
      name: getUserName(),
      imageUrl: LOADING_FILE_URL,
      profilePicUrl: getProfilePicUrl(),
      timestamp: serverTimestamp()
    });
    
    const filePath = `${getAuth().currentUser.uid}/${messageRef.id}/${file.name}`;
    const newFileRef = ref(getStorage(), filePath);
    const fileSnapshot = await uploadBytesResumable(newFileRef, file);
    
    const publicFileUrl = await getDownloadURL(newFileRef);
    
    await updateDoc(messageRef,{
      fileName:file.name,
      fileUrl: publicFileUrl,
      storageUri: fileSnapshot.metadata.fullPath
    });
  } catch (error) {
    console.error('There was an error uploading a file to Cloud Storage:', error);
  }
}

// Triggered when a file is selected via the media picker.
function onMediaFileSelected(event) {
  event.preventDefault();

  let file = null;
  if(event.type==='drop'){
file = event.dataTransfer.files[0];
  }else{
    file = event.target.files[0];
  }

  // Clear the selection in the file picker input.
  elementRef.imageFormElement.reset();
 
  // if (!file.type.match('image.*')) {
  //   var data = {
  //     message: 'You can only share images',
  //     timeout: 2000,
  //   };
  //   signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  //   return;
  // }

  if (checkSignedInWithMessage()&&file.type.match('image.*')) {
    saveImageMessage(file);
  }else{
    savefileMessage(file);
  }
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (elementRef.messageInputElement.value.trim() && checkSignedInWithMessage()) {
    saveMessage(elementRef.messageInputElement.value).then(function () {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(elementRef.messageInputElement);
      toggleButton();
    });
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000,
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';
var LOADING_FILE_URL = 'https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png?a'

// Delete a Message from the UI.
function deleteMessage(id) {
  var div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}

function createAndInsertMessage(id, timestamp) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const div = container.firstChild;
  div.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = elementRef.messageListElement.children;
  if (existingMessages.length === 0) {
    elementRef.messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      const messageListNodeTime = messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
          `Child ${messageListNode.id} has no 'timestamp' attribute`
        );
      }

      if (messageListNodeTime > timestamp) {
        break;
      }

      messageListNode = messageListNode.nextSibling;
    }

    elementRef.messageListElement.insertBefore(div, messageListNode);
  }

  return div;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, imageUrl,fileUrl,fileName) {
  var div =
    document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }

  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');

  if (text) {
    // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if(fileUrl){ 
    const file = `
    
    ${fileName}
    `;
    var image = document.createElement('img');
    image.addEventListener('load', function () {
      elementRef.messageListElement.scrollTop = elementRef.messageListElement.scrollHeight;
    });
    image.src = imageUrl;
    messageElement.innerHTML = '';
    const textP = document.createElement('p');
     textP.textContent = fileName;
    // messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    messageElement.append(image,textP);
  }else if (imageUrl) {
    // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function () {
      elementRef.messageListElement.scrollTop = elementRef.messageListElement.scrollHeight;
    });
    image.src = imageUrl + '&' + new Date().getTime();
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  } 
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function () {
    div.classList.add('visible');
  }, 1);
  elementRef.messageListElement.scrollTop = elementRef.messageListElement.scrollHeight;
  elementRef.messageInputElement.focus();
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  if (elementRef.messageInputElement.value) {
    elementRef.submitButtonElement.removeAttribute('disabled');
  } else {
    elementRef.submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Saves message on form submit.
elementRef.messageFormElement.addEventListener('submit', onMessageFormSubmit);
elementRef.signOutButtonElement.addEventListener('click', signOutUser);
elementRef.signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
elementRef.messageInputElement.addEventListener('keyup', toggleButton);
elementRef.messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
elementRef.messageCardElement.addEventListener("dragover",(e)=>{
     e.preventDefault();
}, false);

elementRef.messageCardElement.addEventListener("drop",onMediaFileSelected);

elementRef.imageButtonElement.addEventListener('click', function (e) {
  e.preventDefault();
  elementRef.mediaCaptureElement.click();
});
elementRef.mediaCaptureElement.addEventListener('change', onMediaFileSelected);

const firebaseAppConfig = getFirebaseConfig();

initializeApp(firebaseAppConfig);

getPerformance();

initFirebaseAuth();
loadMessages();


