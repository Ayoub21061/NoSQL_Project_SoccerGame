// --- Changement d'affichage entre login et inscription ---

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// --- Connexion ---
// async function login() {
//     const username = document.getElementById('login-username').value.trim();
//     const password = document.getElementById('login-password').value.trim();

//     if (!username || !password) {
//         alert("Veuillez remplir tous les champs.");
//         return;
//     }

//     const response = await fetch('http://localhost:5001/players/login', {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body: JSON.stringify({ username, password })
//     });

//     const data = await response.json();

//     if (response.ok) {
//         alert("Connexion réussie !");
//         // Tu peux stocker les infos du joueur en local si besoin :
//         localStorage.setItem("username", username);
//         // Redirection vers la page principale
//         window.location.href = "dashboard.html";
//     } else {
//         alert(data.error || "Erreur de connexion.");
//     }
// }

async function login() {
    // On va chercher ce que le user a écrit
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // fetch envoie une requête HTTP vers l'API backend
    const response = await fetch('http://localhost:5001/players/login', {
        // On envoie les données vers le backend
        method: 'POST',
        // Indique que le corps de la requête est du json
        headers: { 'Content-Type': 'application/json' },
        // Body = ce qu'on renvoie, converti d'office en json
        body: JSON.stringify({ username, password })
    });

    // Grâce à await, on attend la réponse du serveur sans le bloquer
    const data = await response.json();

    if (response.ok) {
        // On sauvegarde le joueur connecté dans localStorage = petite base de données locale dans le navigateur
        localStorage.setItem("username", data.player?.username || username); // ✅ correction ici
        localStorage.setItem("player", JSON.stringify(data.player || {}));
        // Une fois que la connexion est passée, on redirige vers le dashboard
        window.location.href = "dashboard.html";
    } else {
        alert(data.error);
    }
}

// --- Inscription ---
async function register() {
    const username = document.getElementById('register-username').value.trim();
    const mail = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const passwordConfirm = document.getElementById('register-password-confirm').value.trim();

    if (!username || !mail || !password || !passwordConfirm) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    if (password !== passwordConfirm) {
        alert("Les mots de passe ne correspondent pas !");
        return;
    }

    const playerData = {
        username,
        password,
        account_creation_date: new Date().toISOString().split('T')[0],
        mail,
        best_player_stats: { goals: 0, assists: 0, saves: 0 }
    };

    const response = await fetch('http://localhost:5001/players/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(playerData)
    });

    const data = await response.json();

    if (response.ok) {
        alert("Compte créé avec succès !");
        //showLogin(); // On revient sur le formulaire de connexion
        window.location.href = "dashboard.html";
    } else {
        alert(data.error || "Erreur lors de l'inscription.");
    }
}
