const API_URL = "http://localhost:5001/players";

document.addEventListener("DOMContentLoaded", async () => {
  // --- 1️⃣ Récupérer le joueur depuis le localStorage ---
  const player = JSON.parse(localStorage.getItem("player"));
  if (!player) {
    alert("Aucun joueur connecté !");
    window.location.href = "index.html";
    return;
  }

  const playerId = player._id || player.id || null;
  const playerUsername = player.username || player.name || null;

  // --- 2️⃣ Charger les infos depuis la DB ---
  try {
    const fetchUrl = playerId
      ? `${API_URL}/${playerId}`
      : `${API_URL}/username/${encodeURIComponent(playerUsername)}`;

    const res = await fetch(fetchUrl);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur de chargement des données joueur.");

    // --- 3️⃣ Remplir les champs du DOM ---
    document.getElementById("username").value = data.username || "";
    document.getElementById("user-email").textContent = data.mail || "non défini";
    document.getElementById("creation-date").textContent = data.account_creation_date || "--/--/----";
    document.getElementById("playtime").textContent = (data.total_playtime || 0) + " heures";

    if (data.avatar) {
      document.getElementById("avatar-preview").src = `../images/${data.avatar}`;
    }

    // --- 4️⃣ Mettre à jour le localStorage ---
    const updatedPlayer = { ...player, ...data };
    localStorage.setItem("player", JSON.stringify(updatedPlayer));
  } catch (err) {
    console.error(err);
    alert("Impossible de charger les informations du joueur depuis la base de données.");
  }

  // --- 5️⃣ Changement d’avatar (fichier local) ---
  document.getElementById("avatar-upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarData = reader.result;
      try {
        const currentPlayer = JSON.parse(localStorage.getItem("player"));
        const id = currentPlayer._id || currentPlayer.id;
        if (!id) throw new Error("Aucun id player disponible pour la mise à jour.");

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
        alert("✅ Avatar mis à jour !");
      } catch (err) {
        alert("Erreur lors de la mise à jour de l’avatar.");
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  });

  // --- 6️⃣ Sélection d’avatars prédéfinis ---
  document.querySelectorAll(".preset-avatar").forEach(img => {
    img.addEventListener("click", async () => {
      const avatarFileName = img.src.split("/").pop();
      try {
        const currentPlayer = JSON.parse(localStorage.getItem("player"));
        const id = currentPlayer._id || currentPlayer.id;
        if (!id) throw new Error("Aucun id player disponible pour la mise à jour.");

        const response = await fetch(`${API_URL}/${id}/avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarFileName }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        document.getElementById("avatar-preview").src = `../images/${avatarFileName}`;
        currentPlayer.avatar = avatarFileName;
        localStorage.setItem("player", JSON.stringify(currentPlayer));
        alert("✅ Avatar changé avec succès !");
      } catch (err) {
        alert("Erreur lors du changement d’avatar.");
        console.error(err);
      }
    });
  });

  // --- 7️⃣ Mise à jour du pseudo ---
  document.getElementById("save-profile").addEventListener("click", async () => {
    const newUsername = document.getElementById("username").value.trim();
    if (!newUsername) return alert("Le pseudo ne peut pas être vide.");

    try {
      const currentPlayer = JSON.parse(localStorage.getItem("player"));
      const id = currentPlayer._id || currentPlayer.id;
      if (!id) throw new Error("Aucun id player disponible pour la mise à jour.");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      currentPlayer.username = newUsername;
      localStorage.setItem("player", JSON.stringify(currentPlayer));
      alert("✅ Pseudo mis à jour !");
    } catch (err) {
      alert("Erreur lors de la mise à jour du pseudo.");
      console.error(err);
    }
  });

  // --- 8️⃣ Mise à jour du mot de passe ---
  document.getElementById("update-password").addEventListener("click", async () => {
    const oldPwd = document.getElementById("old-password").value.trim();
    const newPwd = document.getElementById("new-password").value.trim();

    if (!oldPwd || !newPwd) return alert("Veuillez remplir tous les champs !");
    if (oldPwd === newPwd) return alert("Le nouveau mot de passe doit être différent de l'ancien.");

    try {
      const currentPlayer = JSON.parse(localStorage.getItem("player"));
      const id = currentPlayer._id || currentPlayer.id;
      if (!id) throw new Error("Aucun id player disponible pour la mise à jour.");

      const response = await fetch(`${API_URL}/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert("🔒 Mot de passe mis à jour avec succès !");
    } catch (err) {
      alert("Erreur lors de la mise à jour du mot de passe.");
      console.error(err);
    }
  });

  // --- 9️⃣ Suppression du compte ---
  document.getElementById("delete-account").addEventListener("click", async () => {
    if (!confirm("⚠️ Voulez-vous vraiment supprimer votre compte ?")) return;

    try {
      const currentPlayer = JSON.parse(localStorage.getItem("player"));
      const id = currentPlayer._id || currentPlayer.id;
      if (!id) throw new Error("Aucun id player disponible pour la suppression.");

      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      localStorage.removeItem("player");
      alert("🗑️ Compte supprimé avec succès !");
      window.location.href = "index.html";
    } catch (err) {
      alert("Erreur lors de la suppression du compte.");
      console.error(err);
    }
  });
});
