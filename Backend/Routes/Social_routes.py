from flask import Blueprint, jsonify, request
from db.connection import db
from bson import ObjectId
from datetime import date

social_bp = Blueprint("social_bp", __name__)
players_collection = db["players"]

# Recherche d'un joueur par username
@social_bp.route("/search", methods=["GET"])
def search_player():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username manquant"}), 400

    player = players_collection.find_one({"username": username})
    if not player:
        return jsonify({"error": "Joueur introuvable"}), 404

    player["_id"] = str(player["_id"])
    filtered_player = {
        "username": player.get("username"),
        "avatar": player.get("avatar"),
        "score_global": player.get("score_global", 0),
        "rank": player.get("rank", 0),
        "matches_won": player.get("matches_won", 0),
        "matches_lost": player.get("matches_lost", 0),
        "matches_draw": player.get("matches_draw", 0)
    }
    return jsonify(filtered_player), 200

# Envoyer une demande d'ami
@social_bp.route("/friend_request", methods=["POST"])
def send_friend_request():
    data = request.get_json()
    sender = data.get("sender")
    receiver = data.get("receiver")
    if not sender or not receiver:
        return jsonify({"error": "sender et receiver requis"}), 400
    if sender == receiver:
        return jsonify({"error": "Vous ne pouvez pas vous ajouter vous-même"}), 400

    receiver_player = players_collection.find_one({"username": receiver})
    sender_player = players_collection.find_one({"username": sender})
    if not receiver_player or not sender_player:
        return jsonify({"error": "Joueur introuvable"}), 404

    # Vérifier si déjà amis
    if sender in receiver_player.get("friends", []):
        return jsonify({"error": "Vous êtes déjà amis"}), 400

    # Vérifier si demande déjà envoyée
    existing_requests = receiver_player.get("friend_requests", [])
    if any(req["sender"] == sender for req in existing_requests):
        return jsonify({"error": "Demande déjà envoyée"}), 400

    # Ajouter la demande
    new_request = {"sender": sender, "date": date.today().isoformat()}
    players_collection.update_one(
        {"username": receiver},
        {"$push": {"friend_requests": new_request}}
    )
    return jsonify({"message": "Demande d'ami envoyée"}), 200

# Voir les demandes en attente
@social_bp.route("/friend_requests/<username>", methods=["GET"])
def get_friend_requests(username):
    player = players_collection.find_one({"username": username})
    if not player:
        return jsonify({"error": "Joueur introuvable"}), 404
    return jsonify({"requests": player.get("friend_requests", [])}), 200

# Accepter ou refuser une demande
@social_bp.route("/friend_request/respond", methods=["POST"])
def respond_friend_request():
    data = request.get_json()
    receiver = data.get("receiver")
    sender = data.get("sender")
    accept = data.get("accept", True)

    if not receiver or not sender:
        return jsonify({"error": "sender et receiver requis"}), 400

    receiver_player = players_collection.find_one({"username": receiver})
    sender_player = players_collection.find_one({"username": sender})
    if not receiver_player or not sender_player:
        return jsonify({"error": "Joueur introuvable"}), 404

    # Supprimer la demande
    players_collection.update_one(
        {"username": receiver},
        {"$pull": {"friend_requests": {"sender": sender}}}
    )

    if accept:
        # Ajouter dans la liste d'amis des deux joueurs
        players_collection.update_one(
            {"username": receiver},
            {"$push": {"friends": sender}}
        )
        players_collection.update_one(
            {"username": sender},
            {"$push": {"friends": receiver}}
        )
        return jsonify({"message": f"{sender} est maintenant votre ami"}), 200
    else:
        return jsonify({"message": f"Demande de {sender} refusée"}), 200


# Supprimer un ami
@social_bp.route("/friend/remove", methods=["POST"])
def remove_friend():
    data = request.get_json()
    user1 = data.get("user1")
    user2 = data.get("user2")
    if not user1 or not user2:
        return jsonify({"error": "user1 et user2 requis"}), 400

    players_collection.update_one({"username": user1}, {"$pull": {"friends": user2}})
    players_collection.update_one({"username": user2}, {"$pull": {"friends": user1}})
    return jsonify({"message": f"{user2} a été supprimé de vos amis"}), 200

# Correction pour récupérer la liste complète d'amis avec info utilisateur
@social_bp.route("/players/<username>", methods=["GET"])
def get_player(username):
    player = players_collection.find_one({"username": username})
    if not player:
        return jsonify({"error": "Joueur introuvable"}), 404

    friends = []
    for friend_username in player.get("friends", []):
        friend = players_collection.find_one({"username": friend_username}, {"_id": 0, "username": 1})
        if friend:
            friends.append(friend["username"])

    player_data = {
        "username": player.get("username"),
        "avatar": player.get("avatar"),
        "friends": friends
    }
    return jsonify(player_data), 200

