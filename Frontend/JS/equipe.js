document.addEventListener("DOMContentLoaded", async () => {
  const teamContainer = document.getElementById("team-container");
  const formationSelect = document.getElementById("formation");
  const cardsContainer = document.querySelector(".player-cards-container");
  const chemistryDisplay = document.getElementById("team-chemistry");
  const kitsContainer = document.getElementById("kits-container");

  if (!teamContainer || !formationSelect || !cardsContainer) {
    console.error("Certains éléments du DOM sont manquants !");
    return;
  }

  // --- FORMATIONS PERSONNALISÉES ---
  const formations = {
    "4-4-2": [
      "GK", "DD", "DCD", "DCG", "DG",
      "MD", "MCD", "MCG", "MG",
      "BUD", "BUG"
    ],
    "4-3-3": [
      "GK", "DD", "DCD", "DCG", "DG",
      "MCD", "MC", "MCG",
      "AD", "AC", "AG"
    ],
  };

  const formationLines = {
    "4-4-2": [
      ["GK"],
      ["DD", "DCD", "DCG", "DG"],
      ["MD", "MCD", "MCG", "MG"],
      ["BUD", "BUG"]
    ],
    "4-3-3": [
      ["GK"],
      ["DD", "DCD", "DCG", "DG"],
      ["MCD", "MC", "MCG"],
      ["AD", "AC", "AG"]
    ]
  };

  let myTeam = [];
  let username = localStorage.getItem("username");
  if (!username) {
    alert("Utilisateur non connecté !");
    return;
  }

  try {
    // --- Récupération du joueur ---
    const userRes = await fetch(`http://127.0.0.1:5001/players/username/${username}`);
    const userData = await userRes.json();

    // --- Ajouter automatiquement les maillots du Battle Pass ---
    if (!userData.claimed_rewards) userData.claimed_rewards = [];
    const newKits = userData.achievements.filter(a =>
      a.reward?.exclusive_kit && !userData.claimed_rewards.some(r => r.id === a.id)
    );

    for (const kit of newKits) {
      userData.claimed_rewards.push(kit);
      await fetch(`http://127.0.0.1:5001/players/add_claimed_reward/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward: kit })
      });
    }

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
        _id: skill._id,
        energy: skill.energy,
        contracts: skill.contracts
      }));

    localStorage.setItem("myTeam", JSON.stringify(myTeam));

    renderPlayers();
    renderKits(userData);
    renderTeam(formationSelect.value || "4-4-2");

    formationSelect.addEventListener("change", () =>
      renderTeam(formationSelect.value)
    );
  } catch (err) {
    console.error(err);
    alert("Impossible de récupérer ton équipe.");
  }

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
        <div class="player-name">${player.id}</div>
        <div class="player-info">
          <p>Contracts : <span>${player.contracts ?? 0}</span></p>
          <p>Energy : <span>${player.energy ?? 100}</span></p>
        </div>
      `;

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", player.player_id);
        e.dataTransfer.setData("from-list", "true");
      });
      
      card.addEventListener("click", () => {
        showPlayerDetails(player);
      });

      cardsContainer.appendChild(card);
    });
  }

  async function updateUserTeam() {
    localStorage.setItem("myTeam", JSON.stringify(myTeam));
    if (!username) return;

    await fetch(`http://127.0.0.1:5001/players/updateTeam/${username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ myTeam }),
    }).catch(() => { });
  }

  // --- AFFICHER LA FORMATION ---
  function renderTeam(formation) {
    teamContainer.innerHTML = "";
    const structure = formationLines[formation];
    const selectedKitId = localStorage.getItem("selectedKit");

    // Récupérer l'image du kit sélectionné
    let selectedKitImage = null;
    if (selectedKitId) {
      const kits = document.querySelectorAll(".kit-card");
      const selectedDiv = Array.from(kits).find(k => k.dataset.kitId === selectedKitId);
      if (selectedDiv) {
        const img = selectedDiv.querySelector("img");
        if (img) selectedKitImage = img.src;
      }
    }

    structure.forEach((lineArray, lineIndex) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "team-line";
      lineDiv.dataset.lineIndex = lineIndex;

      lineArray.forEach((pos, index) => {
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
          // --- Image du joueur ---
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

          // --- Logo du kit ---
          const kitLogo = document.createElement("img");
          kitLogo.className = "team-player-kit-logo";
          if (selectedKitImage) {
            kitLogo.src = selectedKitImage;
            kitLogo.style.display = "block";
          } else {
            kitLogo.style.display = "none";
          }
          slot.appendChild(kitLogo);
        }

        // --- Drag & Drop ---
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
            if (existingPlayer) { alert("Ce poste est déjà occupé !"); return; }
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
      renderLinks(formation);
      calculateTeamChemistry();
    }, 150);
  }


  const linksByFormation = {
    "4-4-2": {
      GK: ["DCD", "DCG"], DCD: ["GK", "MCD", "DCG", "DD"], DCG: ["GK", "MCG", "DCD", "DG"],
      DD: ["DCD", "MD"], DG: ["DCG", "MG"], MD: ["DD", "MCD", "BUD"], MG: ["DG", "MCG", "BUG"],
      MCD: ["DCD", "MD", "MCG", "BUD"], MCG: ["DCG", "MG", "MCD", "BUG"], BUD: ["MD", "MCD", "BUG"],
      BUG: ["MG", "MCG", "BUD"],
    },
    "4-3-3": {
      GK: ["DCD", "DCG"], DCD: ["GK", "MC", "DCG", "DD"], DCG: ["GK", "DCD", "DG", "MC"],
      DD: ["DCD", "MCD"], DG: ["DCG", "MCG"], MC: ["DCD", "DCG", "AC", "MCD", "MCG"],
      MCD: ["DD", "MC", "AD"], MCG: ["MC", "DG", "AG"], AD: ["MCD", "AC"], AC: ["AD", "MC", "AG"], AG: ["MCG", "AC"],
    }
  };

  function renderLinks(formation) {
    document.querySelectorAll(".link-line").forEach((l) => l.remove());
    const slots = Array.from(document.querySelectorAll(".team-slot"));
    const linksMap = linksByFormation[formation];

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

  function getLinkColor(p1, p2) {
    if (!p1 || !p2) return "#555";
    if (p1.club === p2.club && p1.country === p2.country) return "limegreen";
    if (p1.club === p2.club || p1.country === p2.country) return "orange";
    return "red";
  }

  function calculateTeamChemistry() {
    const links = Array.from(document.querySelectorAll(".link-line"));
    const green = links.filter((l) => l.style.backgroundColor === "limegreen").length;
    const orange = links.filter((l) => l.style.backgroundColor === "orange").length;
    const total = links.length;
    const score = total === 0 ? 0 : ((green * 2 + orange) / (total * 2)) * 100;
    chemistryDisplay.textContent = `Collectif: ${Math.round(score)}%`;
  }

  // --- AFFICHER LES MAILLOTS ---
  function renderKits(userData) {
    if (!kitsContainer) return;
    kitsContainer.innerHTML = "";

    fetch("http://127.0.0.1:5001/achievements")
      .then(res => res.json())
      .then(allAchievements => {
        const kits = allAchievements.filter(a =>
          userData.claimed_rewards.includes(a.id) &&
          a.reward?.exclusive_kit
        );

        if (kits.length === 0) {
          kitsContainer.innerHTML = "<p>Aucun maillot obtenu pour le moment.</p>";
          return;
        }

        kits.forEach(kit => {
          const imageName = kit.reward.exclusive_kit; // ex: "kit_diamond.png"
          const imagePath = `../images/${imageName}`; // ✅ bon dossier

          const kitDiv = document.createElement("div");
          kitDiv.className = "kit-card";
          kitDiv.dataset.kitId = kit.id;
          kitDiv.innerHTML = `
            <img src="${imagePath}" alt="${kit.name}" class="kit-img" 
                 onerror="this.src='../images/default-kit.png'">
          `;

          kitDiv.addEventListener("click", () => {
            localStorage.setItem("selectedKit", kit.id);
            document.querySelectorAll(".kit-card").forEach(k => k.classList.remove("selected-kit"));
            kitDiv.classList.add("selected-kit");
            applyKitToTeam(kit);
          });

          kitsContainer.appendChild(kitDiv);
        });

        const selectedKitId = localStorage.getItem("selectedKit");
        if (selectedKitId) {
          const selectedDiv = kitsContainer.querySelector(`[data-kit-id='${selectedKitId}']`);
          if (selectedDiv) selectedDiv.classList.add("selected-kit");
        }
      })
      .catch(err => {
        console.error("Erreur lors du chargement des maillots :", err);
        kitsContainer.innerHTML = "<p>Erreur lors du chargement des maillots.</p>";
      });
  }

  function applyKitToTeam(kit) {
    const slots = document.querySelectorAll(".team-slot");
    slots.forEach(slot => {
      const playerImg = slot.querySelector(".team-player");
      const kitLogo = slot.querySelector(".team-player-kit-logo");
      if (playerImg && kitLogo) {
        kitLogo.src = `../images/${kit.reward.exclusive_kit}`;
        kitLogo.style.display = "block";
      }
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
        //Mettre à jour le joueur 
        let updatedData = {};
        if (item.type === "contrat") {
          updatedData.contracts = (player.contracts || 0) + item.bonus;
        } else if (item.type === "forme") {
          updatedData.energy = (player.energy || 0) + item.bonus;
        }

        const res = await fetch(`http://127.0.0.1:5001/skills/updatePlayerStats/${player._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        });

        if (!res.ok) throw new Error("Erreur mise à jour joueur");

        // Supprimer le contrat/forme côté serveur 
        const deleteRes = await fetch(
          `http://127.0.0.1:5001/players/username/${username}/removeItem/${item._id}`,
          { method: "DELETE" }
        );
        if (!deleteRes.ok) throw new Error("Erreur suppression item");

        // Supprimer la carte du DOM 
        const card = [...contractsFormsContainer.children].find(
          c => c.querySelector(".skill-header")?.textContent === item.name
        );
        if (card) contractsFormsContainer.removeChild(card);

        // Fermer le popup 
        document.body.removeChild(overlay);

        alert(`${item.name} appliqué avec succès à ${player.id} !`);

      } catch (err) {
        console.error(err);
        alert("Erreur lors de l’application du bonus");
      }
    });
  }

  async function showPlayerDetails(player) {
    // essayer de récupérer la version complète côté serveur via skills/<_id>
    let fullPlayer = null;
    try {
      // player._id doit exister dans myTeam 
      if (player._id) {
        const res = await fetch(`http://127.0.0.1:5001/skills/${player._id}`);
        if (res.ok) {
          fullPlayer = await res.json();
          // si le backend renvoie _id en ObjectId transformé, il faut le convertir en string
          if (fullPlayer._id) fullPlayer._id = String(fullPlayer._id);
        } else {
          console.warn("Impossible de charger les détails depuis le serveur, status:", res.status);
        }
      } else {
        console.warn("player._id introuvable, utilisation des données locales");
      }
    } catch (err) {
      console.warn("Erreur fetch détail joueur :", err);
    }


    const p = fullPlayer || player;


    const isGoalkeeper = (p.style || "").toLowerCase() === "gardien";
    const statsHTML = isGoalkeeper
      ? `<div class="skill-stat"><strong>${p.div ?? "-"}</strong><br>DIV</div>
       <div class="skill-stat"><strong>${p.han ?? "-"}</strong><br>HAN</div>
       <div class="skill-stat"><strong>${p.kic ?? "-"}</strong><br>KIC</div>
       <div class="skill-stat"><strong>${p.ref ?? "-"}</strong><br>REF</div>
       <div class="skill-stat"><strong>${p.spd ?? "-"}</strong><br>SPD</div>
       <div class="skill-stat"><strong>${p.pos ?? "-"}</strong><br>POS</div>`
      : `<div class="skill-stat"><strong>${p.pac ?? "-"}</strong><br>PAC</div>
       <div class="skill-stat"><strong>${p.sho ?? "-"}</strong><br>SHO</div>
       <div class="skill-stat"><strong>${p.pas ?? "-"}</strong><br>PAS</div>
       <div class="skill-stat"><strong>${p.dri ?? "-"}</strong><br>DRI</div>
       <div class="skill-stat"><strong>${p.def ?? "-"}</strong><br>DEF</div>
       <div class="skill-stat"><strong>${p.phy ?? "-"}</strong><br>PHY</div>`;

    const imageSrc = p.image ? `../images/${p.image.split("/").pop()}` : "../images/default.png";


    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";

    const popup = document.createElement("div");
    popup.className = "popup-window player-detail-popup";

    popup.innerHTML = `
    <h3>${p.name ?? p.id}</h3>
    <div class="skill-image-container">
      <img src="${imageSrc}" alt="${p.id}" class="skill-image" />
    </div>
    <div class="skill-style">${p.style ?? "-"}</div>
    <div class="skill-stats">${statsHTML}</div>
    <div class="skill-extra">✨ Tech: ${p.technical_moves ?? "-"} | 🦶 WF: ${p.weak_foot ?? "-"}</div>
    <div class="skill-meta">
      Énergie : ${p.energy ?? "-"}<br>
      Contrats : ${p.contracts ?? "-"}
    </div>
    <button id="close-player-popup" class="popup-btn cancel">Fermer</button>
  `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    document.getElementById("close-player-popup").addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
  }

});