document.addEventListener("DOMContentLoaded", async () => {
  const teamContainer = document.getElementById("team-container");
  const formationSelect = document.getElementById("formation");
  const cardsContainer = document.querySelector(".player-cards-container");
  const chemistryDisplay = document.getElementById("team-chemistry");

  if (!teamContainer || !formationSelect || !cardsContainer) {
    console.error("Certains éléments du DOM sont manquants !");
    return;
  }

  // --- FORMATION 4-4-2 PERSONNALISÉE ---
  const formations = {
    "4-4-2": [
      "GK",         // Ligne 1
      "DD", "DCD", "DCG", "DG", // Ligne 2
      "MD", "MCD", "MCG", "MG", // Ligne 3
      "BUD", "BUG"              // Ligne 4
    ],
  };

  let myTeam = [];

  // --- RÉCUP UTILISATEUR ---
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Utilisateur non connecté !");
    return;
  }

  try {
    const userRes = await fetch(`http://127.0.0.1:5001/players/username/${username}`);
    const userData = await userRes.json();
    const playerIds = userData.players_owned || [];

    const skillsRes = await fetch("http://127.0.0.1:5001/skills");
    const skills = await skillsRes.json();

    myTeam = skills
      .filter(skill => playerIds.includes(skill.id))
      .map(skill => ({
        player_id: skill.id,
        id: skill.id,
        image: skill.image,
        style: skill.style,
        country: skill.country,
        club: skill.club,
      }));

    localStorage.setItem("myTeam", JSON.stringify(myTeam));

    renderPlayers();
    renderTeam(formationSelect.value || "4-4-2");

    formationSelect.addEventListener("change", () =>
      renderTeam(formationSelect.value)
    );
  } catch (err) {
    console.error(err);
    alert("Impossible de récupérer ton équipe.");
  }

  // --- ÉCOUTER LE STORAGE ---
  window.addEventListener("storage", (event) => {
    if (event.key === "myTeam") {
      myTeam = JSON.parse(event.newValue) || [];
      renderPlayers();
      renderTeam(formationSelect.value);
    }
  });

  // --- AFFICHER LES JOUEURS DISPONIBLES ---
  function renderPlayers() {
    cardsContainer.innerHTML = "";

    const availablePlayers = myTeam.filter((p) => !p.assignedPositionLine);
    if (availablePlayers.length === 0) {
      cardsContainer.innerHTML = "<p>Aucun joueur disponible.</p>";
      return;
    }

    availablePlayers.forEach((player) => {
      const card = document.createElement("div");
      card.className = "skill-card";
      card.draggable = true;
      card.dataset.playerId = player.player_id;

      card.innerHTML = `
        <img src="../images/${player.image.split("/").pop()}" alt="${player.id}" class="player-mini" />
        <div>${player.id}</div>
      `;

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", player.player_id);
        e.dataTransfer.setData("from-list", "true");
      });

      cardsContainer.appendChild(card);
    });
  }

  async function updateUserTeam() {
    localStorage.setItem("myTeam", JSON.stringify(myTeam));
    const username = localStorage.getItem("username");
    if (!username) return;

    await fetch(`http://127.0.0.1:5001/players/updateTeam/${username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ myTeam }),
    }).catch(() => {});
  }

  // --- AFFICHER LA FORMATION ---
  function renderTeam(formation) {
    teamContainer.innerHTML = "";

    const positions = formations[formation];
    const structure = {
      line1: ["GK"],
      line2: ["DD", "DCD", "DCG", "DG"],
      line3: ["MD", "MCD", "MCG", "MG"],
      line4: ["BUD", "BUG"],
    };

    Object.entries(structure).forEach(([lineKey, posArray], lineIndex) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "team-line";
      lineDiv.dataset.lineIndex = lineIndex;

      posArray.forEach((pos, index) => {
        const slot = document.createElement("div");
        slot.className = "team-slot";
        slot.dataset.position = pos;
        slot.dataset.lineIndex = lineIndex;
        slot.dataset.index = index;

        const label = document.createElement("div");
        label.className = "position-label";
        label.textContent = pos;
        slot.appendChild(label);

        const assignedPlayer = myTeam.find(
          (p) => p.assignedPositionLine === `${lineIndex}-${index}`
        );
        if (assignedPlayer) {
          const img = document.createElement("img");
          img.src = `../images/${assignedPlayer.image.split("/").pop()}`;
          img.alt = assignedPlayer.id;
          img.className = "team-player";
          img.draggable = true;
          img.dataset.playerId = assignedPlayer.player_id;

          img.addEventListener("click", async () => {
            delete assignedPlayer.assignedPositionLine;
            await updateUserTeam();
            renderPlayers();
            renderTeam(formation);
          });

          img.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", assignedPlayer.player_id);
            e.dataTransfer.setData("from-list", "false");
          });

          slot.appendChild(img);
        }

        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", async (e) => {
          e.preventDefault();
          const playerId = e.dataTransfer.getData("text/plain");
          const fromList = e.dataTransfer.getData("from-list") === "true";
          const player = myTeam.find((p) => p.player_id == playerId);
          if (!player) return;

          const existingPlayer = myTeam.find(
            (p) => p.assignedPositionLine === `${lineIndex}-${index}`
          );

          if (fromList) {
            if (existingPlayer) {
              alert("Ce poste est déjà occupé !");
              return;
            }
            player.assignedPositionLine = `${lineIndex}-${index}`;
          } else {
            if (existingPlayer) {
              const oldPosition = player.assignedPositionLine;
              player.assignedPositionLine = existingPlayer.assignedPositionLine;
              existingPlayer.assignedPositionLine = oldPosition;
            } else {
              player.assignedPositionLine = `${lineIndex}-${index}`;
            }
          }

          await updateUserTeam();
          renderPlayers();
          renderTeam(formation);
        });

        lineDiv.appendChild(slot);
      });

      teamContainer.appendChild(lineDiv);
    });

    setTimeout(() => {
      renderLinks();
      calculateTeamChemistry();
    }, 150);
  }

  // --- DÉFINITION DES LIENS (4-4-2 PERSONNALISÉ) ---
  const linksMap = {
    GK: ["DCD", "DCG"],
    DCD: ["GK", "MCD", "DCG", "DD"],
    DCG: ["GK", "MCG", "DCD", "DG"],
    DD: ["DCD", "MD"],
    DG: ["DCG", "MG"],
    MD: ["DD", "MCD", "BUD"],
    MG: ["DG", "MCG", "BUG"],
    MCD: ["DCD", "MD", "MCG", "BUD"],
    MCG: ["DCG", "MG", "MCD", "BUG"],
    BUD: ["MD", "MCD", "BUG"],
    BUG: ["MG", "MCG", "BUD"],
  };

  // --- AFFICHER LES LIENS ---
  function renderLinks() {
  document.querySelectorAll(".link-line").forEach((l) => l.remove());
  const slots = Array.from(document.querySelectorAll(".team-slot"));

  slots.forEach((slot) => {
    const pos = slot.dataset.position;
    const related = linksMap[pos] || [];

    related.forEach((targetPos) => {
      const targetSlot = slots.find((s) => s.dataset.position === targetPos);
      if (!targetSlot) return;

      const key = [pos, targetPos].sort().join("-");
      if (teamContainer.querySelector(`[data-link-key='${key}']`)) return;

      const startRect = slot.getBoundingClientRect();
      const endRect = targetSlot.getBoundingClientRect();
      const parent = teamContainer.getBoundingClientRect();

      // Centres exacts des bulles
      const x1 = startRect.left + startRect.width / 2 - parent.left;
      const y1 = startRect.top + startRect.height / 2 - parent.top;
      const x2 = endRect.left + endRect.width / 2 - parent.left;
      const y2 = endRect.top + endRect.height / 2 - parent.top;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const player1 = myTeam.find(
        (p) => p.assignedPositionLine === `${slot.dataset.lineIndex}-${slot.dataset.index}`
      );
      const player2 = myTeam.find(
        (p) => p.assignedPositionLine === `${targetSlot.dataset.lineIndex}-${targetSlot.dataset.index}`
      );
      if (!player1 || !player2) return;

      // Décalage pour que la ligne touche juste le bord du cercle
      const radiusStart = startRect.width / 2;
      const radiusEnd = endRect.width / 2;
      const cosA = dx / distance;
      const sinA = dy / distance;

      const startX = x1 + cosA * radiusStart;
      const startY = y1 + sinA * radiusStart;
      const endX = x2 - cosA * radiusEnd;
      const endY = y2 - sinA * radiusEnd;

      const adjustedDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

      const link = document.createElement("div");
      link.className = "link-line";
      link.dataset.linkKey = key;

      link.style.width = `${adjustedDistance}px`;
      link.style.left = `${startX + (endX - startX) / 2 - adjustedDistance / 2}px`;
      link.style.top = `${startY + (endY - startY) / 2 - 2}px`;
      link.style.transform = `rotate(${angle}deg)`;
      link.style.backgroundColor = getLinkColor(player1, player2);
      link.style.height = "4px";
      link.style.borderRadius = "2px";
      link.style.position = "absolute";
      link.style.zIndex = "0";

      teamContainer.appendChild(link);
    });
  });
}



  // --- COULEUR DES LIENS ---
  function getLinkColor(p1, p2) {
    if (!p1 || !p2) return "#555";
    if (p1.club === p2.club && p1.country === p2.country) return "limegreen";
    if (p1.club === p2.club || p1.country === p2.country) return "orange";
    return "red";
  }

  // --- CALCUL DU COLLECTIF ---
  function calculateTeamChemistry() {
    const links = Array.from(document.querySelectorAll(".link-line"));
    const green = links.filter((l) => l.style.backgroundColor === "limegreen").length;
    const orange = links.filter((l) => l.style.backgroundColor === "orange").length;
    const total = links.length;

    const score = total === 0 ? 0 : ((green * 2 + orange) / (total * 2)) * 100;
    chemistryDisplay.textContent = `Collectif: ${Math.round(score)}%`;
  }
});
