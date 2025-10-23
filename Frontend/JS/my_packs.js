let username; // ✅ variable globale accessible partout

document.addEventListener("DOMContentLoaded", async () => {
  username = localStorage.getItem("username"); // ✅ assignation ici
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
      else if (packName.includes("diamond")) imgSrc = "../images/pack_diamond.png";

      div.innerHTML = `
        <img src="${imgSrc}" alt="${pack}" class="pack-img">
        <p>${pack}</p>
      `;

      // --- Ouvrir le pack ---
      div.addEventListener("click", () => openPack(pack));
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Erreur lors du chargement des packs.</p>";
  }
});


// --- Ouvrir un pack ---
async function openPack(packName) {
  const confirmOpen = confirm(`Souhaitez-vous ouvrir le ${packName} ?`);
  if (!confirmOpen) return;

  // Animation d'ouverture
  const container = document.getElementById("packs-container");
  container.innerHTML = `
    <div class="opening-animation">
      <h2>Ouverture du ${packName}...</h2>
      <div class="pack-opening"></div>
    </div>
  `;

  try {
    // Récupération de tous les joueurs
    const res = await fetch("http://127.0.0.1:5001/skills");
    const allPlayers = await res.json();

    // Sélection aléatoire de joueurs selon le pack
    let numPlayers = 1;
    if (packName.toLowerCase().includes("gold")) numPlayers = 2;
    if (packName.toLowerCase().includes("diamond")) numPlayers = 3;

    const selectedPlayers = [];
    for (let i = 0; i < numPlayers; i++) {
      const random = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      selectedPlayers.push(random);
    }

    // Effet dramatique avant révélation 😄
    setTimeout(() => {
      container.innerHTML = `<h2>🎉 Voici tes nouveaux joueurs !</h2><div id="player-cards"></div>`;
      const cardsContainer = document.getElementById("player-cards");

      selectedPlayers.forEach(async (player, index) => {
        const card = document.createElement("div");
        card.className = "skill-card";

        const playerName = player.id || "Joueur inconnu";
        const playerStyle = player.style || "Classique";
        const playerImage = player.image?.startsWith("images/")
          ? `../${player.image}`
          : `../images/${player.image || "default-player.png"}`;

        // --- Détection si le joueur est un gardien ---
        const isGoalkeeper = playerStyle.toLowerCase() === "gardien";

        // --- Bloc d’affichage des stats ---
        let statsHTML = "";
        if (isGoalkeeper) {
          // 🔹 Stats spécifiques aux gardiens
          const DIV = player.div ?? 0;
          const HAN = player.han ?? 0;
          const KIC = player.kic ?? 0;
          const REF = player.ref ?? 0;
          const SPE = player.spd ?? 0;
          const POS = player.pos ?? 0;

          statsHTML = `
      <div class="skill-stats">
        <div class="skill-stat">🧤 ${DIV} DIV</div>
        <div class="skill-stat">🤲 ${HAN} HAN</div>
        <div class="skill-stat">🚀 ${KIC} KIC</div>
        <div class="skill-stat">⚡ ${REF} REF</div>
        <div class="skill-stat">🏃 ${SPE} SPE</div>
        <div class="skill-stat">🎯 ${POS} POS</div>
      </div>
    `;
        } else {
          // 🔹 Stats classiques pour les joueurs de champ
          const PAC = player.pac ?? 0;
          const SHO = player.sho ?? 0;
          const PAS = player.pas ?? 0;
          const DRI = player.dri ?? 0;
          const DEF = player.def ?? 0;
          const PHY = player.phy ?? 0;

          statsHTML = `
      <div class="skill-stats">
        <div class="skill-stat">⚡ ${PAC}</div>
        <div class="skill-stat">🎯 ${SHO}</div>
        <div class="skill-stat">🎩 ${PAS}</div>
        <div class="skill-stat">🌀 ${DRI}</div>
        <div class="skill-stat">🛡️ ${DEF}</div>
        <div class="skill-stat">💪 ${PHY}</div>
      </div>
    `;
        }

        // --- Structure finale de la carte ---
        card.innerHTML = `
    <div class="skill-image-container">
      <img src="${playerImage}" alt="${playerName}">
    </div>
    <div class="skill-header">${playerName}</div>
    <div class="skill-style">${playerStyle}</div>
    ${statsHTML}
  `;

        // --- Animation d’apparition ---
        setTimeout(() => {
          cardsContainer.appendChild(card);
          setTimeout(() => card.classList.add("show"), 100);
        }, index * 700);

        // --- Ajout automatique du joueur dans la collection ---
        try {
          const res = await fetch(`http://127.0.0.1:5001/users/${username}/add_player`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player_id: player.id })
          });
          const data = await res.json();
          console.log("✅ Joueur ajouté :", data.message);
        } catch (err) {
          console.error("❌ Erreur ajout joueur :", err);
        }
      });

      // 🟢 Après avoir affiché tous les joueurs, supprimer le pack ouvert
      setTimeout(async () => {
        try {
          const removeRes = await fetch(`http://127.0.0.1:5001/users/${username}/remove_pack`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pack_name: packName })
          });

          const removeData = await removeRes.json();
          if (removeRes.ok) {
            console.log(`🗑️ Pack "${packName}" supprimé avec succès.`);
          } else {
            console.warn("⚠️ Erreur suppression pack :", removeData.error);
          }
        } catch (err) {
          console.error("Erreur lors de la suppression du pack :", err);
        }
      }, selectedPlayers.length * 800 + 1000); // délai pour laisser le temps d'afficher les joueurs
      
    }, 2000);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Erreur lors de l'ouverture du pack.</p>";
  }
}
