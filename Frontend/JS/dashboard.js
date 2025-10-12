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

    if (!playerData) { alert("Aucun joueur trouvé !"); window.location.href = "index.html"; return; }

    avatar.src = `../images/${playerData.avatar || "default-avatar.png"}`;
    nameSpan.textContent = playerData.username || "Joueur";
    creditsElement.textContent = `💰 Crédits : ${playerData.credits ?? 0}`;

    document.getElementById("player-rank").textContent = playerData.rank ?? 999;
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
            labels: ["Buts", "Passes", "Arrêts"], // labels des barres
            datasets: [{
                label: "Stats du joueur", // titre du dataset
                data: [
                    playerData.goals ?? playerData.best_player_stats?.goals ?? 0,
                    playerData.assists ?? playerData.best_player_stats?.assists ?? 0,
                    playerData.saves ?? playerData.best_player_stats?.saves ?? 0
                ],
                backgroundColor: ['#4A90E2', '#37474F', '#203170ff']
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });


    const rankingList = document.getElementById("rankingList");
    const rank = playerData.rank ?? 999;
    const score = (playerData.matches_won * 3 + (playerData.matches_draw ?? 0)).toFixed(0);
    const fakeRanking = [
        { rank: rank-2, username:"PlayerA", score:1800 },
        { rank: rank-1, username:"PlayerB", score:1700 },
        { rank, username:playerData.username, score:score },
        { rank: rank+1, username:"PlayerC", score:1500 },
    ];
    fakeRanking.forEach(p=>{
        const li=document.createElement("li");
        li.innerHTML=`<span>#${p.rank} — ${p.username}</span><span>${p.score} pts</span>`;
        if(p.username===playerData.username) li.classList.add("current-player");
        rankingList.appendChild(li);
    });

    document.querySelector(".ranking-card").addEventListener("click", ()=>{
        document.querySelector(".ranking-card").classList.toggle("active");
    });
});
