// --- Configuration de base ---
const API_URL = "http://localhost:5001/players";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Chargement des paramètres du joueur...");

  // --- 1️⃣ Récupérer le joueur depuis le localStorage ---
  const player = JSON.parse(localStorage.getItem("player"));
  if (!player) {
    alert("Aucun joueur connecté !");
    window.location.href = "index.html";
    return;
  }

  // Identifiant du joueur (MongoDB ObjectId ou username)
  const playerId = player._id || player.id || null;
  const playerUsername = player.username || player.name || null;

  if (!playerId && !playerUsername) {
    alert("Impossible d’identifier le joueur.");
    return;
  }

  // --- 2️⃣ Charger les informations du joueur depuis la base de données ---
  try {
    const fetchUrl = playerId
      ? `${API_URL}/${playerId}`
      : `${API_URL}/username/${encodeURIComponent(playerUsername)}`;

    console.log("→ Requête vers :", fetchUrl);

    const res = await fetch(fetchUrl);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Erreur de chargement des données joueur.");

    console.log("✅ Données du joueur reçues :", data);

    // --- 3️⃣ Mettre à jour les champs du DOM ---
    document.getElementById("username").value = data.username || "";
    document.getElementById("user-email").textContent = data.mail || "non défini";
    document.getElementById("creation-date").textContent =
      data.account_creation_date || "non précisée";
    document.getElementById("playtime").textContent =
      (data.total_playtime || 0) + " heures";

    if (data.avatar) {
      document.getElementById("avatar-preview").src = `../images/${data.avatar}`;
    }

    // --- 4️⃣ Mettre à jour les infos locales ---
    const updatedPlayer = { ...player, ...data };
    localStorage.setItem("player", JSON.stringify(updatedPlayer));

  } catch (err) {
    console.error("❌ Erreur lors du chargement du joueur :", err);
    alert("Impossible de charger les informations du joueur depuis la base de données.");
  }

  // --- 5️⃣ Gestion de la mise à jour du profil (ex: bouton “Sauvegarder”) ---
  const saveButton = document.getElementById("save-profile");
  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      const updatedUsername = document.getElementById("username").value.trim();

      if (!updatedUsername) {
        alert("Le nom d'utilisateur ne peut pas être vide !");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/${player._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: updatedUsername }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Erreur de mise à jour.");

        alert("Profil mis à jour avec succès !");
        localStorage.setItem("player", JSON.stringify(result));

      } catch (err) {
        console.error("❌ Erreur lors de la mise à jour :", err);
        alert("Impossible de mettre à jour le profil.");
      }
    });
  }
});
