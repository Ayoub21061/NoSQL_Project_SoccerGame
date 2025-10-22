# Backend/Routes/User_routes.py
from flask import Blueprint, request, jsonify
from db.connection import db

user_bp = Blueprint("user_bp", __name__)
users_collection = db["players"]

# --- Acheter un joueur ---
@user_bp.route("/players/<string:username>/buy_player", methods=["POST"])
def buy_player(username):
    try:
        body = request.json
        player_id = body.get("player_id")
        #cost = body.get("cost")
        try:
            cost = int(body.get("cost"))
        except (TypeError, ValueError):
            return jsonify({"error": "cost doit être un nombre"}), 400


        if not player_id or cost is None:
            return jsonify({"error": "player_id et cost requis"}), 400

        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        if user.get("credits", 0) < cost:
            return jsonify({
                "error": "Crédits insuffisants",
                "credits_backend": user.get("credits", 0),
                "cost": cost
            }), 400

        # Déduire les crédits et ajouter le joueur
        new_credits = user["credits"] - cost
        users_collection.update_one(
            {"username": username},
            {
                "$set": {"credits": new_credits},
                "$push": {"players_owned": player_id}
            }
        )

        # Recharger l'utilisateur mis à jour depuis Mongo
        updated_user = users_collection.find_one({"username": username}, {"password": 0})
        updated_user["_id"] = str(updated_user["_id"])

        # Retourner directement les crédits pour le frontend
        return jsonify({
            "success": True,
            "user": updated_user,
            "credits": new_credits
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<string:username>", methods=["GET"])
def get_player_info_battlepass(username):
    try:
        player = users_collection.find_one({"username": username}, {"password": 0})
        if not player:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Assurer que current_xp existe
        if "current_xp" not in player:
            player["current_xp"] = 0

        player["_id"] = str(player["_id"])
        return jsonify(player), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<string:username>/claim_rewards", methods=["POST"])
def claim_rewards(username):
    try:
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Récupérer tous les niveaux du Battle Pass
        battlepass = list(db["achievements"].find({"type": "Battle Pass"}))

        current_xp = user.get("current_xp", 0)
        earned_coins = 0
        earned_packs = []

        # Crée la clé "packs_owned" si elle n'existe pas
        if "packs_owned" not in user:
            user["packs_owned"] = []

        for level in battlepass:
            xp_required = level.get("xp_required", 0)
            reward = level.get("reward", {})
            if current_xp >= xp_required and not level.get("reward_claimed", False):
                # --- Ajout des coins ---
                coins = reward.get("coins", 0)
                earned_coins += coins

                # --- Enregistrement du pack s’il existe ---
                pack_name = reward.get("pack")
                if pack_name:
                    earned_packs.append(pack_name)
                    if pack_name not in user["packs_owned"]:
                        user["packs_owned"].append(pack_name)

                # Marquer la récompense comme réclamée côté serveur
                db["achievements"].update_one(
                    {"_id": level["_id"]},
                    {"$set": {"reward_claimed": True}}
                )

        # --- Mise à jour des crédits et des packs du joueur ---
        new_credits = user.get("credits", 0) + earned_coins
        users_collection.update_one(
            {"username": username},
            {"$set": {"credits": new_credits, "packs_owned": user["packs_owned"]}}
        )

        return jsonify({
            "message": "Récompenses attribuées",
            "earned_coins": earned_coins,
            "earned_packs": earned_packs,
            "new_credits": new_credits
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<string:username>/claim_reward/<int:level_id>", methods=["POST"])
def claim_single_reward(username, level_id):
    try:
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # --- Créer la liste des récompenses réclamées si elle n'existe pas ---
        if "claimed_rewards" not in user:
            user["claimed_rewards"] = []

        # Vérifier si le joueur a déjà récupéré cette récompense
        if level_id in user["claimed_rewards"]:
            return jsonify({"message": "Récompense déjà récupérée"}), 200

        # Récupérer le niveau dans la collection achievements
        level = db["achievements"].find_one({
            "type": "Battle Pass",
            "id": level_id  # Assure-toi que c’est bien "id" et pas "level_id"
        })
        if not level:
            return jsonify({"error": "Niveau non trouvé"}), 404

        current_xp = user.get("current_xp", 0)
        xp_required = level.get("xp_required", 0)

        if current_xp < xp_required:
            return jsonify({"error": "XP insuffisante"}), 400

        reward = level.get("reward", {})
        coins = reward.get("coins", 0)
        pack_name = reward.get("pack")

        # Mise à jour des crédits
        new_credits = user.get("credits", 0) + coins

        # Mise à jour des packs
        packs = user.get("packs_owned", [])
        if pack_name and pack_name not in packs:
            packs.append(pack_name)

        # Ajouter l'ID de la récompense réclamée
        claimed_rewards = user["claimed_rewards"]
        claimed_rewards.append(level_id)

        # Sauvegarder côté DB
        users_collection.update_one(
            {"username": username},
            {"$set": {"credits": new_credits, "packs_owned": packs, "claimed_rewards": claimed_rewards}}
        )

        return jsonify({
            "message": "Récompense récupérée avec succès",
            "earned_coins": coins,
            "earned_pack": pack_name,
            "new_credits": new_credits
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@user_bp.route("/<username>/add_player", methods=["POST"])
def add_player_to_user(username):
    try:
        data = request.get_json()
        player_id = data.get("player_id")

        if not player_id:
            return jsonify({"error": "player_id manquant"}), 400

        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Crée la clé players_owned si elle n'existe pas encore
        if "players_owned" not in user:
            user["players_owned"] = []

        # Vérifie que le joueur n'est pas déjà dans la liste
        if player_id in user["players_owned"]:
            return jsonify({"message": "Joueur déjà possédé"}), 200

        # Ajoute le joueur à la liste
        users_collection.update_one(
            {"username": username},
            {"$push": {"players_owned": player_id}}
        )

        return jsonify({"message": f"Joueur {player_id} ajouté à l'utilisateur {username}"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


