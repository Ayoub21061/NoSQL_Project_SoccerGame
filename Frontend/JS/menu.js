document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("mySidebar");
  const openBtn = document.querySelector(".hamburger");
  const closeBtn = document.querySelector(".closebtn");

  // Ouvrir sidebar
  openBtn.addEventListener("click", () => {
    sidebar.style.width = "250px"; // largeur de la sidebar
  });

  // Fermer sidebar
  closeBtn.addEventListener("click", () => {
    sidebar.style.width = "0";
  });

  // Optionnel : fermer si clic hors sidebar
  window.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && e.target !== openBtn) {
      sidebar.style.width = "0";
    }
  });
});
