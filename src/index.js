
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


const FILES = [];
const LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';
const IMAGE_FILE_URL = 'https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png?a'


async function saveMessage(messageText) {
  try {
    const messageRef = await addDoc(collection(getFirestore(), 'messages'), {
      name: getUserName(),
      text: messageText,
      imageUrl: LOADING_IMAGE_URL,
      profilePicUrl: getProfilePicUrl(),
      timestamp: serverTimestamp()
    });
    if(FILES.length){
      const files = [];

      for(const file of FILES){
        const filePath = `${getAuth().currentUser.uid}/${messageRef.id}/${file.name}`;
        const newImageRef = ref(getStorage(), filePath);
        const fileSnapshot = await uploadBytesResumable(newImageRef,file);
        const publicImageUrl = await getDownloadURL(newImageRef);
    
        files.push({
          name:file.name,
          type:file.type,
          size:file.size,
          snapshot:fileSnapshot.metadata.fullPath,
          imageUrl:publicImageUrl
        });
      }
        await updateDoc(messageRef,{  files,});
    }
  }
  catch(error) {
    console.error('Error writing new message to Firebase Database', error);
  }
}

function loadMessages() {
  const recentMessagesQuery = query(collection(getFirestore(), 'messages'), 
  orderBy('timestamp', 'desc'), limit(12));

  onSnapshot(recentMessagesQuery, function(snapshot) {
    
    snapshot.docChanges().forEach(function(change) {
   
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        const message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
                      message.text, message.profilePicUrl, message.imageUrl,message.files);
      }
    });
  });
}

function displaySelectedFile(imageUrl,name,size){
  const item = document.createElement('LI');
  item.setAttribute('class', "message-files__item");
item.innerHTML = `
<img src="${imageUrl}" class="message-files__images" height="60px">
<button type="button" class="message-files__cross">&#9932;</button>
<h3 class="message-files__title">${name}</h3>
<p class="message-files__data">${(size/1024).toFixed(1)} Kb</p>`
  elementRef.preShowFiles.append(item);

  toggleButton();
}

function removeFileSelected(event){
  if (event.target.nodeName !== "BUTTON") {
    return;
  }
const indexFile = FILES.findIndex(element => 
   element.name === event.target.nextElementSibling.textContent);
 FILES.splice(indexFile, 1);
removeElement(event.path[1]);
}

function removeElement(element){
  element.remove();
  toggleButton();
}

function addFiles(arrayFiles){  
   [...arrayFiles].map((element, index, array) => {
    if(element.type.match('image.*')){
     makeUrlImage(element);
    }else{
      displaySelectedFile(IMAGE_FILE_URL,element.name,element.size)
    }});
      FILES.push(...arrayFiles);
}

function makeUrlImage(file) {
  const fileReader = new FileReader();
 fileReader.onload = function (event) {
    const imageDataUrl = event.srcElement.result;  
    displaySelectedFile(imageDataUrl,file.name,file.size);
    }
 fileReader.readAsDataURL(file);   
}

 function onMediaFileSelected(event) {
  event.preventDefault();
  addFiles((event.dataTransfer||event.target).files);
 elementRef.imageFormElement.reset();
}

function onMessageFormSubmit(e) {
  e.preventDefault();
 
  if (elementRef.messageInputElement.value.trim() || FILES.length  && checkSignedInWithMessage()) {
    saveMessage(elementRef.messageInputElement.value).then(function () {
      resetMaterialTextfield(elementRef.messageInputElement);
      resetSelectFile();
      toggleButton();
    });
  }
}

function checkSignedInWithMessage() {
  if (isUserSignedIn()) {
    return true;
  }
  var data = {
    message: 'You must sign-in first',
    timeout: 2000,
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

function resetSelectFile(){
  elementRef.preShowFiles.innerHTML= "";
  FILES.splice(0,FILES.length);
}

function deleteMessage(id) {
  var div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}

function createAndInsertMessage(id, timestamp) {
  
const MESSAGE_TEMPLATE =
'<li class="message">' +
'<div class="message__user-pic"></div>' +
'<div class="message__date">'+
    '<div class="message__user-name"></div>'+
    '<div class="message__time"></div>'+
'</div>' +
'<div class="message__text"></div>' +
'</li>';

  const container = document.createElement('LI');
  container.innerHTML = MESSAGE_TEMPLATE;
  const item = container.firstChild;
  item.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  item.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = elementRef.messageListElement.children;
  if (existingMessages.length === 0) {
    elementRef.messageListElement.appendChild(item);
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
    elementRef.messageListElement.insertBefore(item, messageListNode);
  }
  return item;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, imageUrl,fileUrl,fileName) {
  let message = null;
  const item =
    document.getElementById(id) || createAndInsertMessage(id, timestamp);

  if (picUrl) {
    item.querySelector('.message__user-pic').style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }
  item.querySelector('.message__user-name').textContent = name;
  var messageElement = item.querySelector('.message__text');

  if (text) {
    message = text.replace(/\n/g, '<br>'); 
  } else if(files){ 
    message = `<img src="${imageUrl}"><p>${fileName}</p><a href="${fileUrl}" download>download</a>`; 
  }
  if(message){ messageElement.innerHTML = message; }
 
  item.classList.add('visible');

  elementRef.messageListElement.scrollTop = elementRef.messageListElement.scrollHeight+100;
  elementRef.messageInputElement.focus();
}

function toggleButton() {
  if (elementRef.messageInputElement.value||
    elementRef.preShowFiles.children.length) {
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
elementRef.messageCardElement.addEventListener("drop",(e)=>{
  e.preventDefault();
});

elementRef.preShowFiles.addEventListener('click',removeFileSelected);



const firebaseAppConfig = getFirebaseConfig();

initializeApp(firebaseAppConfig);

getPerformance();

initFirebaseAuth();
loadMessages();
//--------------------------------------
runOnKeys(
  read,
  "KeyV",
  "ControlLeft",
  "ControlRight",
);

function read (){
  navigator.clipboard.read().then(( items ) => {
    console.log(navigator.clipboard);
    // items.forEach(item => {
    //   console.log(item.type);
    //   // делаем что-то с полученными данными
    // });
  });
}
function runOnKeys(func,code, ...codes) {
  let pressed = new Set();
  document.addEventListener('keydown', function(event) {
    pressed.add(event.code);
if(pressed.has(code)){
  for (let code of codes) { 
      if (pressed.has(code)) {
       pressed.clear();
    func(); 
      }
    }}
  });
  document.addEventListener('keyup', function(event) {
    pressed.delete(event.code);
  });
}
///----------------------------------


 

