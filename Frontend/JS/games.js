document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("games-container");

  try {
    const response = await fetch("http://127.0.0.1:5001/games/");
    if (!response.ok) throw new Error("Error network");

    const games = await response.json();

    if (games.length === 0) {
      container.innerHTML = "<p>No game modes found.</p>";
      return;
    }

    games.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";

      card.innerHTML = `
        <img src="../images/${game.image.split("/").pop()}" alt="${game.name}" class="game-image" />
        <h3>${game.name}</h3>
        <p>${game.description || "No description"}</p>
      `;

      // 🧭 Redirection au clic
      card.addEventListener("click", () => {
        window.location.href = `game_detail.html?id=${game._id}`;
      });

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
  }
});
