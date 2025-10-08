from flask import Blueprint, jsonify, request
from db.connection import db
from Models import Player  # ton modèle Pydantic

# Création du Blueprint pour regrouper toutes les routes Player
# Le blueprint permet de découper l'application en plusieurs fichiers.
# ça évite de devoir mettre toutes les routes dans le main
player_bp = Blueprint("player_bp", __name__)

# Collection MongoDB
players_collection = db["Player"]


### CREATE (POST) ###
@player_bp.route("/", methods=["POST"])
def add_player():
    try:
        player = Player(**request.get_json())  # Validation Pydantic
        players_collection.insert_one(player.model_dump())
        return jsonify({"message": "Utilisateur ajouté avec succès"}), 201
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
