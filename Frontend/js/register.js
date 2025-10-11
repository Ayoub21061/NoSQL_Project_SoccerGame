document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const errorMsg = document.getElementById("error-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const avatar = document.getElementById("avatar").value.trim() || "default-avatar.png";

    if (!username || !password) {
      errorMsg.textContent = "Veuillez remplir tous les champs.";
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5001/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, avatar })
      });

      const data = await res.json();
      if (!res.ok) {
        errorMsg.textContent = data.error || "Erreur lors de l'inscription.";
        return;
      }

      // inscription OK -> on stocke l'utilisateur et on redirige vers login ou directement connecter
      alert("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      window.location.href = "login.html";

    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Erreur serveur, veuillez réessayer plus tard.";
    }
  });
});
