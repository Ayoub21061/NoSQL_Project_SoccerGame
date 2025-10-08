document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const sidebar = document.querySelector(".sidebar");
    const profilDropdown = document.querySelector(".dropdown .profil");
    const profilMenu = document.querySelector(".dropdown-content");

    // Ouvrir/fermer sidebar
    hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("active");
    });

    // Ouvrir/fermer dropdown profil
    profilDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        profilMenu.style.display = profilMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Clic en dehors ferme tout
    window.addEventListener("click", () => {
        sidebar.classList.remove("active");
        profilMenu.style.display = 'none';
    });
});
