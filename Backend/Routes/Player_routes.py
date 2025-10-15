from flask import Blueprint, jsonify, request
from db.connection import db
from Models.Player import Player  # ton modèle Pydantic
from datetime import date 
from bson import ObjectId


# Création du Blueprint
player_bp = Blueprint("player_bp", __name__)


# Collection MongoDB
players_collection = db["players"]


### CREATE (POST) ###
@player_bp.route("/", methods=["POST"])
def add_player():
    try:
        data = request.get_json()
        password = data.get("password")
        if not password:
            return jsonify({"error": "Le mot de passe est requis"}), 400

        data["password"] = password

        if "account_creation_date" not in data:
            # côté serveur : mettre une string ISO
            data["account_creation_date"] = date.today().isoformat()

        data["best_player_stats"] = {"goals": 0, "assists": 0, "saves": 0}

        player = Player(**data)
        player_dict = player.model_dump()

        # Convertir les datetime.date en string ISO si Pydantic les a transformés en date
        acct_date = player_dict.get("account_creation_date")
        if isinstance(acct_date, date):
            player_dict["account_creation_date"] = acct_date.isoformat()

        players_collection.insert_one(player_dict)
        return jsonify({"message": "Utilisateur ajouté avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### LOGIN ### : Ancienne fonction avec chiffrement
# @player_bp.route("/login", methods=["POST"])
# def login_player():
#     try:
#         data = request.get_json()
#         username = data.get("username")
#         password = data.get("password")

#         player = players_collection.find_one({"username": username})
#         if not player:
#             return jsonify({"error": "Utilisateur introuvable"}), 404

#         # Comparaison simple (en clair)
#         if player.get("password") == password:
#             return jsonify({"message": "Connexion réussie"}), 200
#         else:
#             return jsonify({"error": "Mot de passe incorrect"}), 401
#     except Exception as e:
#         return jsonify({"error": str(e)}), 400

@player_bp.route("/login", methods=["POST"])
def login_player():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        player = players_collection.find_one({"username": username})
        if not player:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        # Mot de passe en clair temporairement
        if player.get("password") == password:
            player["id"] = str(player["_id"])  # convert Mongo ObjectId en string
            del player["_id"]
            return jsonify({
                "message": "Connexion réussie",
                "player": player
            }), 200
        else:
            return jsonify({"error": "Mot de passe incorrect"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### READ (GET one) ###
@player_bp.route("/<player_id>", methods=["GET"])
def get_player(player_id):
    try:
        player = players_collection.find_one({"_id": ObjectId(player_id)})
        if player:
            player["_id"] = str(player["_id"])
            return jsonify(player)
        return jsonify({"message": "Player not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### READ (GET all) ###
@player_bp.route("/", methods=["GET"])
def get_all_players():
    try:
        players = list(players_collection.find())
        for player in players:
            player["_id"] = str(player["_id"])
        return jsonify(players)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### UPDATE (PUT) ###
@player_bp.route("/<player_id>", methods=["PUT"])
def update_player(player_id):
    try:
        update_data = request.get_json()

        # 🔍 Récupérer le joueur existant
        player = players_collection.find_one({"_id": ObjectId(player_id)})
        if not player:
            return jsonify({"error": "Joueur introuvable"}), 404

        # 🧩 Fusionner les données (le joueur existant + les modifs)
        merged_player = {**player, **update_data}

        # ✅ Recalculer le score global à partir des valeurs finales
        matches_won = int(merged_player.get("matches_won", 0))
        matches_draw = int(merged_player.get("matches_draw", 0))
        score_global = (matches_won * 3) + matches_draw

        # 🧾 Préparer les champs à mettre à jour
        merged_player["score_global"] = score_global
        del merged_player["_id"]  # jamais modifier _id

        # ⚡️ Mettre à jour en base
        result = players_collection.update_one(
            {"_id": ObjectId(player_id)},
            {"$set": merged_player}
        )

        return jsonify({
            "message": "Profil mis à jour avec succès",
            "score_global": score_global
        }), 200

    except Exception as e:
        print("Erreur update_player:", e)
        return jsonify({"error": str(e)}), 400

### DELETE ###
@player_bp.route("/<player_id>", methods=["DELETE"])
def delete_player(player_id):
    try:
        result = players_collection.delete_one({"_id": ObjectId(player_id)})
        if result.deleted_count:
            return jsonify({"message": "Compte supprimé avec succès"}), 200
        return jsonify({"error": "Joueur introuvable"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@player_bp.route("/<player_id>/password", methods=["PUT"])
def update_password(player_id):
    try:
        data = request.get_json()
        old_pwd = data.get("oldPassword")
        new_pwd = data.get("newPassword")

        player = players_collection.find_one({"_id": ObjectId(player_id)})
        if not player:
            return jsonify({"error": "Joueur introuvable"}), 404

        if player.get("password") != old_pwd:
            return jsonify({"error": "Ancien mot de passe incorrect"}), 401

        players_collection.update_one(
            {"_id": ObjectId(player_id)}, {"$set": {"password": new_pwd}}
        )

        return jsonify({"message": "Mot de passe mis à jour avec succès"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@player_bp.route("/<player_id>/avatar", methods=["PUT"])
def update_avatar(player_id):
    try:
        data = request.get_json()
        avatar = data.get("avatar")

        if not avatar:
            return jsonify({"error": "Aucun avatar fourni"}), 400

        result = players_collection.update_one(
            {"_id": ObjectId(player_id)}, {"$set": {"avatar": avatar}}
        )

        if result.matched_count:
            return jsonify({"message": "Avatar mis à jour avec succès"}), 200
        return jsonify({"error": "Joueur introuvable"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@player_bp.route("/username/<string:username>", methods=["GET"])
def get_player_by_username(username):
    try:
        player = players_collection.find_one({"username": username})
        if not player:
            return jsonify({"error": "Joueur introuvable"}), 404

        player["_id"] = str(player["_id"])
        return jsonify(player), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@player_bp.route("/ranking/<username>", methods=["GET"])
def get_ranking_around(username):
    try:
        # Récupérer tous les joueurs triés par score_global décroissant
        players = list(players_collection.find().sort("score_global", -1))
        
        # Ajouter l'index (rang)
        for i, player in enumerate(players):
            player["_id"] = str(player["_id"])
            player["rank"] = i + 1

        # Trouver la position du joueur
        user_index = next((i for i, p in enumerate(players) if p["username"] == username), None)
        if user_index is None:
            return jsonify({"error": "Joueur introuvable"}), 404

        # Définir la tranche autour du joueur (5 avant + joueur + 4 après = 10 max)
        start = max(user_index - 5, 0)
        end = min(user_index + 5, len(players))
        ranking_slice = players[start:end]

        return jsonify(ranking_slice), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
