// Afficher les formulaires selon si on a un compte ou pas 
// ça permet de basculer entre les deux vues sans devoir recharger la page

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// async = fonction asynchrone, elle peut attendre que le serveur réponde grâce au await
async function login() {
    // via getelement, on récupère ce que le user a écrit
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if(password !== passwordConfirm) {
        alert("Les mots de passe ne correspondent pas !");
        return;
    }

    // fetch envoie une requête HTTP au backend python
    const response = await fetch('http://localhost:5001/players/login', {
        // POST car on envoie des données pour login
        method: 'POST',
        // on précise que c'est du JSON
        headers: {'Content-Type': 'application/json'},
        // on transforme les données JS en JSON
        body: JSON.stringify({username, password})
    });

    //On récupère la réponse JSON du backend et on la stocke dans data
    const data = await response.json();
    // afficher la réponse dans une alerte (test pour vérifier si ça marche)

    if (response.ok) {
        // Redirection vers le dashboard si connexion réussie
        window.location.href = "dashboard.html"; // mets le chemin de ta page principale
    } else {
        alert(data.error); // Affiche l'erreur sinon
    }
    alert(JSON.stringify(data));
}

// Pour l'inscription, la logique est la même que pour le login
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('http://localhost:5001/players/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: username, 
            password: password,
        account_creation_date: new Date().toISOString().split('T')[0],
        best_player_stats : {goals : 0, assists : 0, saves : 0}})
    });

    const data = await response.json();
    alert(JSON.stringify(data));
}