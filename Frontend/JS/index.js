document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  if (!username) {
    alert("You must log in to access the dashboard.");
    window.location.href = "login.html";
    return;
  }

  const creditsElement = document.getElementById("user-credits");

  try {
    const res = await fetch(`http://127.0.0.1:5001/users/${username}`);
    if (!res.ok) throw new Error("Unable to retrieve user data");

    const data = await res.json();

    // Affichage des infos
    document.getElementById("user-avatar").src = `../images/${data.avatar || "default-avatar.png"}`;
    document.getElementById("user-name").textContent = data.username;

    // Crédits
    let currentCredits = data.credits ?? 0;
    creditsElement.textContent = `💰 Credits : ${currentCredits}`;

    // Sauvegarder dans localStorage pour synchronisation avec skills.html
    localStorage.setItem("credits", currentCredits);

    // Statistiques
    document.getElementById("wins").textContent = data.matches_won ?? 0;
    document.getElementById("losses").textContent = data.matches_lost ?? 0;
    document.getElementById("draws").textContent = data.matches_drawn ?? 0;

    new Chart(document.getElementById("statsChart"), {
      type: "bar",
      data: {
        labels: ["Goals", "Passes", "Stops"],
        datasets: [{
          label: "Statistics",
          data: [data.goals ?? 0, data.assists ?? 0, data.saves ?? 0],
          backgroundColor: ["#00bfff", "#00ff88", "#ffaa00"]
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    // Écoute des changements dans localStorage pour mise à jour automatique
    window.addEventListener("storage", (event) => {
      if (event.key === "credits") {
        creditsElement.textContent = `💰 Credits : ${event.newValue}`;
      }
    });

  } catch (err) {
    console.error(err);
    // Ici, on peut juste afficher 0 crédits sans alerter
    creditsElement.textContent = `💰 Credits : 0`;
  }
  
});