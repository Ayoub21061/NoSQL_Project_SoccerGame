document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("battlepass-progress");
  container.innerHTML = "<p>Chargement du Battle Pass...</p>";

  try {
    const username = localStorage.getItem("username");
    if (!username) throw new Error("Utilisateur non connecté.");

    // --- Récupérer le joueur et son XP / récompenses ---
    const userRes = await fetch(`http://127.0.0.1:5001/users/${username}`);
    if (!userRes.ok) throw new Error("Erreur serveur utilisateur");
    const userData = await userRes.json();
    const currentXP = userData.current_xp ?? 0;
    const claimedRewards = userData.claimed_rewards ?? [];

    // --- Récupérer le Battle Pass ---
    const res = await fetch("http://127.0.0.1:5001/achievements/battlepass");
    if (!res.ok) throw new Error("Erreur serveur Battle Pass");
    const battlePass = await res.json();

    // ✅ Tri du Battle Pass par XP requis croissant
    battlePass.sort((a, b) => a.xp_required - b.xp_required);

    container.innerHTML = "";

    // --- Construire le Battle Pass dynamique ---
    battlePass.forEach(level => {
      const lvlDiv = document.createElement("div");
      lvlDiv.className = "battlepass-level";

      const unlocked = currentXP >= level.xp_required;
      const claimed = claimedRewards.includes(level.id);

      lvlDiv.classList.add(unlocked ? "unlocked" : "locked");

      lvlDiv.innerHTML = `
        <div class="level-header">${level.name}</div>
        <div class="level-xp">Required XP : ${level.xp_required}</div>
        <div class="level-reward">
          <span>💰 ${level.reward.coins || 0}</span>
          ${level.reward.pack ? `<span>${level.reward.pack}</span>` : ""}
          ${level.reward.exclusive_kit ? `<span>👕 Exclusive Kit</span>` : ""}
        </div>
        <button class="preview-btn" data-reward='${JSON.stringify(level.reward)}' data-title="${level.name}">
          View Reward Preview
        </button>
      `;

      const rewardSection = document.createElement("div");
      rewardSection.className = "reward-section";

      if (unlocked && !claimed) {
        const claimBtn = document.createElement("button");
        claimBtn.className = "claim-btn";
        claimBtn.textContent = "🎁 Claim your rewards";

        claimBtn.addEventListener("click", async () => {
          try {
            const claimRes = await fetch(`http://127.0.0.1:5001/users/${username}/claim_reward/${level.id}`, {
              method: "POST"
            });
            const data = await claimRes.json();
            if (claimRes.ok) {
              rewardSection.innerHTML = `<p class="claimed">✅ Rewards claimed : +${data.earned_coins} coins</p>`;
              claimedRewards.push(level.id);
            } else {
              alert(data.error || "Erreur lors de la récupération.");
            }
          } catch (err) {
            console.error(err);
            alert("Erreur lors de la récupération de la récompense.");
          }
        });

        rewardSection.appendChild(claimBtn);

      } else if (claimed) {
        rewardSection.innerHTML = `<p class="claimed">✅ Reward claimed</p>`;
      } else {
        rewardSection.innerHTML = `<p class="locked">🔒 Level locked</p>`;
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

    // --- Slider 3 cartes ---
    const levels = Array.from(container.children);
    let currentIndex = 0;

    function updateClasses() {
      levels.forEach((lvl, i) => {
        lvl.classList.remove("prev", "active", "next");
        lvl.style.display = "none"; // cacher toutes les cartes par défaut

        if (i === currentIndex) {
          lvl.classList.add("active");
          lvl.style.display = "block";
        } else if (i === currentIndex - 1) {
          lvl.classList.add("prev");
          lvl.style.display = "block";
        } else if (i === currentIndex + 1) {
          lvl.classList.add("next");
          lvl.style.display = "block";
        }
      });
    }

    // --- Ajouter flèches directionnelles ---
    const leftArrow = document.createElement("div");
    leftArrow.className = "arrow arrow-left";
    leftArrow.textContent = "❮";
    leftArrow.onclick = () => { if (currentIndex > 0) { currentIndex--; updateClasses(); } };
    container.parentElement.appendChild(leftArrow);

    const rightArrow = document.createElement("div");
    rightArrow.className = "arrow arrow-right";
    rightArrow.textContent = "❯";
    rightArrow.onclick = () => { if (currentIndex < levels.length - 1) { currentIndex++; updateClasses(); } };
    container.parentElement.appendChild(rightArrow);

    updateClasses();

  } catch (err) {
    console.error("Erreur lors du chargement du Battle Pass :", err);
    container.innerHTML = "<p>Erreur lors du chargement du Battle Pass</p>";
  }
});

// --- Fonction d’affichage des récompenses (inchangée) ---
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
    else if (packName.includes("bronze")) packImg.src = "../images/pack_bronze.png";
    else packImg.src = "../images/pack_ultime.png";

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

    // ✅ Utilisation dynamique de l’image correspondant au niveau
    kitImg.src = `../images/${reward.exclusive_kit}`;
    kitImg.alt = "Exclusive Kit";
    kitImg.className = "reward-img";
    kitDiv.appendChild(kitImg);

    const kitText = document.createElement("span");
    kitText.textContent = "Exclusive Kit";
    kitText.style.display = "block";
    kitText.style.marginTop = "6px";
    kitText.style.fontWeight = "bold";
    kitText.style.color = "#00ffea";
    kitDiv.appendChild(kitText);

    imagesContainer.appendChild(kitDiv);
  }


  modal.classList.add("active");
  modal.classList.remove("hidden");

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
