document.addEventListener("DOMContentLoaded", async () => {
  try {
    const player = JSON.parse(localStorage.getItem("player"));
    if (!player) throw new Error("Utilisateur non connecté.");

    const username = player.username;
    let currentCredits = player.credits ?? 0;

    const creditsSpan = document.getElementById("user-credits");
    if (creditsSpan) creditsSpan.textContent = `💰 Crédits : ${currentCredits}`;

    // --- Récupérer tous les contrats/formes ---
    const res = await fetch("http://127.0.0.1:5001/contracts_forms");
    const items = await res.json();

    // --- Récupérer items déjà achetés ---
    const userRes = await fetch(`http://127.0.0.1:5001/players/username/${username}`);
    const userData = await userRes.json();
    const ownedIds = (userData.contrats_formes || []).map(id => id.toString());

    const contractsSection = document.getElementById("contracts-section");
    const boostersSection = document.getElementById("boosters-section");
    const myItemsDiv = document.getElementById("my-items");

    contractsSection.innerHTML = "";
    boostersSection.innerHTML = "";
    myItemsDiv.innerHTML = "";

    // --- Créer une carte ---
    function createCard(item, alreadyBought) {
      const card = document.createElement("div");
      card.className = `skill-card ${item.type}`;

      const imgSrc = item.image ? `../images/${item.image}` : "../images/default.png";
      card.innerHTML = `
        <div class="skill-header">${item.name}</div>
        <div class="skill-style">${item.type}</div>
        <div class="skill-extra">${item.bonus}</div>
        <div class="skill-credits">💰 Prix : ${item.cost}</div>
      `;

      const btn = document.createElement("button");
      btn.textContent = alreadyBought ? "Déjà acheté" : "Acheter";
      btn.disabled = alreadyBought;

      btn.addEventListener("click", async () => {
        if (currentCredits < item.cost) return alert("Crédits insuffisants !");
        try {
          const res = await fetch(`http://127.0.0.1:5001/contracts_forms/${username}/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id: item._id, cost: item.cost })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur achat");

          currentCredits = data.credits;
          creditsSpan.textContent = `💰 Crédits : ${currentCredits}`;
          player.credits = currentCredits;
          localStorage.setItem("player", JSON.stringify(player));

          ownedIds.push(item._id.toString());
          btn.textContent = "Déjà acheté";
          btn.disabled = true;

          alert(`${item.name} acheté !`);
          displayOwnedItems(items, ownedIds, myItemsDiv);
        } catch (err) {
          console.error(err);
          alert("Erreur lors de l'achat.");
        }
      });

      card.appendChild(btn);
      return card;
    }

    // --- Remplir les sections ---
    items.forEach(item => {
      const alreadyBought = ownedIds.includes(item._id?.toString());
      

      if (item.type === "contrat") contractsSection.appendChild(createCard(item, false));
      else if (item.type === "forme") boostersSection.appendChild(createCard(item, false));
    });

    // --- Section items achetés ---
    displayOwnedItems(items, ownedIds, myItemsDiv);

  } catch (err) {
    console.error(err);
    alert("Erreur serveur.");
  }
});

// --- Fonction pour afficher les items possédés ---
function displayOwnedItems(allItems, ownedIds, targetDiv) {
  targetDiv.innerHTML = "";
  const owned = allItems.filter(i => ownedIds.includes(i._id?.toString()));
  owned.forEach(item => {
    const div = document.createElement("div");
    div.className = `skill-card ${item.type}`;
    const imgSrc = item.image ? `../images/${item.image}` : "../images/default.png";
    div.innerHTML = `
      <div class="skill-image-container">
        <img src="${imgSrc}" alt="${item.name}">
      </div>
      <div class="skill-header">${item.name}</div>
      
      <div class="skill-extra">${item.bonus}</div>
    `;
    targetDiv.appendChild(div);
  });
}

