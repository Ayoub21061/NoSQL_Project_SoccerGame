from flask import Flask, send_from_directory
from Routes.Player_routes import player_bp
from Routes.Gamesmode_routes import games_bp
from Routes.Achievements_routes import achievements_bp
from Routes.Skills_routes import skills_bp
from Routes.User_routes import user_bp
from Routes.Contrats_Formes_routes import contracts_forms_bp
import os
from flask_cors import CORS  

app = Flask(__name__)
CORS(app)

# -------------------------------
# Blueprints pour ton API MongoDB
# -------------------------------
app.register_blueprint(player_bp, url_prefix="/players")
app.register_blueprint(games_bp, url_prefix="/games")
app.register_blueprint(achievements_bp, url_prefix="/achievements")
app.register_blueprint(skills_bp, url_prefix="/skills")
app.register_blueprint(user_bp, url_prefix="/users")
app.register_blueprint(contracts_forms_bp, url_prefix="/contracts_forms")

# -------------------------------
# Chemin du dossier Frontend
# -------------------------------
FRONTEND_FOLDER = "/app/Frontend"

# -------------------------------
# Routes pour servir le Frontend
# -------------------------------

# Route par défaut pour la page d'accueil
@app.route("/", strict_slashes=False)
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")

# Route générique pour tous les fichiers HTML, CSS, JS
@app.route("/<path:filename>", strict_slashes=False)
def frontend_files(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)

# -------------------------------
# Lancer le serveur Flask
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)