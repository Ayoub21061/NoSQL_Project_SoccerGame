document.addEventListener("DOMContentLoaded", async () => {
  try {
    const player = JSON.parse(localStorage.getItem("player"));
    if (!player) throw new Error("Utilisateur non connecté.");

    const username = player.username;
    let currentCredits = player.credits ?? 0;

    const userRes = await fetch(`http://127.0.0.1:5001/players/${username}`);
    const userData = await userRes.json();
    const playerIds = userData.players_owned ?? [];

    const creditsSpan = document.getElementById("user-credits");
    if (creditsSpan) creditsSpan.textContent = `💰 Crédits : ${currentCredits}`;

    const skillsRes = await fetch("http://127.0.0.1:5001/skills");
    const skills = await skillsRes.json();

    const container = document.getElementById("skills-container");
    const searchInput = document.getElementById("search-input");
    const sortSelect = document.getElementById("sort-select");
    container.innerHTML = "";

    let myTeam = skills
      .filter(skill => playerIds.includes(skill.id))
      .map(skill => ({
        player_id: skill.id,
        id: skill.id,
        image: skill.image,
        style: skill.style,
        crédits: skill.crédits ?? 0
      }));

    localStorage.setItem("myTeam", JSON.stringify(myTeam));

    // Fonction d'affichage des cartes
    function renderSkills(skillsToDisplay) {
      container.innerHTML = "";

      skillsToDisplay.forEach(skill => {
        const card = document.createElement("div");
        card.className = "skill-card";

        const isGoalkeeper = skill.style?.toLowerCase() === "gardien";
        const statsHTML = isGoalkeeper
          ? `<div class="skill-stat"><strong>${skill.div ?? "-"}</strong><br>DIV</div>
             <div class="skill-stat"><strong>${skill.han ?? "-"}</strong><br>HAN</div>
             <div class="skill-stat"><strong>${skill.kic ?? "-"}</strong><br>KIC</div>
             <div class="skill-stat"><strong>${skill.ref ?? "-"}</strong><br>REF</div>
             <div class="skill-stat"><strong>${skill.spd ?? "-"}</strong><br>SPD</div>
             <div class="skill-stat"><strong>${skill.pos ?? "-"}</strong><br>POS</div>`
          : `<div class="skill-stat"><strong>${skill.pac ?? "-"}</strong><br>PAC</div>
             <div class="skill-stat"><strong>${skill.sho ?? "-"}</strong><br>SHO</div>
             <div class="skill-stat"><strong>${skill.pas ?? "-"}</strong><br>PAS</div>
             <div class="skill-stat"><strong>${skill.dri ?? "-"}</strong><br>DRI</div>
             <div class="skill-stat"><strong>${skill.def ?? "-"}</strong><br>DEF</div>
             <div class="skill-stat"><strong>${skill.phy ?? "-"}</strong><br>PHY</div>`;

        const imageSrc = skill.image
          ? `../images/${skill.image.split("/").pop()}`
          : "../images/default.png";

        const playerCredits = skill.crédits ?? 0;

        card.innerHTML = `
          <div class="skill-image-container">
            <img src="${imageSrc}" alt="${skill.id}" class="skill-image" />
          </div>
          <div class="skill-header">${skill.name ?? skill.id}</div>
          <div class="skill-style">${skill.style}</div>
          <div class="skill-stats">${statsHTML}</div>
          <div class="skill-extra">✨ Tech: ${skill.technical_moves ?? "-"} | 🦶 WF: ${skill.weak_foot ?? "-"}</div>
          <div class="skill-credits">💰 Crédit requis : ${playerCredits}</div>
        `;

        const buyButton = document.createElement("button");
        const alreadyBought = myTeam.some(p => p.player_id === skill.id);
        buyButton.textContent = alreadyBought ? "Déjà acheté" : "Acheter";
        buyButton.disabled = alreadyBought;

        buyButton.addEventListener("click", async () => {
          if (currentCredits < playerCredits) return alert("Crédits insuffisants !");
          try {
            const res = await fetch(`http://127.0.0.1:5001/users/players/${username}/buy_player`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ player_id: skill.id, cost: playerCredits })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur achat");

            currentCredits = data.credits;
            creditsSpan.textContent = `💰 Crédits : ${currentCredits}`;

            const newPlayer = {
              player_id: skill.id,
              id: skill.id,
              image: skill.image,
              style: skill.style,
              crédits: playerCredits
            };

            myTeam.push(newPlayer);
            localStorage.setItem("myTeam", JSON.stringify(myTeam));
            player.credits = currentCredits;
            localStorage.setItem("player", JSON.stringify(player));

            buyButton.textContent = "Déjà acheté";
            buyButton.disabled = true;
            alert(`${skill.name ?? skill.id} acheté !`);
          } catch (err) {
            console.error(err);
            alert("Erreur serveur, veuillez réessayer.");
          }
        });

        card.appendChild(buyButton);
        container.appendChild(card);
      });
    }

    // Fonction de filtrage et tri combinée
    function updateDisplay() {
      const query = searchInput?.value?.toLowerCase().trim() ?? "";
      const sortValue = sortSelect?.value ?? "default";

      let filtered = skills.filter(skill =>
        (skill.name ?? skill.id).toLowerCase().includes(query) ||
        (skill.style ?? "").toLowerCase().includes(query)
      );

      if (sortValue === "alphabetical") {
        filtered.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
      } else if (sortValue === "price-asc") {
        filtered.sort((a, b) => (a.crédits ?? 0) - (b.crédits ?? 0));
      } else if (sortValue === "price-desc") {
        filtered.sort((a, b) => (b.crédits ?? 0) - (a.crédits ?? 0));
      }

      renderSkills(filtered);
    }

    // Événements
    if (searchInput) searchInput.addEventListener("input", updateDisplay);
    if (sortSelect) sortSelect.addEventListener("change", updateDisplay);

    // Premier affichage
    renderSkills(skills);

  } catch (err) {
    console.error(err);
    alert("Erreur serveur, veuillez réessayer plus tard.");
  }
  
});
