const teamContainer = document.getElementById("team-container");
const formationSelect = document.getElementById("formation");
const playersList = document.getElementById("players-list");

let myTeam = JSON.parse(localStorage.getItem("myTeam")) || [];

// Formations disponibles
const formations = {
  "4-4-2": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "FW", "FW"],
  "4-3-3": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"],
  "3-5-2": ["GK", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "MF", "FW", "FW"]
};

// Affichage des joueurs achetés (horizontal)
function renderPlayers() {
  const cardsContainer = document.querySelector(".player-cards-container");
  cardsContainer.innerHTML = "";

  if (myTeam.length === 0) {
    cardsContainer.innerHTML = "<p>Aucun joueur acheté.</p>";
    return;
  }

  myTeam.forEach(player => {
    if (player.assignedPositionLine) return;

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

// Affichage de la formation
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

      // Joueur déjà assigné
      const assignedPlayer = myTeam.find(p => p.assignedPositionLine === `${role}-${index}`);
      if (assignedPlayer) {
        const img = document.createElement("img");
        img.src = `../images/${assignedPlayer.image.split("/").pop()}`;
        img.alt = assignedPlayer.id;
        img.className = "team-player";
        img.draggable = true;

        // Retirer joueur au clic
        img.addEventListener("click", () => {
          delete assignedPlayer.assignedPositionLine;
          localStorage.setItem("myTeam", JSON.stringify(myTeam));
          renderPlayers();
          renderTeam(formationSelect.value);
        });

        // Drag & Drop pour swap
        img.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", assignedPlayer.player_id);
          e.dataTransfer.setData("from-list", "false");
        });

        slot.appendChild(img);
      }

      // Drop
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
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
            // Swap
            const oldPosition = player.assignedPositionLine;
            player.assignedPositionLine = existingPlayer.assignedPositionLine;
            existingPlayer.assignedPositionLine = oldPosition;
          } else {
            player.assignedPositionLine = `${role}-${index}`;
          }
        }

        localStorage.setItem("myTeam", JSON.stringify(myTeam));
        renderPlayers();
        renderTeam(formationSelect.value);
      });

      lineDiv.appendChild(slot);
    });

    teamContainer.appendChild(lineDiv);
  });
}

// Initialisation
renderPlayers();
renderTeam(formationSelect.value);

// Changement de formation
formationSelect.addEventListener("change", () => renderTeam(formationSelect.value));
