from flask import Blueprint, jsonify, request
from db.connection import db
from Models.Player import Player  # ton modèle Pydantic
import bcrypt 
from datetime import date 

# Création du Blueprint pour regrouper toutes les routes Player
# Le blueprint permet de découper l'application en plusieurs fichiers.
# ça évite de devoir mettre toutes les routes dans le main
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
            return jsonify({"error":"Le mot de passe est requis"}), 400
        
        # Hash du mot de passe avant insertion dans la DB
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        data["password"] = hashed_password.decode('utf-8') # On stocke le hash converti en str

        # On complète les champs obligatoires manquants
        if "account_creation_date" not in data:
            data["account_creation_date"] = date.today().isoformat()
        
        data["best_player_stats"] = {"goals": 0, "assists": 0, "saves": 0}

        player = Player(**data)  # Validation Pydantic

        player_dict = player.model_dump()
        # s'assurer que la date est bien string
        player_dict["account_creation_date"] = player_dict["account_creation_date"].isoformat() if isinstance(player_dict["account_creation_date"], date) else player_dict["account_creation_date"]
        players_collection.insert_one(player_dict)
        #players_collection.insert_one(player.model_dump())
        return jsonify({"message": "Utilisateur ajouté avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Connexion du joueur
@player_bp.route("/login", methods=["POST"])
def login_player():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        player = players_collection.find_one({"username": username})
        if not player:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        stored_hash = player.get("password").encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            return jsonify({"message": "Connexion réussie"}), 200
        else:
            return jsonify({"error": "Mot de passe incorrect"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 400



### READ (GET one) ###
@player_bp.route("/<player_id>", methods=["GET"])
def get_player(player_id):
    try:
        player = players_collection.find_one({"id": int(player_id)})
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
        update_player = request.get_json()
        result = players_collection.update_one({"id": int(player_id)}, {"$set": update_player})
        if result.matched_count:
            return jsonify({"message": "Player updated successfully"}), 200
        return jsonify({"message": "Player not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### DELETE ###
@player_bp.route("/<player_id>", methods=["DELETE"])
def delete_player(player_id):
    try:
        result = players_collection.delete_one({"id": int(player_id)})
        if result.deleted_count:
            return jsonify({"message": "Player deleted successfully"}), 200
        return jsonify({"message": "Player not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
