# Informations à retrouver chez le joueur : Nom d'utilisateur, avatar, date de création du compte, match remportés / perdus / nuls, stat de performances, parlamères / historique / classement, temps total de jeu 

# Remarque : BaseModel est une classe  de Pydantic utilisée pour créer des modèles de données qui permet de faire des validations automatiques des données. Donc quand on envoie un json, si la structure est pas respectée, ça passe pas. 

from pydantic import BaseModel
from typing import List, Optional
from datetime import date 


# classe pour les statistiques détaillées d'un joueur.
class PlayerStats(BaseModel):
    goals : int = 0 
    assists : int = 0 
    saves : int = 0 


class Player(BaseModel):
    username : str
    avatar : Optional[str] = None
    account_creation_date : date 
    matches_won : int = 0 
    matches_lost : int = 0 
    matches_draw : int = 0 
    total_playtime : int = 0 
    best_player_stats : PlayerStats
    achievements : List[str] = []
    rank : int = 1000
