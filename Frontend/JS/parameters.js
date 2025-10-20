const API_URL = "http://localhost:5001/players";

document.addEventListener("DOMContentLoaded", async () => {
  // Récupérer le joueur connecté depuis le localStorage
  const username = localStorage.getItem("username");
  if (!username) {
    alert("Aucun joueur connecté !");
    window.location.href = "index.html";
    return;
  }

  try {
    // --- Charger les infos réelles depuis la DB via le username ---
    const res = await fetch(`${API_URL}/username/${username}`);
    const playerData = await res.json();

    if (!res.ok) throw new Error(playerData.error || "Erreur de chargement des données joueur.");

    // --- Remplir le formulaire avec les infos ---
    document.getElementById("username").value = playerData.username || "";
    document.getElementById("user-email").textContent = playerData.email || "non défini";
    document.getElementById("creation-date").textContent = playerData.creation_date || "non précisée";
    document.getElementById("playtime").textContent = (playerData.total_playtime || 0) + " heures";

    if (playerData.avatar) {
      document.getElementById("avatar-preview").src = `../images/${playerData.avatar}`;
    }

    // --- Upload / changement d’avatar ---
    document.getElementById("avatar-upload").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const avatarData = reader.result;

        try {
          const response = await fetch(`${API_URL}/${playerData._id}/avatar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: avatarData }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.error);

          document.getElementById("avatar-preview").src = avatarData;
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
        const response = await fetch(`${API_URL}/${playerData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: newUsername }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        // Mise à jour du localStorage
        localStorage.setItem("username", newUsername);
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
        const response = await fetch(`${API_URL}/${playerData._id}/password`, {
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
        const response = await fetch(`${API_URL}/${playerData._id}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        localStorage.removeItem("username");
        alert("🗑️ Compte supprimé avec succès !");
        window.location.href = "index.html";
      } catch (err) {
        alert("Erreur lors de la suppression du compte.");
        console.error(err);
      }
    });

  } catch (err) {
    console.error(err);
    alert("Impossible de charger les informations du joueur depuis la base de données.");
  }
});
