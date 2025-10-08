document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const button = dropdown.querySelector('.hamburger, .dropdown-button, .profil');
        const menu = dropdown.querySelector('.dropdown-content');

        button.addEventListener('click', (e) => {
            e.stopPropagation(); // évite de fermer le menu immédiatement
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Fermer tous les menus si on clique en dehors
    window.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content').forEach(menu => {
            menu.style.display = 'none';
        });
    });
});
