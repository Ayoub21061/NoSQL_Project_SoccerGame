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


