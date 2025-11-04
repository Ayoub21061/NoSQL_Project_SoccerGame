let username; // ✅ variable globale accessible partout

document.addEventListener("DOMContentLoaded", async () => {
  username = localStorage.getItem("username");
  const container = document.getElementById("packs-container");

  if (!username) {
    container.innerHTML = "<p>Utilisateur non connecté.</p>";
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:5001/users/${username}`);
    if (!res.ok) throw new Error("Erreur serveur");
    const user = await res.json();

    if (!user.packs_owned || user.packs_owned.length === 0) {
      container.innerHTML = "<p>Tu n’as encore débloqué aucun pack 😅</p>";
      return;
    }

    container.innerHTML = "";
    user.packs_owned.forEach(pack => {
      const div = document.createElement("div");
      div.className = "pack-card";

      let imgSrc = "../images/pack_ultime.png";
      const packName = pack.toLowerCase();
      if (packName.includes("platinum")) imgSrc = "../images/pack_platinum.png";
      else if (packName.includes("gold")) imgSrc = "../images/pack_gold.png";
      else if (packName.includes("silver")) imgSrc = "../images/pack_silver.png";
      else if (packName.includes("bronze")) imgSrc = "../images/pack_bronze.png";

      div.innerHTML = `
        <img src="${imgSrc}" alt="${pack}" class="pack-img">
        <p>${pack}</p>
      `;

      div.addEventListener("click", () => openPack(pack));
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Erreur lors du chargement des packs.</p>";
  }
});

async function openPack(packName) {
  const confirmOpen = confirm(`Souhaitez-vous ouvrir le ${packName} ?`);
  if (!confirmOpen) return;

  const container = document.getElementById("packs-container");
  container.innerHTML = `
    <div class="opening-animation">
      <h2>Ouverture du ${packName}...</h2>
      <div class="pack-opening"></div>
    </div>
  `;

  try {
    const resPlayers = await fetch("http://127.0.0.1:5001/skills");
    const allPlayers = await resPlayers.json();

    const resUser = await fetch(`http://127.0.0.1:5001/users/${username}`);
    const user = await resUser.json();
    const owned = user.players_owned || [];

    let numPlayers = 1;
    const lowerPack = packName.toLowerCase();
    if (lowerPack.includes("gold")) numPlayers = 2;
    if (lowerPack.includes("diamond")) numPlayers = 3;

    let availablePlayers = allPlayers.filter(p => !owned.includes(p.id));
    if (availablePlayers.length === 0) {
      alert("❌ Tous les joueurs de ce pack sont déjà possédés !");
      container.innerHTML = "";
      return;
    }

    const selectedPlayers = [];
    const copyAvailable = [...availablePlayers];
    for (let i = 0; i < numPlayers && copyAvailable.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * copyAvailable.length);
      const player = copyAvailable.splice(randomIndex, 1)[0];
      selectedPlayers.push(player);
    }

    setTimeout(async () => {
      container.innerHTML = `<h2>🎉 Voici tes nouveaux joueurs !</h2><div id="player-cards"></div>`;
      const cardsContainer = document.getElementById("player-cards");

      for (let index = 0; index < selectedPlayers.length; index++) {
        const player = selectedPlayers[index];
        const card = document.createElement("div");
        card.className = "skill-card";

        const playerName = player.id || "Joueur inconnu";
        const playerStyle = player.style || "Classique";
        const playerImage = player.image?.startsWith("images/") ? `../${player.image}` : `../images/${player.image || "default-player.png"}`;

        // ✅ Vérification correcte pour gardien
        const isGK = player.style?.toLowerCase() === "gardien";

        let statsHtml = "";
        if (isGK) {
          statsHtml = `
            <div class="skill-stat">👐 DIV ${player.div ?? 0}</div>
            <div class="skill-stat">🧤 REF ${player.ref ?? 0}</div>
            <div class="skill-stat">🤲 HAN ${player.han ?? 0}</div>
            <div class="skill-stat">🥅 KIC ${player.kic ?? 0}</div>
            <div class="skill-stat">⚡ SPD ${player.spd ?? 0}</div>
            <div class="skill-stat">📌 POS ${player.pos ?? 0}</div>
          `;
        } else {
          statsHtml = `
            <div class="skill-stat">⚡ PAC ${player.pac ?? 0}</div>
            <div class="skill-stat">🎯 SHO ${player.sho ?? 0}</div>
            <div class="skill-stat">🎩 PAS ${player.pas ?? 0}</div>
            <div class="skill-stat">🌀 DRI ${player.dri ?? 0}</div>
            <div class="skill-stat">🛡️ DEF ${player.def ?? 0}</div>
            <div class="skill-stat">💪 PHY ${player.phy ?? 0}</div>
          `;
        }

        card.innerHTML = `
          <div class="skill-image-container">
            <img src="${playerImage}" alt="${playerName}">
          </div>
          <div class="skill-header">${playerName}</div>
          <div class="skill-style">${playerStyle}</div>
          <div class="skill-stats">${statsHtml}</div>
        `;

        setTimeout(() => {
          cardsContainer.appendChild(card);
          setTimeout(() => card.classList.add("show"), 100);
        }, index * 700);

        try {
          await fetch(`http://127.0.0.1:5001/users/${username}/add_player`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player_id: player.id })
          });
        } catch (err) {
          console.error("❌ Erreur ajout joueur :", err);
        }
      }

      // --- Ajouter le kit si le pack contient exclusive_kit ---
      const achievement = user.achievements?.find(a => a.name.toLowerCase() === packName.toLowerCase());
      if (achievement?.reward?.exclusive_kit) {
        try {
          await fetch(`http://127.0.0.1:5001/players/add_claimed_reward/${username}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reward: achievement })
          });

          const kitsContainer = document.getElementById("kits-container");
          if (kitsContainer) {
            const kitDiv = document.createElement("div");
            kitDiv.className = "kit-card";
            kitDiv.dataset.kitId = achievement.id;
            kitDiv.innerHTML = `
              <img src="../images/kits/${achievement.reward.pack || "default-kit"}.png" alt="${achievement.reward.pack}" class="kit-img">
              <div class="kit-name">${achievement.reward.pack}</div>
            `;
            kitDiv.addEventListener("click", () => {
              localStorage.setItem("selectedKit", achievement.id);
              document.querySelectorAll(".kit-card").forEach(k => k.classList.remove("selected-kit"));
              kitDiv.classList.add("selected-kit");
              applyKitToTeam(achievement);
            });
            kitsContainer.appendChild(kitDiv);
          }
        } catch (err) {
          console.error("❌ Erreur ajout kit exclusif :", err);
        }
      }

    }, 2000);

    try {
      await fetch(`http://127.0.0.1:5001/users/${username}/remove_pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_name: packName })
      });
    } catch (err) {
      console.error("❌ Erreur lors de la suppression du pack :", err);
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Erreur lors de l'ouverture du pack.</p>";
  }
}
