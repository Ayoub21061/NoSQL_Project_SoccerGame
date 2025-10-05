from flask import Flask
from Routes.Player_routes import player_bp  # on importe le Blueprint des routes Player
from flask_cors import CORS 


app = Flask(__name__)
CORS(app)

# On enregistre le blueprint des joueurs
app.register_blueprint(player_bp, url_prefix="/players")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
