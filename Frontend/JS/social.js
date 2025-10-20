document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchUsername");
    const addFriendBtn = document.getElementById("addFriendBtn");

    let currentPlayer = JSON.parse(localStorage.getItem("player")) || null;
    let viewedPlayer = null;
    let expandedFriend = null; // pour toggle affichage infos ami

    // Rechercher un joueur
    searchBtn.addEventListener("click", async () => {
        const username = searchInput.value.trim();
        if (!username) return alert("Veuillez entrer un nom d'utilisateur");
        await loadPlayerProfile(username);
    });

    // Charger le profil d'un joueur (recherche)
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

    // Envoyer une demande d'ami
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

    // Afficher les demandes d'amis en attente
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
                li.textContent = req.sender + " ";
                const acceptBtn = document.createElement("button");
                acceptBtn.textContent = "Accepter";
                acceptBtn.className = "accept";
                acceptBtn.onclick = () => respondFriend(req.sender, true);
                const rejectBtn = document.createElement("button");
                rejectBtn.textContent = "Refuser";
                rejectBtn.className = "reject";
                rejectBtn.onclick = () => respondFriend(req.sender, false);
                li.appendChild(acceptBtn);
                li.appendChild(rejectBtn);
                list.appendChild(li);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // Accepter ou refuser une demande
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

    // Afficher les amis avec toggle infos
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

                // Nom cliquable de l'ami
                const span = document.createElement("span");
                span.textContent = f;
                span.style.cursor = "pointer";
                span.style.fontWeight = "bold";

                // Container infos ami
                const infoDiv = document.createElement("div");
                infoDiv.style.display = "none";
                infoDiv.style.marginTop = "5px";
                infoDiv.style.padding = "10px";
                infoDiv.style.background = "#f3f4f6";
                infoDiv.style.borderRadius = "8px";

                span.addEventListener("click", async () => {
                    if (expandedFriend === f) {
                        infoDiv.style.display = "none";
                        expandedFriend = null;
                    } else {
                        const friendData = await fetch(`http://127.0.0.1:5001/social/search?username=${f}`).then(r => r.json());
                        infoDiv.innerHTML = `
                            <p>Score global: ${friendData.score_global}</p>
                            <p>Rang: ${friendData.rank}</p>
                            <p>Matchs gagnés: ${friendData.matches_won}</p>
                            <p>Matchs perdus: ${friendData.matches_lost}</p>
                            <p>Matchs nuls: ${friendData.matches_draw}</p>
                        `;
                        infoDiv.style.display = "block";
                        expandedFriend = f;
                    }
                });

                // Bouton supprimer
                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Supprimer";
                removeBtn.className = "remove";
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

                li.appendChild(span);
                li.appendChild(removeBtn);
                li.appendChild(infoDiv);
                list.appendChild(li);
            });
        } catch (err) {
            console.error(err);
        }
    }

    loadFriendRequests();
    loadFriends();
});
