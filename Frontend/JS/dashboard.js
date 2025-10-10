document.addEventListener("DOMContentLoaded", () => {
    
    const player = JSON.parse(localStorage.getItem("player"));
    if (!player) {
        alert("Aucun joueur connecté !");
        window.location.href = "index.html";
        return;
    }

    // Conteneur dashboard asymétrique
    document.querySelector("main").innerHTML = `
        <div class="dashboard-container">
            <div class="dashboard-left">
                <!-- Statistiques -->
                <div class="card">
                    <h2>Statistiques</h2>
                    <div class="stats-card-vertical">
                        <h3>Matchs gagnés</h3>
                        <p>${player.matches_won}</p>
                    </div>
                    <div class="stats-card-vertical">
                        <h3>Matchs perdus</h3>
                        <p>${player.matches_lost}</p>
                    </div>
                    <div class="stats-card-vertical">
                        <h3>Matchs nuls</h3>
                        <p>${player.matches_draw}</p>
                    </div>
                    <div class="stats-card-vertical">
                        <h3>Temps total de jeu</h3>
                        <p>${(player.total_playtime / 60).toFixed(1)} h</p>
                    </div>
                </div>

                <!-- Classement -->
                <div class="card">
                    <h2>Classement</h2>
                    <div class="stats-card-vertical">
                        <h3>Votre rang</h3>
                        <p>${player.rank}</p>
                    </div>
                    <div class="stats-card-vertical">
                        <h3>Score global</h3>
                        <p>${(player.matches_won * 3 + player.matches_draw).toFixed(0)}</p>
                    </div>
                </div>
            </div>

            <!-- Graphique -->
            <div class="dashboard-right">
                <div class="card">
                    <h2>Meilleures performances</h2>
                    <canvas id="statsChart" width="400" height="400"></canvas>
                </div>
            </div>
        </div>
    `;

    // Graphique Chart.js
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
                    ],
                    backgroundColor: ['#a3bffa', '#d1d5db', '#fcd34d'] // couleurs sobres et harmonieuses
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
});
