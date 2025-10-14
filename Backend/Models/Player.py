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
    password : str
    avatar : Optional[str] = None
    account_creation_date : date 
    matches_won : int = 0 
    matches_lost : int = 0 
    matches_draw : int = 0 
    total_playtime : int = 0 
    best_player_stats : PlayerStats
    achievements : List[str] = []
    credits : int = 150000
    rank : int = 1
    players_owned: List[str] = []
    mail : str
    score_global : int = 0 
    contrats_formes : List[str]


# On va utiliser les infos sur le nombres de matchs gagnés, perdus ou nuls et calculés les points en fonction de ça. 
# Je pense qu'il faudrait créér une autre classe pour le détail des matchs : buts encaissés, marqués, penaltys

# On va juste garder victoire ou défaite, 3 points pour la victoire, 1 point pour le match nul, 0 pour la défaite. 

# Si je suis motivée, je peux essayer de rendre ça plus complexe. 

# Le score global est mis à jour en fonction des matchs. Mais pour pouvoir faire le classement, il faut avoir accès aux points dans la DB et sur base de ça, on pourra faire le classement. 

# 