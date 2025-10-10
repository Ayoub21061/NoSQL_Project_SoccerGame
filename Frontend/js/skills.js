document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("http://127.0.0.1:5001/skills");
    const skills = await response.json();
    console.log("Skills récupérés :", skills); // 🔥 vérifie la réponse du serveur

    const container = document.getElementById("skills-container");
    container.innerHTML = "";

    skills.forEach(skill => {
      const card = document.createElement("div");
      card.className = "skill-card";

      // Détermine si le joueur est un gardien
      const isGoalkeeper = skill.style && skill.style.toLowerCase() === "gardien";

      // Stats HTML selon type de joueur
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

      // Image avec fallback
      const imageSrc = `../images/${skill.image.split("/").pop()}`;


      card.innerHTML = `
        <div class="skill-image-container">
          <img src="${imageSrc}" alt="${skill.id}" class="skill-image" />
        </div>

        <div class="skill-header">${skill.id}</div>
        <div class="skill-style">${skill.style}</div>

        <div class="skill-stats">
          ${statsHTML}
        </div>

        <div class="skill-extra">
          ✨ Tech: ${skill.technical_moves ?? "-"} | 🦶 WF: ${skill.weak_foot ?? "-"}
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error("Erreur lors du chargement des skills :", error);
  }
});
