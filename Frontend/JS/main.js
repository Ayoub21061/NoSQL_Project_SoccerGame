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
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('http://localhost:5001/players/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("username", data.player?.username || username);
        localStorage.setItem("player", JSON.stringify(data.player || {}));
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
    });

    const data = await response.json();

    if (response.ok) {
        alert("Compte créé avec succès !");
        window.location.href = "dashboard.html";
    } else {
        alert(data.error || "Erreur lors de l'inscription.");
    }
}

// --- ✅ Permet d'appuyer sur "Entrée" pour se connecter ou s'inscrire ---
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Empêche le rechargement
        const loginFormVisible = document.getElementById('login-form').style.display !== 'none';
        if (loginFormVisible) {
            login();
        } else {
            register();
        }
    }
});
