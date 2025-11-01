document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM Elements ---
  const teamContainer = document.getElementById("team-container");
  const formationSelect = document.getElementById("formation");
  const cardsContainer = document.querySelector(".player-cards-container");

  if (!teamContainer || !formationSelect || !cardsContainer) {
    console.error("Certains éléments du DOM sont manquants !");
    return;
  }

  // --- Formations disponibles ---
  const formations = {
    "4-4-2": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "FW", "FW"],
    "4-3-3": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"],
    "3-5-2": ["GK", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "MF", "FW", "FW"]
  };

  let myTeam = [];

  // --- Récupérer l'utilisateur ---
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Utilisateur non connecté !");
    return;
  }

  try {
    // Charger la team depuis DB
    const userRes = await fetch(`http://127.0.0.1:5001/players/username/${username}`);
    if (!userRes.ok) throw new Error("Erreur serveur");
    const userData = await userRes.json();
    const playerIds = userData.players_owned || [];

    // Charger tous les skills
    const skillsRes = await fetch("http://127.0.0.1:5001/skills");
    if (!skillsRes.ok) throw new Error("Erreur serveur");
    const skills = await skillsRes.json();

    myTeam = skills
      .filter(skill => playerIds.includes(skill.id))
      .map(skill => ({
        player_id: skill.id,
        id: skill.id,
        image: skill.image,
        style: skill.style,
        _id: skill._id,
        energy: skill.energy,
        contracts: skill.contracts
      }));

    localStorage.setItem("myTeam", JSON.stringify(myTeam));

    // --- Afficher les joueurs et la formation ---
    renderPlayers();
    renderTeam(formationSelect.value);

    formationSelect.addEventListener("change", () => renderTeam(formationSelect.value));

  } catch (err) {
    console.error(err);
    alert("Impossible de récupérer ton équipe.");
  }

  // --- Écouter les changements de localStorage ---
  window.addEventListener("storage", (event) => {
    if (event.key === "myTeam") {
      myTeam = JSON.parse(event.newValue) || [];
      renderPlayers();
      renderTeam(formationSelect.value);
    }
  });

  // --- Affichage des joueurs achetés ---
  function renderPlayers() {
    cardsContainer.innerHTML = "";

    const availablePlayers = myTeam.filter(p => !p.assignedPositionLine);

    if (availablePlayers.length === 0) {
      cardsContainer.innerHTML = "<p>Aucun joueur disponible.</p>";
      return;
    }

    availablePlayers.forEach(player => {
      const card = document.createElement("div");
      card.className = "skill-card";
      card.draggable = true;
      card.dataset.playerId = player.player_id;

      card.innerHTML = `
        <img src="../images/${player.image.split("/").pop()}" alt="${player.id}" class="player-mini" />
        <div>${player.id}</div>
      `;

      card.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", player.player_id);
        e.dataTransfer.setData("from-list", "true");
      });

      cardsContainer.appendChild(card);
    });
  }

  // --- Affichage de la formation ---
  function renderTeam(formation) {
    teamContainer.innerHTML = "";

    const positions = formations[formation];
    const lines = { GK: [], DF: [], MF: [], FW: [] };
    positions.forEach(pos => lines[pos].push(pos));

    Object.entries(lines).forEach(([role, arr]) => {
      if (arr.length === 0) return;

      const lineDiv = document.createElement("div");
      lineDiv.className = "team-line";

      arr.forEach((pos, index) => {
        const slot = document.createElement("div");
        slot.className = "team-slot";
        slot.dataset.position = pos;
        slot.dataset.index = index;

        if (role === "GK") {
          const label = document.createElement("div");
          label.className = "position-label";
          label.textContent = pos;
          slot.appendChild(label);
        }

        const assignedPlayer = myTeam.find(p => p.assignedPositionLine === `${role}-${index}`);
        if (assignedPlayer) {
          const img = document.createElement("img");
          img.src = `../images/${assignedPlayer.image.split("/").pop()}`;
          img.alt = assignedPlayer.id;
          img.className = "team-player";
          img.draggable = true;

          img.addEventListener("click", async () => {
            delete assignedPlayer.assignedPositionLine;
            await updateUserTeam();
            renderPlayers();
            renderTeam(formationSelect.value);
          });

          img.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", assignedPlayer.player_id);
            e.dataTransfer.setData("from-list", "false");
          });

          slot.appendChild(img);
        }

        slot.addEventListener("dragover", e => e.preventDefault());
        slot.addEventListener("drop", async e => {
          const playerId = e.dataTransfer.getData("text/plain");
          const fromList = e.dataTransfer.getData("from-list") === "true";
          const player = myTeam.find(p => p.player_id == playerId);
          if (!player) return;

          const existingPlayer = myTeam.find(p => p.assignedPositionLine === `${role}-${index}`);

          if (fromList) {
            if (existingPlayer) {
              alert("Ce poste est déjà occupé !");
              return;
            }
            player.assignedPositionLine = `${role}-${index}`;
          } else {
            if (existingPlayer) {
              const oldPosition = player.assignedPositionLine;
              player.assignedPositionLine = existingPlayer.assignedPositionLine;
              existingPlayer.assignedPositionLine = oldPosition;
            } else {
              player.assignedPositionLine = `${role}-${index}`;
            }
          }

          await updateUserTeam();
          renderPlayers();
          renderTeam(formationSelect.value);
        });

        lineDiv.appendChild(slot);
      });

      teamContainer.appendChild(lineDiv);
    });
  }

  // --- Mise à jour côté serveur et localStorage ---
  async function updateUserTeam() {
    try {
      await fetch(`http://127.0.0.1:5001/players/${username}/updatePlayers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players_owned: myTeam.map(p => p.player_id) })
      });

      localStorage.setItem("myTeam", JSON.stringify(myTeam));
    } catch (err) {
      console.error("Erreur mise à jour équipe :", err);
    }
  }

  // --- Affichage des contrats et formes ---
  const contractsFormsContainer = document.getElementById("contracts-forms-container");
  if (contractsFormsContainer) {
    try {
      const res = await fetch("http://127.0.0.1:5001/contracts_forms");
      if (!res.ok) throw new Error("Erreur serveur");
      const allItems = await res.json();

      const userRes = await fetch(`http://127.0.0.1:5001/players/username/${username}`);
      if (!userRes.ok) throw new Error("Erreur serveur");
      const userData = await userRes.json();
      const ownedIds = (userData.contrats_formes || []).map(id => id.toString());

      const ownedItems = allItems.filter(item => ownedIds.includes(item._id?.toString()));
      contractsFormsContainer.innerHTML = "";

      if (ownedItems.length === 0) {
        contractsFormsContainer.innerHTML = "<p>Aucun contrat ou forme acheté.</p>";
      } else {
        ownedItems.forEach(item => {
          const card = document.createElement("div");
          card.className = `skill-card ${item.type}`;
          const imgSrc = item.image ? `../images/${item.image}` : "../images/default.png";
          card.innerHTML = `
            <div class="skill-image-container">
              <img src="${imgSrc}" alt="${item.name}">
            </div>
            <div class="skill-header">${item.name}</div>
            <div class="skill-style">${item.type}</div>
            <div class="skill-extra">${item.bonus}</div>
          `;

          card.addEventListener("click", () => {
            createPopup(item);
          });

          contractsFormsContainer.appendChild(card);
        });
      }

    } catch (err) {
      console.error("Erreur chargement contrats/formes :", err);
      contractsFormsContainer.innerHTML = "<p>Impossible de charger les contrats et formes.</p>";
    }
  }

  // --- FONCTION POPUP ---
function createPopup(item) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup-window";

  popup.innerHTML = `
    <h3>Appliquer ${item.name}</h3>
    <p>Choisis un joueur à qui l’appliquer :</p>
    <select id="player-select" class="popup-select">
      ${myTeam.map(p => `<option value="${p.id}">${p.id}</option>`).join("")}
    </select>
    <div class="popup-buttons">
      <button id="apply-item" class="popup-btn apply">Appliquer</button>
      <button id="cancel-popup" class="popup-btn cancel">Annuler</button>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Annuler popup
  document.getElementById("cancel-popup").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  document.getElementById("apply-item").addEventListener("click", async () => {
    const selectedPlayerName = document.getElementById("player-select").value;
    const player = myTeam.find(p => p.id === selectedPlayerName);

    if (!player || !player._id) {
      alert("Joueur introuvable dans la base de données");
      return;
    }

    try {
      // --- 1️⃣ Mettre à jour le joueur ---
      let updatedData = {};
      if (item.type === "contrat") {
        updatedData.contracts = (player.contracts || 0) + item.bonus;
      } else if (item.type === "forme") {
        updatedData.energy = Math.min((player.energy || 100) + item.bonus, 100);
      }

      const res = await fetch(`http://127.0.0.1:5001/skills/updatePlayerStats/${player._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      if (!res.ok) throw new Error("Erreur mise à jour joueur");

      // --- 2️⃣ Supprimer le contrat/forme côté serveur ---
      const deleteRes = await fetch(
        `http://127.0.0.1:5001/players/username/${username}/removeItem/${item._id}`,
        { method: "DELETE" }
      );
      if (!deleteRes.ok) throw new Error("Erreur suppression item");

      // --- 3️⃣ Supprimer la carte du DOM ---
      const card = [...contractsFormsContainer.children].find(
        c => c.querySelector(".skill-header")?.textContent === item.name
      );
      if (card) contractsFormsContainer.removeChild(card);

      // --- 4️⃣ Fermer le popup ---
      document.body.removeChild(overlay);

      alert(`${item.name} appliqué avec succès à ${player.id} !`);

    } catch (err) {
      console.error(err);
      alert("Erreur lors de l’application du bonus");
    }
  });
}



});
