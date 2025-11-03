from flask import Blueprint, jsonify, request
from db.connection import db
from bson import ObjectId

contracts_forms_bp = Blueprint("contracts_forms_bp", __name__)
contracts_forms_collection = db["contracts_forms"]
users_collection = db["players"]

# --- CREATE ---
@contracts_forms_bp.route("/", methods=["POST"])
def add_contract_form():
    try:
        item = request.get_json()
        contracts_forms_collection.insert_one(item)
        return jsonify({"message": "Élément ajouté avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- READ ALL ---
@contracts_forms_bp.route("/", methods=["GET"])
def get_all_contracts_forms():
    try:
        items = list(contracts_forms_collection.find())
        for i in items:
            i["_id"] = str(i["_id"])
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- Acheter un contrat ou une forme ---
@contracts_forms_bp.route("/<string:username>/buy", methods=["POST"])
def buy_contract_or_form(username):
    try:
        body = request.json
        item_id = body.get("item_id")
        cost = int(body.get("cost", 0))

        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        if user.get("credits", 0) < cost:
            return jsonify({
                "error": "Crédits insuffisants",
                "credits_backend": user.get("credits", 0),
                "cost": cost
            }), 400

        # Convertir item_id en string
        item_id = str(item_id)

        # Déduire le coût et enregistrer l'achat
        new_credits = user["credits"] - cost
        users_collection.update_one(
            {"username": username},
            {
                "$set": {"credits": new_credits},
                "$push": {"contrats_formes": item_id}
            }
        )

        updated_user = users_collection.find_one({"username": username}, {"password": 0})
        updated_user["_id"] = str(updated_user["_id"])

        return jsonify({
            "success": True,
            "credits": new_credits,
            "user": updated_user
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
