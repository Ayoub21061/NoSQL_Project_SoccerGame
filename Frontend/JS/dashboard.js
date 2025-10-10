document.addEventListener("DOMContentLoaded", () => {
    
    // --- Partie Dashboard dynamique ---

    // Chargement du joueur connecté : on va chercher les données qui ont été stockés lors de la connexion 
    const player = JSON.parse(localStorage.getItem("player"));
    // Vérification qu’un joueur est bien connecté : si il est pas connecté, y'a pas de données à afficher donc on redirige vers la page de connexion 
    if (!player) {
        alert("Aucun joueur connecté !");
        window.location.href = "index.html";
        return;
    }

    // Remplir les infos dans la page de manière dynamique 
    document.querySelector(".cards-container").innerHTML = `
        <div class="card">
            <h2>Statistiques</h2>
            <p><strong>Matchs gagnés :</strong> ${player.matches_won}</p>
            <p><strong>Matchs perdus :</strong> ${player.matches_lost}</p>
            <p><strong>Matchs nuls :</strong> ${player.matches_draw}</p>
            <p><strong>Temps total de jeu :</strong> ${(player.total_playtime / 60).toFixed(1)} h</p>
        </div>

        <div class="card">
            <h2>Classement</h2>
            <p><strong>Votre rang :</strong> ${player.rank}</p>
            <p><strong>Score global :</strong> ${(player.matches_won * 3 + player.matches_draw).toFixed(0)}</p>
        </div>

        <div class="card">
            <h2>Meilleures performances</h2>
            <canvas id="statsChart" width="200" height="200"></canvas>
        </div>
    `;

    // Génération du graphique avec Chart.js
    const ctx = document.getElementById('statsChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Buts', 'Passes', 'Arrêts'],
                datasets: [{
                    label: 'Stats du joueur',
                    data: [
                        player.best_player_stats.goals,
                        player.best_player_stats.assists,
                        player.best_player_stats.saves
                    ]
                }]
            },
            // options : configure les axes, ici on force le début à zéro (beginAtZero: true)
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
});
