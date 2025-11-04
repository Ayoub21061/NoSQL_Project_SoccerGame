const API_URL = "http://localhost:5001/players";

document.addEventListener("DOMContentLoaded", async () => {
  // On récupère l'objet player stocké (clée "player")
  const player = JSON.parse(localStorage.getItem("player"));
  if (!player) {
    alert("No player connected !");
    window.location.href = "index.html";
    return;
  }

  // Détermine l'identifiant à utiliser pour les requêtes : _id (si présent) sinon username
  const playerId = player._id || player.id || null;
  const playerUsername = player.username || player.name || null;

  // --- Charger les infos depuis la DB ---
  try {
    // Si possible, on récupère par id (plus sûr). Sinon, fallback sur la route username.
    const fetchUrl = playerId ? `${API_URL}/${playerId}` : `${API_URL}/username/${encodeURIComponent(playerUsername)}`;
    const res = await fetch(fetchUrl);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Player data loading error.");

    // Remplissage des champs (attention aux clés renvoyées par ton backend)
    document.getElementById("username").value = data.username || "";
    // Certains backend utilisent `email`, d'autres `mail`. fallback sur les deux.
    document.getElementById("user-email").textContent = data.email || data.mail || "undefined";
    // Même remarque pour la date de création
    document.getElementById("creation-date").textContent = data.creation_date || data.account_creation_date || "--/--/----";
    document.getElementById("playtime").textContent = (data.total_playtime || 0) + " hours";

    if (data.avatar) {
      document.getElementById("avatar-preview").src = `../images/${data.avatar}`;
    }

    // On met à jour l'objet player local avec les données fraîches (notamment l'_id si manquant)
    const updatedPlayer = { ...player, ...data };
    localStorage.setItem("player", JSON.stringify(updatedPlayer));
  } catch (err) {
    console.error(err);
    alert("Unable to load player information from the database.");
  }

  // --- Upload / changement d’avatar (fichier local) ---
  document.getElementById("avatar-upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarData = reader.result; // base64 data URL

      try {
        // Doit utiliser l'id si possible
        const currentPlayer = JSON.parse(localStorage.getItem("player"));
        const id = currentPlayer._id || currentPlayer.id;
        if (!id) throw new Error("No player IDs are available for the update.");

        const response = await fetch(`${API_URL}/${id}/avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarData }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        document.getElementById("avatar-preview").src = avatarData;
        currentPlayer.avatar = avatarData;
        localStorage.setItem("player", JSON.stringify(currentPlayer));

        alert("✅ Avatar updated !");
      } catch (err) {
        alert("Error updating avatar.");
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  });

  // --- Sélection d’un avatar prédéfini (image du dossier) ---
  document.querySelectorAll(".preset-avatar").forEach(img => {
    img.addEventListener("click", async () => {
      // extraire le nom du fichier depuis src (attention en dev vs prod)
      const srcParts = img.src.split("/");
      const avatarFileName = srcParts[srcParts.length - 1];

      try {
        const currentPlayer = JSON.parse(localStorage.getItem("player"));
        const id = currentPlayer._id || currentPlayer.id;
        if (!id) throw new Error("No player IDs available for the update.");

        const response = await fetch(`${API_URL}/${id}/avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarFileName }), // envoi du nom de fichier si backend l'accepte
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        document.getElementById("avatar-preview").src = `../images/${avatarFileName}`;
        currentPlayer.avatar = avatarFileName;
        localStorage.setItem("player", JSON.stringify(currentPlayer));

        alert("✅ Avatar successfully changed !");
      } catch (err) {
        alert("Error changing avatar.");
        console.error(err);
      }
    });
  });

  // --- Mise à jour du pseudo ---
  document.getElementById("save-profile").addEventListener("click", async () => {
    const newUsername = document.getElementById("username").value.trim();
    if (!newUsername) return alert("The username cannot be empty.");

    try {
      const currentPlayer = JSON.parse(localStorage.getItem("player"));
      const id = currentPlayer._id || currentPlayer.id;
      if (!id) throw new Error("No player IDs are available for the update..");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      currentPlayer.username = newUsername;
      localStorage.setItem("player", JSON.stringify(currentPlayer));

      alert("✅ Pseudo updated !");
    } catch (err) {
      alert("Error updating username.");
      console.error(err);
    }
  });

  // --- Mise à jour du mot de passe ---
  document.getElementById("update-password").addEventListener("click", async () => {
    const oldPwd = document.getElementById("old-password").value.trim();
    const newPwd = document.getElementById("new-password").value.trim();

    if (!oldPwd || !newPwd) return alert("Please fill in all fields !");
    if (oldPwd === newPwd) return alert("The new password must be different from the old one.");

    try {
      const currentPlayer = JSON.parse(localStorage.getItem("player"));
      const id = currentPlayer._id || currentPlayer.id;
      if (!id) throw new Error("No player IDs are available for the update.");

      const response = await fetch(`${API_URL}/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert("🔒 Password successfully updated !");
    } catch (err) {
      alert("Error updating password.");
      console.error(err);
    }
  });

  // --- Suppression du compte ---
  document.getElementById("delete-account").addEventListener("click", async () => {
    const confirmDelete = confirm("⚠️ Do you really want to delete your account ?");
    if (!confirmDelete) return;

    try {
      const currentPlayer = JSON.parse(localStorage.getItem("player"));
      const id = currentPlayer._id || currentPlayer.id;
      if (!id) throw new Error("No player ID available for deletion.");

      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      localStorage.removeItem("player");
      alert("🗑️ Account deleted successfully !");
      window.location.href = "index.html";
    } catch (err) {
      alert("Error deleting account.");
      console.error(err);
    }
  });
});
