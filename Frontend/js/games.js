document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("games-container");

  try {
    const response = await fetch("http://127.0.0.1:5001/games/");
    if (!response.ok) throw new Error("Erreur réseau");

    const games = await response.json();

    if (games.length === 0) {
      container.innerHTML = "<p>Aucun mode de jeu trouvé.</p>";
      return;
    }

    games.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
        <img src="${game.image}" alt="${game.name}" class="game-image" />
        <h3>${game.name}</h3>
        <p>${game.description || "Aucune description"}</p>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
  }
});
