// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAstdSQcZtM8bdoNTuBhcmxs_GDZcf3Siw",
    authDomain: "bgmea-75209.firebaseapp.com",
    databaseURL: "https://bgmea-75209-default-rtdb.firebaseio.com",
    projectId: "bgmea-75209",
    storageBucket: "bgmea-75209.firebasestorage.app",
    messagingSenderId: "962536265705",
    appId: "1:962536265705:web:cba1e8191a40e8e4ca1d78"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Password toggle function
function togglePassword(inputId, toggleButton) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = toggleButton.querySelector('.eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈'; // Hidden eye icon
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️'; // Visible eye icon
    }
}

// --- UI Elements ---
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const medicineForm = document.getElementById('medicine-form');
const medicineNameInput = document.getElementById('medicine-name');
const medicineSuggestions = document.getElementById('medicine-suggestions');
const quantityInput = document.getElementById('quantity');
const dateInput = document.getElementById('date');
const branchSelect = document.getElementById('branch');
const submitBtn = document.getElementById('submit-btn');
const downloadCsvBtn = document.getElementById('download-csv');
const formSuccess = document.getElementById('form-success');
const forgotForm = document.getElementById('forgot-form');
const forgotEmailInput = document.getElementById('forgot-email');
const forgotSendBtn = document.getElementById('forgot-send-btn');
const forgotBackLogin = document.getElementById('forgot-back-login');
const forgotError = document.getElementById('forgot-error');
const forgotSuccess = document.getElementById('forgot-success');

// --- Modal Helper ---
function showModal(message) {
    const modal = document.getElementById('modal');
    const modalMsg = document.getElementById('modal-message');
    modalMsg.innerHTML = message;
    modal.style.display = 'flex';
}
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
document.getElementById('modal-close')?.addEventListener('click', closeModal);
window.addEventListener('click', function (e) {
    if (e.target === document.getElementById('modal')) closeModal();
});

// --- Medicine List (can be replaced with Firestore fetch if needed) ---
const MEDICINES = [
    "A-Fenac SR 100", "A-Phenicol Eye drop", "Alba 400", "Alertin 10", "AMX 500", "Azaltic 500", "Ben-A 400", "Broculyt syrup 100ml", "Citrux 250", "Cvnor-A 50", "Defungi 50", "Dermova Cream", "Dirozyl 400", "Doxy-A 100", "Fast 500", "Fast XR", "Fexten 120", "Florocin 500", "Halopen 500", "Irobest", "Leo 500", "Mayobac 10", "Miracal 500", "Montiva 10", "Nightus 3", "Oxydrop 10ml", "Panium 50", "Pansos 20", "Permin 15gm", "Pulmolin 4", "Rebetac 20", "Rhinozol 0.1", "Tamino 500", "Tinium 50", "Toralin 10", "Tracid 500", "Vomitop 10", "V-plex"
];

const BRANCHES = ["Main", "North", "South", "East", "West"];

// --- Auth UI Switch ---
showRegister && showRegister.addEventListener('click', e => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
});
showLogin && showLogin.addEventListener('click', e => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
});

// --- Auth Handlers ---
function isValidEmail(email) {
    // Simple regex for demonstration
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function getFriendlyAuthError(error) {
    if (!error || !error.code) return 'An unknown error occurred.';
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

// Update login and register field selectors
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const registerNameInput = document.getElementById('register-name');
const registerUsernameInput = document.getElementById('register-username');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const forgotPasswordLink = document.getElementById('forgot-password-link');

loginBtn && loginBtn.addEventListener('click', async () => {
    loginError.textContent = '';
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = loginPasswordInput.value;
    let email = identifier;

    if (!identifier) {
        loginError.textContent = 'Please enter your username or email.';
        return;
    }

    if (identifier.indexOf('@') === -1) {
        // Treat as username: look up email in Firestore
        try {
            const usersSnap = await db.collection('users').where('username', '==', identifier).limit(1).get();
            if (usersSnap.empty) {
                loginError.textContent = 'No user found with this username.';
                return;
            }
            email = usersSnap.docs[0].data().email;
        } catch (err) {
            loginError.textContent = 'Error looking up username.';
            return;
        }
    } else if (!isValidEmail(identifier)) {
        loginError.textContent = 'Please enter a valid email address.';
        return;
    }

    // Now authenticate with Firebase using the email and password
    try {
        const userCred = await auth.signInWithEmailAndPassword(email, password);
        if (!userCred.user.emailVerified) {
            await auth.signOut();
            showModal('Please verify your email before logging in. Check your inbox and click the verification link.');
            return;
        }
        localStorage.setItem('user', JSON.stringify(userCred.user));

        // Redirect to dashboard after successful login
        window.location.href = 'dashboard.html';
    } catch (err) {
        // Show user-friendly error messages
        if (err.code === 'auth/user-not-found') {
            loginError.textContent = identifier.indexOf('@') === -1 ?
                'No user found with this username.' : 'No user found with this email.';
        } else if (err.code === 'auth/wrong-password') {
            loginError.textContent = 'Incorrect password.';
        } else {
            loginError.textContent = getFriendlyAuthError(err);
        }
    }
});

registerBtn && registerBtn.addEventListener('click', async () => {
    registerError.textContent = '';
    const name = registerNameInput.value.trim();
    const username = registerUsernameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;
    if (!name || !username || !email || !password) {
        registerError.textContent = 'All fields required.';
        return;
    }
    if (!isValidEmail(email)) {
        registerError.textContent = 'Please enter a valid email address.';
        return;
    }
    try {
        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(userCred.user.uid).set({ name, username, email });
        await userCred.user.sendEmailVerification();
        showModal('Registration successful! Please verify your email from your email application before logging in.');
        // After closing modal, redirect to login
        closeModal();
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
    } catch (err) {
        registerError.textContent = getFriendlyAuthError(err);
    }
});

forgotPasswordLink && forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotForm.style.display = 'flex';
    forgotError.textContent = '';
    forgotSuccess.textContent = '';
    forgotEmailInput.value = '';
});
// Back to login from forgot form
forgotBackLogin && forgotBackLogin.addEventListener('click', (e) => {
    e.preventDefault();
    forgotForm.style.display = 'none';
    loginForm.style.display = 'flex';
    forgotError.textContent = '';
    forgotSuccess.textContent = '';
});
// Send reset link
forgotSendBtn && forgotSendBtn.addEventListener('click', async () => {
    forgotError.textContent = '';
    forgotSuccess.textContent = '';
    const email = forgotEmailInput.value.trim();

    console.log('Attempting password reset for email:', email);

    if (!isValidEmail(email)) {
        forgotError.textContent = 'Please enter a valid email address.';
        return;
    }

    // Show loading state
    forgotSendBtn.textContent = 'Sending...';
    forgotSendBtn.disabled = true;

    try {
        // Send password reset email directly
        // Firebase Auth will handle whether the email exists or not
        await auth.sendPasswordResetEmail(email, {
            url: window.location.origin + '/index.html',
            handleCodeInApp: false
        });

        console.log('Password reset email sent successfully to:', email);
        forgotSuccess.textContent = 'Password reset email sent! Please check your inbox (and spam folder).';

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
            forgotForm.style.display = 'none';
            loginForm.style.display = 'flex';
            forgotError.textContent = '';
            forgotSuccess.textContent = '';
            forgotEmailInput.value = '';
        }, 3000);

    } catch (err) {
        console.error('Password reset error:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);

        if (err.code === 'auth/user-not-found') {
            forgotError.textContent = 'No account found with this email address. Please check your email or register for a new account.';
        } else if (err.code === 'auth/too-many-requests') {
            forgotError.textContent = 'Too many attempts. Please try again later.';
        } else if (err.code === 'auth/invalid-email') {
            forgotError.textContent = 'Please enter a valid email address.';
        } else if (err.code === 'auth/network-request-failed') {
            forgotError.textContent = 'Network error. Please check your internet connection and try again.';
        } else if (err.code === 'auth/invalid-continue-uri') {
            // Fallback without continue URL
            try {
                await auth.sendPasswordResetEmail(email);
                console.log('Password reset email sent successfully (fallback) to:', email);
                forgotSuccess.textContent = 'Password reset email sent! Please check your inbox (and spam folder).';
            } catch (fallbackErr) {
                console.error('Fallback password reset also failed:', fallbackErr);
                forgotError.textContent = 'Unable to send reset email. Please try again or contact support.';
            }
        } else {
            forgotError.textContent = 'Unable to send reset email. Please try again or contact support.';
        }
    } finally {
        // Reset button state
        forgotSendBtn.textContent = 'SEND RESET LINK';
        forgotSendBtn.disabled = false;
    }
});

logoutBtn && logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('branch');
    showAuth();
});

// --- Session Persistence ---
function showDashboard() {
    authSection.style.display = 'none';
    dashboard.style.display = 'block';
    populateBranches();
    setDefaultDate();
}
function showAuth() {
    authSection.style.display = 'block';
    dashboard.style.display = 'none';
}

// Flag to prevent multiple redirects
let hasRedirected = false;

// Remove the onAuthStateChanged listener from app.js to prevent conflicts
// Dashboard.js will handle all auth state changes 