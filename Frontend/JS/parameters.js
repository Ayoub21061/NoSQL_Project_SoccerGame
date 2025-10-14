const API_URL = "http://localhost:5001/players";

document.addEventListener("DOMContentLoaded", async () => {
  const player = JSON.parse(localStorage.getItem("player"));
  if (!player || !player.id) {
    alert("Aucun joueur connecté !");
    window.location.href = "index.html";
    return;
  }

  // --- Charger les infos réelles depuis la DB ---
  try {
    const res = await fetch(`${API_URL}/${player.id}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Erreur de chargement des données joueur.");

    document.getElementById("username").value = data.username || "";
    document.getElementById("user-email").textContent = data.mail || "";
    document.getElementById("creation-date").textContent = data.account_creation_date || "non précisée";
    if (data.avatar) {
      document.getElementById("avatar-preview").src = `../images/${data.avatar}`;
    }
  } catch (err) {
    console.error(err);
    alert("Impossible de charger les informations du joueur depuis la base de données.");
  }

  // --- Upload / changement d’avatar ---
  document.getElementById("avatar-upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarData = reader.result; // image en base64

      try {
        const response = await fetch(`${API_URL}/${player.id}/avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarData }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        document.getElementById("avatar-preview").src = avatarData;

        // Mise à jour du localStorage
        player.avatar = avatarData;
        localStorage.setItem("player", JSON.stringify(player));

        alert("✅ Avatar mis à jour !");
      } catch (err) {
        alert("Erreur lors de la mise à jour de l’avatar.");
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  });

  // --- Mise à jour du pseudo ---
  document.getElementById("save-profile").addEventListener("click", async () => {
    const newUsername = document.getElementById("username").value.trim();
    if (!newUsername) return alert("Le pseudo ne peut pas être vide.");

    try {
      const response = await fetch(`${API_URL}/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // On met à jour le localStorage pour garder la session cohérente
      player.username = newUsername;
      localStorage.setItem("player", JSON.stringify(player));

      alert("✅ Pseudo mis à jour !");
    } catch (err) {
      alert("Erreur lors de la mise à jour du pseudo.");
      console.error(err);
    }
  });

  // --- Mise à jour du mot de passe ---
  document.getElementById("update-password").addEventListener("click", async () => {
    const oldPwd = document.getElementById("old-password").value.trim();
    const newPwd = document.getElementById("new-password").value.trim();

    if (!oldPwd || !newPwd) return alert("Veuillez remplir tous les champs !");
    if (oldPwd === newPwd) return alert("Le nouveau mot de passe doit être différent de l'ancien.");

    try {
      const response = await fetch(`${API_URL}/${player.id}/password`, {
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

  // --- Suppression du compte ---
  document.getElementById("delete-account").addEventListener("click", async () => {
    const confirmDelete = confirm("⚠️ Voulez-vous vraiment supprimer votre compte ?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/${player.id}`, { method: "DELETE" });
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
