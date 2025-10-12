document.addEventListener("DOMContentLoaded", () => {
  // --- Gestion du menu hamburger / sidebar ---
  const sidebar = document.getElementById("mySidebar");
  const openBtn = document.querySelector(".hamburger");
  const closeBtn = document.querySelector(".closebtn");

  openBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.style.width = "250px";
  });

  closeBtn.addEventListener("click", () => {
    sidebar.style.width = "0";
  });

  window.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && e.target !== openBtn) {
      sidebar.style.width = "0";
    }
  });

  // --- Gestion du menu profil ---
  const profil = document.querySelector(".profil");
  const dropdownContent = document.querySelector(".dropdown-content");

  if (profil) {
    profil.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    window.addEventListener("click", () => {
      dropdownContent.style.display = "none";
    });
  }

  // --- Remplissage de l'avatar, nom et crédits ---
  const player = JSON.parse(localStorage.getItem("player"));
  if (player) {
    const avatarElem = document.getElementById("user-avatar");
    const nameElem = document.getElementById("user-name");
    const creditsElem = document.getElementById("user-credits");

    if (avatarElem) avatarElem.src = `../images/${player.avatar || "default-avatar.png"}`;
    if (nameElem) nameElem.textContent = player.username;
    if (creditsElem) creditsElem.textContent = `💰 Crédits : ${player.credits ?? 0}`;
  }

  // --- Déconnexion ---
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("player");
      window.location.href = "login.html";
    });
  }
});
