document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("achievements-container");

  try {
    const response = await fetch("http://127.0.0.1:5001/achievements/");
    if (!response.ok) throw new Error("Erreur réseau");

    const achievements = await response.json();

    if (achievements.length === 0) {
      container.innerHTML = "<p>Aucun achievement trouvé.</p>";
      return;
    }

    achievements.forEach(achievement => {
      const card = document.createElement("div");
      card.className = "achievement-card";
      card.innerHTML = `
        <h3>${achievement.name}</h3>
        <p><strong>Description :</strong> ${achievement.description || "Aucune description"}</p>
        <p><strong>Récompenses :</strong> ${
          achievement.reward
            ? Object.values(achievement.reward).join(", ")
            : "N/A"
        }</p>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
  }
});
