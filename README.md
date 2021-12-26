# Firebase Web Codelab - Start code
https://firebase.google.com/codelabs/firebase-web?authuser=0#0

This folder contains the starting code for the [Firebase: Build a Real Time Web Chat App Codelab](https://codelabs.developers.google.com/codelabs/firebase-web/).

If you'd like to jump directly to the end and see the finished code head to the [web](../web) directory.

1-- Install the CLI by running the following npm command:

npm -g install firebase-tools

2-- Verify that the CLI has been installed correctly by running the following command:

 firebase --version

3-- Authorize the Firebase CLI by running the following command:

firebase login

4-- Associate your app with your Firebase project by running the following command:

firebase use --add

5-- When prompted, select your Project ID, then give your Firebase project an alias.
An alias is useful if you have multiple environments (production, staging, etc). However, for this codelab, let's just use the alias of default.

6-- Follow the remaining instructions on your command line.

<<<<<<______________Run the starter app locally_____________>>>>>>

 In a console from the web-start directory, run the following Firebase CLI command:

firebase serve --only hosting

hosting: Local server: http://localhost:5000

<<<<_______Install the Firebase SDK and start your Webpack build_______>>>>

We need to run a few commands to get our app's build going.

1. Open a new terminal window (Leave the terminal running firebase serve open. That's still what we'll use to host the app locally)

2. Make sure you're in the web-start directory
3. Run npm install to download the Firebase SDK

npm install

4. Run npm run start to start up Webpack. Webpack will now continually rebuild our cource code for the rest of the codelab.

npm run start


<<<<________Deploy files to Firebase project_________>>>>

Deploy your files to your Firebase project by running the following command:

firebase deploy --except functions