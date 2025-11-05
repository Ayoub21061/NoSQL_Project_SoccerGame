# Soccer Game Management

Une application de gestion et simulation de joueurs de foot, avec classement, récompenses et modes de jeu variés. Chaque utilisateur peut créer un compte, acheter des joueurs, composer son équipe, participer à des matchs et suivre ses performances.

---

## Fonctionnalités

- **Connexion / inscription** : création de compte utilisateur et connexion avec nom d’utilisateur et mot de passe.
- **Profil utilisateur** : visualiser les statistiques (victoires, défaites, matchs nuls, goals, passes, arrêts), score global, crédits, rang et classement.
- **Amis** : envoyer des demandes d’amis, accepter ou refuser des demandes, voir la liste des amis ainsi que leurs statistiques.
- **Récompenses** : afficher les achievements à débloquer selon les défis réalisés.
- **Modes de jeu** : consulter différents modes de jeu avec règles, et accéder au détail de chaque mode.
- **Gestion des joueurs** : acheter des joueurs de foot.
- **Gestion des items** : acheter des contrats et des boosters.
- **Composition d’équipe** : créer son équipe, visualiser le collectif entre joueurs, choisir le maillot de l'équipe, appliquer les contrats et les boosters pour augmenter les performances.
- **Packs** : recevoir des packs contenant des joueurs ou autres objets virtuels.
- **Battle Pass** : débloquer des récompenses selon le niveau du joueur. 
- **Paramètres du compte** : visualiser les informations personnelles, changer son mot de passe et son avatar.


---

## Entités principales

Le projet utilise principalement **une structure NoSQL** avec MongoDB. Les entités sont les suivantes :

- **players** : profil de l’utilisateur, statistiques, joueurs possédés, contrats et formes, amis, score global, ...
- **achievements** : ensemble des défis réalisables pour gagner des récompenses.
- **skills** : joueurs de foot, gestes techniques, poste, pied faible, ... 
- **contracts_forms** : améliorations applicables aux joueurs.
- **gamesmode** : modes de jeu disponibles avec règles et détails.

---

## Technologies utilisées

- **Backend** : Python, Flask  
- **Base de données** : MongoDB, gérée via Docker  
- **Frontend** : HTML, CSS, JavaScript  
- **Conteneurisation** : Docker, Docker Compose  

---

## Installation et exécution

1. Cloner le dépôt :

```bash
```git clone <https://github.com/Ayoub21061/NoSQL_Project_SoccerGame.git>```
```cd <rcd NoSQL_Project_SoccerGame>``
```

2. Lancer les conteneurs Docker : 

```docker-compose up --build```

3. Remplir la base de données avec les JSON : 

```docker-compose up populate```

4. Accéder à l'application depuis le navigateur : 

http://localhost:5001


--- 

## Structure globale du projet 

**Backend/**
- `db/` — Base de données MongoDB utilisée  
- `json/` — Fichiers JSON pour remplir la base  
- `Models/` — Modèles pour les entités MongoDB  
- `Routes/` — Routes API  
- `main.py` — Point d’entrée Flask  

**Deployment/**
- `Create_db.py`  
- `docker-compose.yml`  
- `Dockerfile`  
- `requirements.txt`  

**Frontend/**
- `CSS/`  
- `HTML/`  
- `images/`  
- `js/`




