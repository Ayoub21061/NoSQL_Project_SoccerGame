from flask import Blueprint, jsonify, request
from db.connection import db
from bson import ObjectId  # Pour gérer les ObjectId MongoDB

skills_bp = Blueprint("skills_bp", __name__)
skills_collection = db["skills"]

# CREATE
@skills_bp.route("/", methods=["POST"])
def add_skill():
    try:
        skill = request.get_json()
        skills_collection.insert_one(skill)
        return jsonify({"message": "Compétence ajoutée avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# READ one
@skills_bp.route("/<skill_id>", methods=["GET"])
def get_skill(skill_id):
    try:
        skill = skills_collection.find_one({"_id": ObjectId(skill_id)})
        if skill:
            skill["_id"] = str(skill["_id"])
            return jsonify(skill)
        return jsonify({"message": "Compétence non trouvée"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# READ all
@skills_bp.route("/", methods=["GET"])
def get_all_skills():
    try:
        skills = list(skills_collection.find())
        for skill in skills:
            skill["_id"] = str(skill["_id"])
        return jsonify(skills)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# UPDATE
@skills_bp.route("/<skill_id>", methods=["PUT"])
def update_skill(skill_id):
    try:
        updated_skill = request.get_json()
        result = skills_collection.update_one(
            {"_id": ObjectId(skill_id)},
            {"$set": updated_skill}
        )
        if result.matched_count:
            return jsonify({"message": "Compétence mise à jour avec succès"}), 200
        return jsonify({"message": "Compétence non trouvée"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# DELETE
@skills_bp.route("/<skill_id>", methods=["DELETE"])
def delete_skill(skill_id):
    try:
        result = skills_collection.delete_one({"_id": ObjectId(skill_id)})
        if result.deleted_count:
            return jsonify({"message": "Compétence supprimée avec succès"}), 200
        return jsonify({"message": "Compétence non trouvée"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
