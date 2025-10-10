document.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Récupérer le joueur depuis localStorage ---
    const player = JSON.parse(localStorage.getItem("player"));
    if (!player) throw new Error("Utilisateur non connecté.");

    const username = player.username;
    let currentCredits = player.credits ?? 0;

    // --- Charger les joueurs achetés ---
    const userRes = await fetch(`http://127.0.0.1:5001/players/${username}`);
    const userData = await userRes.json();
    const playerIds = userData.players_owned ?? [];

    //const creditsSpan = document.getElementById("credits");
    const creditsSpan = document.getElementById("user-credits");

    //if (creditsSpan) creditsSpan.textContent = currentCredits;
    if (creditsSpan) creditsSpan.textContent = `💰 Crédits : ${currentCredits}`;


    // --- Charger tous les skills ---
    const skillsRes = await fetch("http://127.0.0.1:5001/skills");
    const skills = await skillsRes.json();
    const container = document.getElementById("skills-container");
    container.innerHTML = "";

    let myTeam = skills
      .filter(skill => playerIds.includes(skill.id)) // Vérifier si déjà possédé
      .map(skill => ({
        player_id: skill.id,
        id: skill.id,
        image: skill.image,
        style: skill.style,
        crédits: skill.crédits ?? 0
      }));

    // Sauvegarde locale pour equipe.html
    localStorage.setItem("myTeam", JSON.stringify(myTeam));

    skills.forEach(skill => {
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
          <img src="../images/${skill.image.split("/").pop()}" alt="${skill.id}" class="skill-image" />
        </div>
        

        <div class="skill-header">${skill.id}</div>
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
          console.log("Réponse brute du serveur :", res);
    console.log("Données reçues :", data);

          if (!res.ok) throw new Error(data.error || "Erreur achat");

          // --- MAJ frontend ---
          currentCredits = data.credits;
          //creditsSpan.textContent = currentCredits;
          if (creditsSpan) creditsSpan.textContent = `💰 Crédits : ${currentCredits}`;


          const newPlayer = {
            player_id: skill.id,
            id: skill.id,
            image: skill.image,
            style: skill.style,
            crédits: playerCredits
          };
          myTeam.push(newPlayer);
          localStorage.setItem("myTeam", JSON.stringify(myTeam));

          // Mettre à jour le localStorage player aussi
          player.credits = currentCredits;
          localStorage.setItem("player", JSON.stringify(player));

          buyButton.textContent = "Déjà acheté";
          buyButton.disabled = true;
          alert(`${skill.name ?? skill.id} acheté !`);
        } catch (err) {
          console.error("Erreur achat joueur :", err);
          alert("Erreur serveur, veuillez réessayer.");
        }
      });

      card.appendChild(buyButton);
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    alert("Erreur serveur, veuillez réessayer plus tard.");
  }
});
