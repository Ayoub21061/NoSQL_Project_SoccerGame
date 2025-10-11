document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Récupération des crédits du joueur
    let currentCredits = parseInt(localStorage.getItem("credits")) || 100000;
    // 🔄 Réinitialisation manuelle (à commenter ou supprimer après test)
    localStorage.setItem("credits", 100000);
    const creditsSpan = document.getElementById("credits");
    if (creditsSpan) creditsSpan.textContent = currentCredits;

    // Récupération des skills depuis le serveur
    const response = await fetch("http://127.0.0.1:5001/skills");
    const skills = await response.json();

    const container = document.getElementById("skills-container");
    container.innerHTML = "";

    skills.forEach(skill => {
      const card = document.createElement("div");
      card.className = "skill-card";

      const isGoalkeeper = skill.style && skill.style.toLowerCase() === "gardien";

      const statsHTML = isGoalkeeper
        ? `
          <div class="skill-stat"><strong>${skill.div ?? "-"}</strong><br>DIV</div>
          <div class="skill-stat"><strong>${skill.han ?? "-"}</strong><br>HAN</div>
          <div class="skill-stat"><strong>${skill.kic ?? "-"}</strong><br>KIC</div>
          <div class="skill-stat"><strong>${skill.ref ?? "-"}</strong><br>REF</div>
          <div class="skill-stat"><strong>${skill.spd ?? "-"}</strong><br>SPD</div>
          <div class="skill-stat"><strong>${skill.pos ?? "-"}</strong><br>POS</div>
        `
        : `
          <div class="skill-stat"><strong>${skill.pac ?? "-"}</strong><br>PAC</div>
          <div class="skill-stat"><strong>${skill.sho ?? "-"}</strong><br>SHO</div>
          <div class="skill-stat"><strong>${skill.pas ?? "-"}</strong><br>PAS</div>
          <div class="skill-stat"><strong>${skill.dri ?? "-"}</strong><br>DRI</div>
          <div class="skill-stat"><strong>${skill.def ?? "-"}</strong><br>DEF</div>
          <div class="skill-stat"><strong>${skill.phy ?? "-"}</strong><br>PHY</div>
        `;

      const imageSrc = `../images/${skill.image.split("/").pop()}`;
      const credits = skill.credits ?? Math.floor(Math.random() * 1000) + 100;

      card.innerHTML = `
        <div class="skill-image-container">
          <img src="${imageSrc}" alt="${skill.id}" class="skill-image" />
        </div>
        <div class="skill-header">${skill.id}</div>
        <div class="skill-style">${skill.style}</div>
        <div class="skill-stats">${statsHTML}</div>
        <div class="skill-extra">✨ Tech: ${skill.technical_moves ?? "-"} | 🦶 WF: ${skill.weak_foot ?? "-"}</div>
        <div class="skill-credits">💰 Crédit requis : ${credits}</div>
      `;

      // Bouton d'achat
      const buyButton = document.createElement("button");
      buyButton.textContent = "Acheter";
      buyButton.addEventListener("click", () => {
        let myTeam = JSON.parse(localStorage.getItem("myTeam")) || [];

        // Vérifie si le joueur est déjà acheté
        if (myTeam.find(p => p.player_id === skill.player_id)) {
          alert("Vous avez déjà acheté ce joueur !");
          return;
        }

        if (currentCredits < credits) {
          alert("Crédits insuffisants !");
          return;
        }

        currentCredits -= credits;
        localStorage.setItem("credits", currentCredits);
        if (creditsSpan) creditsSpan.textContent = currentCredits;

        // Ajoute le joueur à l'équipe
        myTeam.push({ ...skill });
        localStorage.setItem("myTeam", JSON.stringify(myTeam));

        alert(`${skill.id} acheté !`);
      });

      card.appendChild(buyButton);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des skills :", error);
  }
});
