document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("http://127.0.0.1:5001/skills"); 
    const skills = await response.json();

    const container = document.getElementById("skills-container");
    container.innerHTML = "";

    skills.forEach(skill => {
      const card = document.createElement("div");
      card.className = "skill-card";
      card.innerHTML = `
        <div class="skill-image-container">
          <img src="../images/${skill.image.split("/").pop()}" alt="${skill.id}" class="skill-image" />
        </div>
        

        <div class="skill-header">${skill.id}</div>
        <div class="skill-style">${skill.style}</div>

        <div class="skill-stats">
          <div class="skill-stat"><strong>${skill.pac}</strong><br>PAC</div>
          <div class="skill-stat"><strong>${skill.sho}</strong><br>SHO</div>
          <div class="skill-stat"><strong>${skill.pas}</strong><br>PAS</div>
          <div class="skill-stat"><strong>${skill.dri}</strong><br>DRI</div>
          <div class="skill-stat"><strong>${skill.def}</strong><br>DEF</div>
          <div class="skill-stat"><strong>${skill.phy}</strong><br>PHY</div>
        </div>

        <div class="skill-extra">
          ✨ Tech: ${skill.technical_moves} | 🦶 WF: ${skill.weak_foot}
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Erreur lors du chargement des skills :", error);
  }
});
