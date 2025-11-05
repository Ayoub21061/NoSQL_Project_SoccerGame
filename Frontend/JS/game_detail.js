document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("id");

  if (!gameId) {
    document.getElementById("game-detail").innerHTML = "<p>Mode de jeu introuvable.</p>";
    return;
  }

  try {
    // Récupère les infos du jeu depuis ton API
    const response = await fetch(`http://127.0.0.1:5001/games/${gameId}`);
    if (!response.ok) throw new Error("Impossible de charger le mode");

    const game = await response.json();

    // Met à jour le DOM
    document.getElementById("game-title").textContent = game.name;

    document.getElementById("game-image").src = `../images/${game.image.split("/").pop()}`;


    
    document.getElementById("game-image").alt = game.name;

    document.getElementById("game-description").textContent = game.description;
    document.getElementById("game-type").textContent = game.mode_type;
    document.getElementById("game-max").textContent = game.max_players_per_team;

    const specialRulesDiv = document.getElementById("game-special-rules");
    if (game.special_rules && game.special_rules.length > 0) {
      specialRulesDiv.innerHTML = `
        <h4>Règles spéciales :</h4>
        <ul>${game.special_rules.map(rule => `<li>${rule}</li>`).join("")}</ul>
      `;
    } else {
      specialRulesDiv.innerHTML = ""; // Pas de règles spéciales
    }

  } catch (err) {
    document.getElementById("game-detail").innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
  
});
