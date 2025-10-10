document.addEventListener("DOMContentLoaded", () => {
  // --- Gestion du menu hamburger / sidebar ---
  const sidebar = document.getElementById("mySidebar");
  const openBtn = document.querySelector(".hamburger");
  const closeBtn = document.querySelector(".closebtn");

  openBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // éviter que le clic ferme directement
    sidebar.style.width = "250px"; // largeur de la sidebar
  });

  closeBtn.addEventListener("click", () => {
    sidebar.style.width = "0";
  });

  // Fermer sidebar si clic en dehors
  window.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && e.target !== openBtn) {
      sidebar.style.width = "0";
    }
  });

  // --- Gestion du menu profil ---
  const profil = document.querySelector(".profil");
  const dropdownContent = document.querySelector(".dropdown-content");

  profil.addEventListener("click", (e) => {
    e.stopPropagation(); // éviter que le clic se propage au window
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
  });

  // Fermer menu profil si clic en dehors
  window.addEventListener("click", () => {
    dropdownContent.style.display = "none";
  });
});
