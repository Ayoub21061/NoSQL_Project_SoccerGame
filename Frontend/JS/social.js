document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchUsername");
    const addFriendBtn = document.getElementById("addFriendBtn");

    let currentPlayer = JSON.parse(localStorage.getItem("player")) || null;
    let viewedPlayer = null;
    let expandedFriend = null;

    // --- Recherche d'un joueur avec bouton ou touche Entrée ---
    searchBtn.addEventListener("click", async () => {
        const username = searchInput.value.trim();
        if (!username) return alert("Veuillez entrer un nom d'utilisateur");
        await loadPlayerProfile(username);
    });

    // ✅ Permet d'appuyer sur "Entrée" pour lancer la recherche d'un joueur
    searchInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const username = searchInput.value.trim();
            if (!username) return alert("Veuillez entrer un nom d'utilisateur");
            await loadPlayerProfile(username);
        }
    });

    // --- Charger le profil d'un joueur ---
    async function loadPlayerProfile(username) {
        try {
            const res = await fetch(`http://127.0.0.1:5001/social/search?username=${username}`);
            if (!res.ok) throw new Error("Joueur introuvable");
            const data = await res.json();
            viewedPlayer = data;

            document.getElementById("profileUsername").textContent = data.username;
            document.getElementById("profileScore").textContent = data.score_global;
            document.getElementById("profileRank").textContent = data.rank;
            document.getElementById("profileWins").textContent = data.matches_won;
            document.getElementById("profileLosses").textContent = data.matches_lost;
            document.getElementById("profileDraws").textContent = data.matches_draw;
            document.getElementById("profileAvatar").src = `../images/${data.avatar || "default-avatar.png"}`;
            document.getElementById("playerProfile").style.display = "block";
        } catch (err) {
            alert(err.message);
            document.getElementById("playerProfile").style.display = "none";
        }
    }

    // --- Envoyer une demande d'ami ---
    addFriendBtn.addEventListener("click", async () => {
        if (!currentPlayer || !viewedPlayer) return alert("Impossible d'envoyer la demande");
        if (currentPlayer.username === viewedPlayer.username) return alert("Vous ne pouvez pas vous ajouter vous-même");

        try {
            const res = await fetch("http://127.0.0.1:5001/social/friend_request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender: currentPlayer.username, receiver: viewedPlayer.username })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur");
            alert(data.message);
        } catch (err) {
            alert(err.message);
        }
    });

    // --- Charger les demandes d'amis ---
    async function loadFriendRequests() {
        if (!currentPlayer) return;
        try {
            const res = await fetch(`http://127.0.0.1:5001/social/friend_requests/${currentPlayer.username}`);
            if (!res.ok) throw new Error("Impossible de récupérer les demandes");
            const data = await res.json();
            const list = document.getElementById("friendRequestsList");
            list.innerHTML = "";
            data.requests.forEach(req => {
                const li = document.createElement("li");
                const line = document.createElement("div");
                line.textContent = req.sender + " ";
                const acceptBtn = document.createElement("button");
                acceptBtn.textContent = "Accepter";
                acceptBtn.className = "accept";
                acceptBtn.onclick = () => respondFriend(req.sender, true);
                const rejectBtn = document.createElement("button");
                rejectBtn.textContent = "Refuser";
                rejectBtn.className = "reject";
                rejectBtn.onclick = () => respondFriend(req.sender, false);
                line.appendChild(acceptBtn);
                line.appendChild(rejectBtn);
                li.appendChild(line);
                list.appendChild(li);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // --- Répondre à une demande d'ami ---
    async function respondFriend(sender, accept) {
        try {
            const res = await fetch("http://127.0.0.1:5001/social/friend_request/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender, receiver: currentPlayer.username, accept })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur");
            alert(data.message);
            loadFriendRequests();
            loadFriends();
        } catch (err) {
            alert(err.message);
        }
    }

    // --- Liste des amis ---
    async function loadFriends() {
        if (!currentPlayer) return;
        try {
            const res = await fetch(`http://127.0.0.1:5001/players/username/${currentPlayer.username}`);
            if (!res.ok) throw new Error("Impossible de récupérer la liste d'amis");
            const player = await res.json();
            const list = document.getElementById("friendsList");
            list.innerHTML = "";

            (player.friends || []).forEach(async f => {
                const li = document.createElement("li");
                const header = document.createElement("div");

                // Nom cliquable
                const span = document.createElement("span");
                span.textContent = f;
                span.style.cursor = "pointer";
                span.style.fontWeight = "bold";
                span.style.color = "#1a73e8";

                // Bouton supprimer
                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Supprimer";
                removeBtn.className = "reject";
                removeBtn.onclick = async () => {
                    try {
                        const res = await fetch("http://127.0.0.1:5001/social/friend/remove", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user1: currentPlayer.username, user2: f })
                        });
                        const data = await res.json();
                        alert(data.message);
                        loadFriends();
                    } catch (err) { console.error(err); }
                };

                header.appendChild(span);
                header.appendChild(removeBtn);

                // Détails ami
                const infoDiv = document.createElement("div");
                infoDiv.className = "friend-details";

                span.addEventListener("click", async () => {
                    if (expandedFriend === f) {
                        infoDiv.classList.remove("show");
                        expandedFriend = null;
                    } else {
                        const friendData = await fetch(`http://127.0.0.1:5001/social/search?username=${f}`).then(r => r.json());
                        infoDiv.innerHTML = `
                            <div class="header">
                                <img src="../images/${friendData.avatar || "default-avatar.png"}" alt="avatar">
                                <h4>${friendData.username}</h4>
                            </div>
                            <div class="stats-grid">
                                <div class="stats-item"><h5>Score global</h5><p>${friendData.score_global}</p></div>
                                <div class="stats-item"><h5>Rang</h5><p>${friendData.rank}</p></div>
                                <div class="stats-item"><h5>Victoires</h5><p>${friendData.matches_won}</p></div>
                                <div class="stats-item"><h5>Défaites</h5><p>${friendData.matches_lost}</p></div>
                                <div class="stats-item"><h5>Nuls</h5><p>${friendData.matches_draw}</p></div>
                            </div>
                        `;
                        infoDiv.classList.add("show");
                        expandedFriend = f;
                    }
                });

                li.appendChild(header);
                li.appendChild(infoDiv);
                list.appendChild(li);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // --- Chargement initial ---
    loadFriendRequests();
    loadFriends();
});
