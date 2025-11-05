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
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert("Please fill in both username and password.");
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/players/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Nettoie le localStorage et stocke les infos du joueur connecté
            localStorage.clear();
            localStorage.setItem("username", data.player?.username || username);
            localStorage.setItem("player", JSON.stringify(data.player || {}));
            window.location.href = "dashboard.html";
        } else {
            alert(data.error || "Login failed.");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred during login.");
    }
}

// --- Inscription ---
async function register() {
    const username = document.getElementById('register-username').value.trim();
    const mail = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const passwordConfirm = document.getElementById('register-password-confirm').value.trim();

    if (!username || !mail || !password || !passwordConfirm) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== passwordConfirm) {
        alert("The passwords don't match!");
        return;
    }

    const playerData = {
        username,
        password,
        account_creation_date: new Date().toISOString().split('T')[0],
        mail,
        best_player_stats: { goals: 0, assists: 0, saves: 0 },
        matches_won: 0,
        matches_lost: 0,
        matches_draw: 0,
        total_playtime: 0,
        achievements: [],
        credits: 0,
        rank: 0,
        players_owned: [],
        score_global: 0,
        contrats_formes: [],
        friends: [],
        friend_requests: []
    };

    try {
        const response = await fetch('http://localhost:5001/players/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playerData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Account successfully created!");

            // Auto-login après création
            const loginResponse = await fetch('http://localhost:5001/players/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
                localStorage.clear();
                localStorage.setItem("username", loginData.player?.username || username);
                localStorage.setItem("player", JSON.stringify(loginData.player || {}));
                window.location.href = "dashboard.html";
            } else {
                alert("Account created, but login failed.");
            }
        } else {
            alert(data.error || "Error during registration.");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred during registration.");
    }
}

// --- Permet d'appuyer sur "Entrée" pour se connecter ou s'inscrire ---
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
