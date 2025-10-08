from flask import Blueprint, jsonify, request
from db.connection import db

games_bp = Blueprint("games_bp", __name__)
games_collection = db["gamesmode"]


### CREATE (POST) ###
@games_bp.route("/", methods=["POST"])
def add_game():
    try:
        game = request.get_json()
        # Assurez-vous que _id est une string unique
        if "_id" not in game:
            return jsonify({"error": "_id field is required"}), 400
        games_collection.insert_one(game)
        return jsonify({"message": "Mode de jeu ajouté avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### READ (GET one) ###
@games_bp.route("/<game_id>", methods=["GET"])
def get_game(game_id):
    try:
        # Utiliser _id (string) et non id (int)
        game = games_collection.find_one({"_id": game_id})
        if game:
            game["_id"] = str(game["_id"])
            return jsonify(game)
        return jsonify({"message": "Game mode not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### READ (GET all) ###
@games_bp.route("/", methods=["GET"])
def get_all_games():
    try:
        games = list(games_collection.find())
        for game in games:
            game["_id"] = str(game["_id"])
        return jsonify(games)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### UPDATE (PUT) ###
@games_bp.route("/<game_id>", methods=["PUT"])
def update_game(game_id):
    try:
        update_game = request.get_json()
        result = games_collection.update_one({"_id": game_id}, {"$set": update_game})
        if result.matched_count:
            return jsonify({"message": "Game mode updated successfully"}), 200
        return jsonify({"message": "Game mode not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


### DELETE ###
@games_bp.route("/<game_id>", methods=["DELETE"])
def delete_game(game_id):
    try:
        result = games_collection.delete_one({"_id": game_id})
        if result.deleted_count:
            return jsonify({"message": "Game mode deleted successfully"}), 200
        return jsonify({"message": "Game mode not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
