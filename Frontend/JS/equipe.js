const teamContainer = document.getElementById("team-container");
const formationSelect = document.getElementById("formation");

const formations = {
  "4-4-2": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "FW", "FW"],
  "4-3-3": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"],
  "3-5-2": ["GK", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "MF", "FW", "FW"]
};

let myTeam = [];

// --- Initialisation ---
document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  if (!username) return alert("Utilisateur non connecté !");

  try {
    // Charger la team depuis DB
    const userRes = await fetch(`http://127.0.0.1:5001/users/${username}`);
    if (!userRes.ok) throw new Error("Erreur serveur");
    const userData = await userRes.json();

    const playerIds = userData.players_owned || [];

    // Charger tous les skills pour compléter les infos (image, style...)
    const skillsRes = await fetch("http://127.0.0.1:5001/skills");
    const skills = await skillsRes.json();

    myTeam = skills
      .filter(skill => playerIds.includes(skill.id))
      .map(skill => ({
        player_id: skill.id,
        id: skill.id,
        image: skill.image,
        style: skill.style
      }));

    // Sauvegarder localement
    localStorage.setItem("myTeam", JSON.stringify(myTeam));

    renderPlayers(myTeam);
    renderTeam(formationSelect.value, myTeam);

    formationSelect.addEventListener("change", () => renderTeam(formationSelect.value, myTeam));

  } catch (err) {
    console.error(err);
    alert("Impossible de récupérer ton équipe.");
  }
});

// --- Écouter les changements de localStorage ---
window.addEventListener("storage", (event) => {
  if (event.key === "myTeam") {
    myTeam = JSON.parse(event.newValue) || [];
    renderPlayers(myTeam);
    renderTeam(formationSelect.value, myTeam);
  }
});

// --- Affichage des joueurs achetés (non assignés sur le terrain) ---
function renderPlayers(myTeam) {
  const cardsContainer = document.querySelector(".player-cards-container");
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
function renderTeam(formation, myTeam) {
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
          renderPlayers(myTeam);
          renderTeam(formationSelect.value, myTeam);
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
        renderPlayers(myTeam);
        renderTeam(formationSelect.value, myTeam);
      });

      lineDiv.appendChild(slot);
    });

    teamContainer.appendChild(lineDiv);
  });
}

// --- Mise à jour côté serveur et localStorage ---
async function updateUserTeam() {
  const username = localStorage.getItem("username");
  if (!username) return;

  try {
    // Enregistre la team complète avec les assignedPositionLine
    await fetch(`http://127.0.0.1:5001/users/${username}/updatePlayers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players_owned: myTeam.map(p => p.player_id) })
    });

    localStorage.setItem("myTeam", JSON.stringify(myTeam));
  } catch (err) {
    console.error("Erreur mise à jour équipe :", err);
  }
}