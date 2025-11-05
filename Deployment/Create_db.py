import json
from pymongo import MongoClient
import os

# Récupère l'URI MongoDB depuis l'environnement
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/Soccer_Game_DB")
client = MongoClient(MONGO_URI)
db = client.get_default_database()  # prend la DB indiquée dans l'URI

# Liste des fichiers JSON et des collections correspondantes
collections_files = {
    "achievements": "/app/Backend/json/achievements.json",
    "contracts_forms": "/app/Backend/json/contrats_formes.json",
    "gamesmode": "/app/Backend/json/gamesmode.json",
    "players": "/app/Backend/json/players.json",
    "skills": "/app/Backend/json/skills.json",
}

for collection_name, filepath in collections_files.items():
    with open(filepath, encoding='utf-8') as f:
        data = json.load(f)
        if isinstance(data, list) and data:
            db[collection_name].insert_many(data)
            print(f"Inserted {len(data)} documents into '{collection_name}' collection.")
        else:
            print(f"No data found for collection '{collection_name}'.")

print("Database population complete!")
