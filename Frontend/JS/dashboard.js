document.addEventListener("DOMContentLoaded", async () => {
    const creditsElement = document.getElementById("user-credits");
    const avatar = document.getElementById("user-avatar");
    const nameSpan = document.getElementById("user-name");

    let playerData = null;

    try {
        const username = localStorage.getItem("username");
        if (username) {
            const res = await fetch(`http://127.0.0.1:5001/users/${username}`);
            if (!res.ok) throw new Error("API inaccessible");
            playerData = await res.json();
            localStorage.setItem("player", JSON.stringify(playerData));
        } else {
            playerData = JSON.parse(localStorage.getItem("player"));
        }
    } catch {
        playerData = JSON.parse(localStorage.getItem("player"));
    }

    if (!playerData) { 
        alert("Aucun joueur trouvé !"); 
        window.location.href = "index.html"; 
        return; 
    }

    avatar.src = `../images/${playerData.avatar || "default-avatar.png"}`;
    nameSpan.textContent = playerData.username || "Joueur";
    creditsElement.textContent = `💰 Crédits : ${playerData.credits ?? 0}`;

    document.getElementById("player-score").textContent = ((playerData.matches_won * 3 + (playerData.matches_draw ?? 0))).toFixed(0);

    new Chart(document.getElementById("matchPie"), {
        type: "pie",
        data: {
            labels: ["Gagnés", "Perdus", "Nuls"],
            datasets: [{
                data: [playerData.matches_won ?? 0, playerData.matches_lost ?? 0, playerData.matches_draw ?? 0],
                backgroundColor: ["#30573eff", "#793c3cff", "#565655ff"]
            }]
        },
        options: { plugins: { legend: { position: "bottom" } } }
    });

    new Chart(document.getElementById("statsChart"), {
        type: "bar",
        data: {
            labels: ["Buts", "Passes", "Arrêts"],
            datasets: [{
                label: "Stats du joueur",
                data: [
                    playerData.goals ?? playerData.best_player_stats?.goals ?? 0,
                    playerData.assists ?? playerData.best_player_stats?.assists ?? 0,
                    playerData.saves ?? playerData.best_player_stats?.saves ?? 0
                ],
                backgroundColor: ['#4A90E2', '#37474F', '#203170ff']
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    const rankingList = document.getElementById("rankingList");

    // -----------------------
    // Classement autour du joueur
    // -----------------------
    try {
        const res = await fetch(`http://127.0.0.1:5001/players/ranking/${playerData.username}`);
        if (!res.ok) throw new Error("Impossible de récupérer le classement");
        const ranking = await res.json();

        rankingList.innerHTML = ""; // reset
        ranking.forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `<span>#${p.rank} — ${p.username}</span><span>${p.score_global ?? 0} pts</span>`;
            if (p.username === playerData.username) {
                li.classList.add("current-player");
                // 🔹 mettre à jour le rang affiché
                document.getElementById("player-rank").textContent = p.rank;
            }
            rankingList.appendChild(li);
        });
    } catch (err) {
        console.error("Erreur classement :", err);
        rankingList.innerHTML = "<li>Impossible de récupérer le classement</li>";
    }

    document.querySelector(".ranking-card").addEventListener("click", () => {
        document.querySelector(".ranking-card").classList.toggle("active");
    });
});
