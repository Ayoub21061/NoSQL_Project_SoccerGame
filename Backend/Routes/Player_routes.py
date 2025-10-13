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

        # Pas de chiffrement mais envisager d'en ajouter plus tard
        data["password"] = password  

        if "account_creation_date" not in data:
            data["account_creation_date"] = date.today().isoformat()
        data["best_player_stats"] = {"goals": 0, "assists": 0, "saves": 0}

        player = Player(**data)
        player_dict = player.model_dump()
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
        result = players_collection.update_one(
            {"_id": ObjectId(player_id)}, {"$set": update_data}
        )

        if result.matched_count:
            return jsonify({"message": "Profil mis à jour avec succès"}), 200
        return jsonify({"error": "Joueur introuvable"}), 404
    except Exception as e:
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
