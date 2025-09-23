// Import the tldraw component directly if you were using the npm package
// Since we are using the CDN version, we don't need this import.

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBQAjV9LYgB_HUPLONqdhFEHg0K9mmR_TQ",
    authDomain: "towertutoring-e48ac.firebaseapp.com",
    projectId: "towertutoring-e48ac",
    storageBucket: "towertutoring-e48ac.appspot.com",
    messagingSenderId: "962909548649",
    appId: "1:962909548649:web:8be51e20d7f6c852c172f8"
};
const recaptchaV3SiteKey = "6LdCQMwrAAAAAPbrXbfTEAUfqdp03V0xpNB4KjaB";

// --- INITIALIZATION ---
firebase.initializeApp(firebaseConfig);
const appCheck = firebase.appCheck();
const auth = firebase.auth();

// This is for localhost testing. You can remove it before final deployment.
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

appCheck.activate(
    new firebase.appCheck.ReCaptchaV3Provider(recaptchaV3SiteKey),
    true
);

// --- UI ELEMENTS & STATE ---
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const joinBtn = document.getElementById('joinBtn');
const nicknameInput = document.getElementById('nicknameInput');
const sessionNameDisplay = document.getElementById('sessionNameDisplay');
const whiteboardContainer = document.getElementById('whiteboardContainer');
let tldrawEditor = null;

// --- EVENT LISTENERS & LOGIC ---
joinBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('Please enter a session name.');
        return;
    }

    console.log('Attempting to sign in...');
    try {
        await auth.signInAnonymously();
        console.log('Sign-in successful!');

        // Hide login view and show the main app
        loginView.style.display = 'none';
        appView.style.display = 'flex';
        sessionNameDisplay.textContent = `Session: ${nickname}`;

        // The tldraw script from the CDN creates a global 'tldraw' object
        const { Tldraw } = tldraw;
        if (whiteboardContainer && !tldrawEditor) {
            tldrawEditor = new Tldraw({ parent: whiteboardContainer });
        }

    } catch (error) {
        console.error("Sign-in failed:", error);
        alert('Sign-in failed. Check the console for details.');
    }
});