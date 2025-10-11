document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("error-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    errorMsg.textContent = "";

    if (!username || !password) {
      errorMsg.textContent = "Veuillez entrer un nom d'utilisateur et un mot de passe.";
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5001/users/login", {   // <-- /users/login
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || "Erreur serveur, veuillez réessayer.";
        return;
      }

      // Stocker les infos utilisateur dans localStorage pour la session
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("avatar", data.user.avatar || "");
      localStorage.setItem("credits", data.user.credits || 0);

      // Redirection vers le dashboard (index.html situé dans le même dossier Frontend/HTML)
      window.location.href = "index.html";

    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Erreur serveur, veuillez réessayer plus tard.";
    }
  });
});
