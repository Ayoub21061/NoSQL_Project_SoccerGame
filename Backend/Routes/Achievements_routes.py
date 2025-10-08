from flask import Blueprint, jsonify, request
from db.connection import db  # connexion à MongoDB

# Création du Blueprint pour regrouper toutes les routes Achievements
achievements_bp = Blueprint("achievements_bp", __name__) #-> Permet de regrouper les routes liées aux succès. car si on ne met pas ça, seul les routes players sont connu par le main.py et les autres routes obtiennent un URL NOT FOUND

# Collection MongoDB
achievements_collection = db["achievements"]

### CREATE (POST) ###
@achievements_bp.route("/", methods=["POST"])
def add_achievement():
    try:
        achievement = request.get_json()  # pour l'instant simple dictionnaire
        achievements_collection.insert_one(achievement)
        return jsonify({"message": "Succès ajouté avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
### READ (GET one) ###
@achievements_bp.route("/<achievement_id>", methods=["GET"])
def get_achievement(achievement_id):
    try:
        achievement = achievements_collection.find_one({"id": int(achievement_id)})
        if achievement:
            achievement["_id"] = str(achievement["_id"])
            return jsonify(achievement)
        return jsonify({"message": "Succès non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

### READ (GET all) ###
@achievements_bp.route("/", methods=["GET"])
def get_all_achievements():
    try:
        achievements = list(achievements_collection.find())
        for achievement in achievements:
            achievement["_id"] = str(achievement["_id"])
        return jsonify(achievements)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
### UPDATE (PUT) ###
@achievements_bp.route("/<achievement_id>", methods=["PUT"])
def update_achievement(achievement_id):
    try:
        update_achievement = request.get_json()
        result = achievements_collection.update_one({"id": int(achievement_id)}, {"$set": update_achievement})
        if result.matched_count:
            return jsonify({"message": "Succès mis à jour avec succès"}), 200
        return jsonify({"message": "Succès non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
### DELETE (DELETE) ###
@achievements_bp.route("/<achievement_id>", methods=["DELETE"])
def delete_achievement(achievement_id):
    try:
        result = achievements_collection.delete_one({"id": int(achievement_id)})
        if result.deleted_count:
            return jsonify({"message": "Succès supprimé avec succès"}), 200
        return jsonify({"message": "Succès non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    