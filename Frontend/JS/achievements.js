document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("achievements-container");

  try {
    const response = await fetch("http://127.0.0.1:5001/achievements/");
    if (!response.ok) throw new Error("Erreur réseau");

    const achievements = await response.json();

    // Filtrer pour exclure les Battle Pass.
    const filteredAchievements = achievements.filter(achievement => {
      const name = (achievement.name || "").toLowerCase();
      return !name.includes("battle pass") && !name.includes("pass de combat");
    });

    if (filteredAchievements.length === 0) {
      container.innerHTML = "<p>Aucun achievement trouvé (hors Battle Pass).</p>";
      return;
    }

    filteredAchievements.forEach(achievement => {
      const card = document.createElement("div");
      card.className = "achievement-card";

      // Formatage de la récompense
      let rewards = [];

      if (achievement.reward) {
        for (const [key, value] of Object.entries(achievement.reward)) {
          switch (key) {
            case "coins":
              rewards.push(`💰 ${value} crédits`);
              break;
            case "player_card":
              rewards.push(value); // On affiche uniquement la valeur
              break;
            case "pack":
              rewards.push(value); // On affiche uniquement la valeur
              break;
            case "exclusive_kit":
              // On n'affiche pas les exclusive_kit
              break;
            default:
              // Ignore toutes les autres clés
              break;
          }
        }
      }

      const rewardText = rewards.length > 0 ? rewards.join(", ") : "N/A";

      card.innerHTML = `
        <h3>${achievement.name}</h3>
        <p><strong>Description :</strong> ${achievement.description || "No description"}</p>
        <p><strong>Rewards :</strong> ${rewardText}</p>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
  }
});
