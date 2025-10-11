# Backend/Routes/User_routes.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db.connection import db
from datetime import datetime

user_bp = Blueprint("user_bp", __name__)
users_collection = db["users"]

# --- Register ---
@user_bp.route("/register", methods=["POST"])
def register():
    try:
        payload = request.json or {}
        username = payload.get("username")
        password = payload.get("password")
        avatar = payload.get("avatar", "default-avatar.png")

        if not username or not password:
            return jsonify({"error": "username and password required"}), 400

        if users_collection.find_one({"username": username}):
            return jsonify({"error": "username already exists"}), 400

        hashed = generate_password_hash(password)
        user_doc = {
            "username": username,
            "password": hashed,
            "avatar": avatar,
            # clef demandée : creation_date (ISO string)
            "creation_date": datetime.utcnow().isoformat(),
            "matches_won": int(payload.get("matches_won", 0)),
            "matches_lost": int(payload.get("matches_lost", 0)),
            "matches_drawn": int(payload.get("matches_drawn", 0)),
            "goals": int(payload.get("goals", 0)),
            "assists": int(payload.get("assists", 0)),
            "saves": int(payload.get("saves", 0)),
            "credits": int(payload.get("credits", 100000)),
            "players_owned": []  # <- nouveau champ
        }

        result = users_collection.insert_one(user_doc)

        # Préparer la réponse sécurisée (sans mot de passe)
        user_safe = {k: v for k, v in user_doc.items() if k != "password"}
        user_safe["_id"] = str(result.inserted_id)

        return jsonify({"success": True, "user": user_safe}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Login ---
@user_bp.route("/login", methods=["POST"])
def login():
    try:
        payload = request.json or {}
        username = payload.get("username")
        password = payload.get("password")

        if not username or not password:
            return jsonify({"error": "username and password required"}), 400

        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # check_password_hash compares le hash stocké avec le mot de passe clair fourni
        if not check_password_hash(user.get("password", ""), password):
            return jsonify({"error": "Mot de passe incorrect"}), 401

        # Sérialiser et sécuriser l'utilisateur (on enlève password)
        user_safe = {k: v for k, v in user.items() if k != "password"}
        user_safe["_id"] = str(user_safe.get("_id"))
        # creation_date déjà string (isoformat) si on l'a créé via register
        return jsonify({"success": True, "user": user_safe}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Get user by username ---
@user_bp.route("/<string:username>", methods=["GET"])
def get_user(username):
    try:
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        user_safe = {k: v for k, v in user.items() if k != "password"}
        user_safe["_id"] = str(user_safe.get("_id"))
        return jsonify(user_safe), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Update credits ---
@user_bp.route("/<string:username>/updateCredits", methods=["POST"])
def update_credits(username):
    try:
        body = request.json or {}
        credits = body.get("credits")
        if credits is None:
            return jsonify({"error": "credits required"}), 400

        res = users_collection.update_one({"username": username}, {"$set": {"credits": int(credits)}})
        if res.matched_count == 0:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@user_bp.route("/<string:username>/buy_player", methods=["POST"])
def buy_player(username):
    try:
        body = request.json
        player_id = body.get("player_id")
        cost = body.get("cost")

        if not player_id or cost is None:
            return jsonify({"error": "player_id et cost requis"}), 400

        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        if user["credits"] < cost:
            return jsonify({"error": "Crédits insuffisants"}), 400

        # Déduire les crédits et ajouter le joueur
        new_credits = user["credits"] - cost
        users_collection.update_one(
            {"username": username},
            {
                "$set": {"credits": new_credits},
                "$push": {"players_owned": player_id}
            }
        )

        # 🔥 Recharger l'utilisateur mis à jour depuis Mongo
        updated_user = users_collection.find_one({"username": username}, {"password": 0})
        updated_user["_id"] = str(updated_user["_id"])

        return jsonify({
            "success": True,
            "user": updated_user
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


