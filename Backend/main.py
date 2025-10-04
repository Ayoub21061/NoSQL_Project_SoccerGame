from flask import Flask
from Routes.Player_routes import player_bp  # on importe le Blueprint des routes Player
from Routes.Gamesmode_routes import games_bp  # on importe le Blueprint des routes Gamesmode
from Routes.Achievements_routes import achievements_bp  # on importe le Blueprint des routes Achievements


app = Flask(__name__)

# On enregistre le blueprint des joueurs
app.register_blueprint(player_bp, url_prefix="/players")
# On enregistre le blueprint des modes de jeu
app.register_blueprint(games_bp, url_prefix="/games")
# On enregistre le blueprint des succès
app.register_blueprint(achievements_bp, url_prefix="/achievements")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
