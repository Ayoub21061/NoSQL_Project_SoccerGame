document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("battlepass-progress");
  container.innerHTML = "<p>Chargement du Battle Pass...</p>";

  try {
    const username = localStorage.getItem("username");
    if (!username) throw new Error("Utilisateur non connecté.");

    // --- Récupérer le joueur et son XP / récompenses ---
    const userRes = await fetch(`http://127.0.0.1:5001/users/${username}`);
    if (!userRes.ok) throw new Error("Error server user");
    const userData = await userRes.json();
    const currentXP = userData.current_xp ?? 0;
    const claimedRewards = userData.claimed_rewards ?? [];

    // --- Récupérer le Battle Pass ---
    const res = await fetch("http://127.0.0.1:5001/achievements/battlepass");
    if (!res.ok) throw new Error("Error server user");
    const battlePass = await res.json();

    container.innerHTML = "";
    container.scrollLeft = 0;

    // --- Construire le Battle Pass dynamique ---
    battlePass.forEach(level => {
      const lvlDiv = document.createElement("div");
      lvlDiv.className = "battlepass-level";

      const unlocked = currentXP >= level.xp_required;
      const claimed = claimedRewards.includes(level.id);

      lvlDiv.classList.add(unlocked ? "unlocked" : "locked");

      lvlDiv.innerHTML = `
        <div class="level-header">${level.name}</div>
        <div class="level-xp">XP Requis : ${level.xp_required}</div>
        <div class="level-reward">
          <span>💰 ${level.reward.coins || 0}</span>
          ${level.reward.pack ? `<span>${level.reward.pack}</span>` : ""}
          ${level.reward.exclusive_kit ? `<span>👕 Kit exclusif</span>` : ""}
          ${level.reward.trophy ? `<span>🏆 Trophée</span>` : ""}
        </div>
        <button class="preview-btn" data-reward='${JSON.stringify(level.reward)}' data-title="${level.name}">
          Voir aperçu des récompenses
        </button>
      `;

      // --- Section des récompenses / bouton ---
      const rewardSection = document.createElement("div");
      rewardSection.className = "reward-section";

      if (unlocked && !claimed) {
        const claimBtn = document.createElement("button");
        claimBtn.className = "claim-btn";
        claimBtn.textContent = "🎁 Recoverd your rewards";

        claimBtn.addEventListener("click", async () => {
          try {
            const claimRes = await fetch(`http://127.0.0.1:5001/users/${username}/claim_reward/${level.id}`, {
              method: "POST"
            });

            const data = await claimRes.json();

            if (claimRes.ok) {
              rewardSection.innerHTML = `<p class="claimed">✅ Reward recovered : +${data.earned_coins} coins</p>`;
              claimedRewards.push(level.id); // mettre à jour localement
            } else {
              alert(data.error || "Error while retrieving rewards");
            }
          } catch (err) {
            console.error(err);
            alert("Error while retrieving rewards");
          }
        });

        rewardSection.appendChild(claimBtn);

      } else if (claimed) {
        rewardSection.innerHTML = `<p class="claimed">✅ Récompense déjà récupérée</p>`;
      } else {
        rewardSection.innerHTML = `<p class="locked">🔒 Niveau verrouillé</p>`;
      }

      lvlDiv.appendChild(rewardSection);
      container.appendChild(lvlDiv);
    });

    // --- Gestion du clic sur les boutons d’aperçu ---
    document.querySelectorAll(".preview-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const reward = JSON.parse(e.target.getAttribute("data-reward"));
        const title = e.target.getAttribute("data-title");
        showRewardPreview(title, reward);
      });
    });

  } catch (err) {
    console.error("Erreur lors du chargement du Battle Pass :", err);
    container.innerHTML = "<p>Erreur lors du chargement du Battle Pass</p>";
  }
});

// --- Fonction d’affichage des récompenses ---
function showRewardPreview(title, reward) {
  let modal = document.getElementById("reward-preview");
  if (!modal) return;

  const titleEl = document.getElementById("reward-title");
  const imagesContainer = document.getElementById("reward-images");

  titleEl.textContent = title;
  imagesContainer.innerHTML = "";

  // --- Coins ---
  if (reward.coins) {
    const coinDiv = document.createElement("div");
    coinDiv.style.textAlign = "center";

    const coinImg = document.createElement("img");
    coinImg.src = "../images/coins.png";
    coinImg.alt = "Coins";
    coinImg.className = "reward-img";
    coinDiv.appendChild(coinImg);

    const coinText = document.createElement("span");
    coinText.textContent = `${reward.coins} 💰`;
    coinText.style.display = "block";
    coinText.style.marginTop = "6px";
    coinText.style.fontWeight = "bold";
    coinText.style.color = "#ffd700";
    coinDiv.appendChild(coinText);

    imagesContainer.appendChild(coinDiv);
  }

  // --- Packs ---
  if (reward.pack) {
    const packDiv = document.createElement("div");
    packDiv.style.textAlign = "center";

    const packImg = document.createElement("img");
    const packName = reward.pack.toLowerCase();

    if (packName.includes("platinum")) packImg.src = "../images/pack_platinum.png";
    else if (packName.includes("gold")) packImg.src = "../images/pack_gold.png";
    else if (packName.includes("silver")) packImg.src = "../images/pack_silver.png";
    else packImg.src = "../images/pack_bronze.png";

    packImg.alt = reward.pack;
    packImg.className = "reward-img";
    packDiv.appendChild(packImg);

    const packText = document.createElement("span");
    packText.textContent = reward.pack;
    packText.style.display = "block";
    packText.style.marginTop = "6px";
    packText.style.fontWeight = "bold";
    packText.style.color = "#ffffff";
    packDiv.appendChild(packText);

    imagesContainer.appendChild(packDiv);
  }

  // --- Kit exclusif ---
  if (reward.exclusive_kit) {
    const kitDiv = document.createElement("div");
    kitDiv.style.textAlign = "center";

    const kitImg = document.createElement("img");
    kitImg.src = "../images/exclusive_kit.png";
    kitImg.alt = "Kit exclusif";
    kitImg.className = "reward-img";
    kitDiv.appendChild(kitImg);

    const kitText = document.createElement("span");
    kitText.textContent = "Kit exclusif";
    kitText.style.display = "block";
    kitText.style.marginTop = "6px";
    kitText.style.fontWeight = "bold";
    kitText.style.color = "#00ffea";
    kitDiv.appendChild(kitText);

    imagesContainer.appendChild(kitDiv);
  }

  // --- Trophée ---
  if (reward.trophy) {
    const trophyDiv = document.createElement("div");
    trophyDiv.style.textAlign = "center";

    const trophyImg = document.createElement("img");
    trophyImg.src = "../images/trophy.png";
    trophyImg.alt = "Trophée";
    trophyImg.className = "reward-img";
    trophyDiv.appendChild(trophyImg);

    const trophyText = document.createElement("span");
    trophyText.textContent = "Trophée";
    trophyText.style.display = "block";
    trophyText.style.marginTop = "6px";
    trophyText.style.fontWeight = "bold";
    trophyText.style.color = "#ffd700";
    trophyDiv.appendChild(trophyText);

    imagesContainer.appendChild(trophyDiv);
  }

  // --- Afficher la modal ---
  modal.classList.add("active");
  modal.classList.remove("hidden");

  // --- Fermeture ---
  const closeBtn = modal.querySelector("#close-preview");
  closeBtn.onclick = () => {
    modal.classList.remove("active");
    setTimeout(() => modal.classList.add("hidden"), 300);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
      setTimeout(() => modal.classList.add("hidden"), 300);
    }
  };
}
