document.addEventListener("DOMContentLoaded", () => {

    const player = JSON.parse(localStorage.getItem("player"));
    if (!player) {
        alert("Aucun joueur connecté !");
        window.location.href = "index.html";
        return;
    }

    // Construction du dashboard
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
                <div class="card ranking-card" id="rankingCard">
                    <h2>Classement</h2>
                    <div class="stats-card-vertical">
                        <h3>Votre rang</h3>
                        <p>${player.rank}</p>
                    </div>
                    <div class="stats-card-vertical">
                        <h3>Score global</h3>
                        <p>${(player.matches_won * 3 + player.matches_draw).toFixed(0)}</p>
                    </div>

                    <div class="ranking-details" id="rankingDetails">
                        <ul id="rankingList"></ul>
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
                    backgroundColor: ['#a3bffa', '#d1d5db', '#fcd34d']
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Classement interactif
    const rankingCard = document.getElementById("rankingCard");
    const rankingList = document.getElementById("rankingList");

    // Exemple de données fictives
    const fakeRanking = [
        { rank: player.rank - 3, username: "PlayerA", score: 1620 },
        { rank: player.rank - 2, username: "PlayerB", score: 1590 },
        { rank: player.rank - 1, username: "PlayerC", score: 1550 },
        { rank: player.rank, username: player.username, score: (player.matches_won * 3 + player.matches_draw) },
        { rank: player.rank + 1, username: "PlayerD", score: 1480 },
        { rank: player.rank + 2, username: "PlayerE", score: 1465 },
        { rank: player.rank + 3, username: "PlayerF", score: 1450 },
    ];

    fakeRanking.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `<span>#${p.rank} — ${p.username}</span><span>${p.score} pts</span>`;
        if (p.username === player.username) li.classList.add("current-player");
        rankingList.appendChild(li);
    });

    rankingCard.addEventListener("click", () => {
        rankingCard.classList.toggle("active");
    });

});
