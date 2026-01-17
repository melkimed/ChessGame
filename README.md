# Chess Multiplayer - Jeu d'Échecs en Temps Réel

Salut ! Voici mon projet de jeu d'échecs multijoueurs que j'ai développé avec Angular et Spring Boot. L'idée était de créer quelque chose de simple mais fonctionnel où deux personnes peuvent jouer aux échecs ensemble en temps réel.

Ce que ça fait

Le concept est assez direct : tu te connectes, tu vois qui d'autre est en ligne, tu peux inviter quelqu'un à jouer, et hop, vous voilà en train de jouer aux échecs avec synchronisation instantanée des coups.

Les trucs qui marchent bien :
- Connexion simple (pas de complications, juste username/password)
- Liste des joueurs connectés en temps réel
- Système d'invitations avec notifications
- Plateau d'échecs interactif avec toutes les pièces
- Synchronisation des coups via WebSockets
- Sauvegarde automatique des parties
- Historique des coups visible pendant la partie

Ce qui est cool techniquement :
- Communication WebSocket bidirectionnelle
- Architecture propre avec services séparés
- Validation des mouvements côté client
- Persistance en base SQL Server
- Interface responsive qui marche sur mobile

Stack technique

J'ai choisi des technos que je maîtrise bien :
- Frontend : Angular 17 (TypeScript, RxJS pour la réactivité)
- Backend : Spring Boot 3 (Java 17, WebSockets, JPA)
- Base de données : SQL Server (parce que c'est ce qu'on a au boulot)
- Communication : WebSockets natifs + STOMP

Installation

Ce dont tu as besoin :
- Node.js 18+ 
- Java 17+
- Maven 3.8+
- SQL Server (LocalDB suffit pour tester)

Le plus simple :
```bash
# Tout installer d'un coup
install-deps.bat

# Démarrer l'app
start-dev.bat
```

Ça va ouvrir deux terminaux : un pour le backend Spring Boot, un pour Angular. Le frontend sera accessible sur http://localhost:4200.

Si tu préfères faire à la main

Backend :
```bash
cd backend
mvn spring-boot:run
```

Frontend :
```bash
cd frontend
npm install
ng serve
```

Base de données

Pour SQL Server LocalDB (le plus simple) :
```bash
sqllocaldb create MSSQLLocalDB
sqllocaldb start MSSQLLocalDB
```

La base `chessdb` se crée automatiquement au démarrage. Si tu veux des données de test, il y a des scripts SQL dans `backend/src/main/resources/sql/`.

Comment ça marche

1. Connexion : Crée un compte ou connecte-toi
2. Lobby : Tu vois qui est en ligne
3. Invitation : Clique sur quelqu'un pour l'inviter
4. Partie : Une fois acceptée, vous êtes redirigés vers le plateau
5. Jeu : Clique sur une pièce puis sur la case de destination

Les coups sont synchronisés instantanément et sauvegardés en base. Si tu fermes ton navigateur et reviens, tu peux reprendre la partie où tu l'avais laissée.

Architecture

```
chess-multiplayer/
├── frontend/                 # App Angular
│   ├── src/app/components/   # Composants (login, lobby, chess-board)
│   ├── src/app/services/     # Services (auth, game, websocket)
│   └── src/environments/     # Config dev/prod
├── backend/                  # API Spring Boot
    ├── src/main/java/com/chess/
    │   ├── controller/       # REST + WebSocket controllers
    │   ├── service/          # Logique métier
    │   ├── model/           # Entités JPA
    │   └── dto/             # Objets de transfert
    └── src/main/resources/   # Config L

```

Détails techniques

WebSockets : J'utilise STOMP over WebSocket pour la communication temps réel. Chaque partie a son propre topic (`/topic/game/{gameId}`) et les joueurs reçoivent les notifications via des queues personnelles.

Validation des mouvements : Côté client pour l'UX (highlighting des cases valides), côté serveur pour la sécurité. Toutes les pièces ont leurs règles implémentées.

Persistance : Chaque coup est sauvegardé avec position de départ/arrivée, type de pièce, timestamp, etc. Ça permet de reconstituer l'historique complet.

Gestion d'état : RxJS côté Angular pour la réactivité, services avec interfaces côté Spring pour la maintenabilité.

Améliorations possibles

Si j'avais plus de temps, j'ajouterais :
- Système de classement ELO
- Chat pendant les parties
- Replay des parties terminées
- Tournois
- Analyse des coups avec suggestions
- Mode spectateur

Problèmes connus

- Pas de validation d'échec/mat (juste les mouvements de base)
- Pas de gestion du roque ou de la prise en passant
- Interface mobile perfectible
- Pas de système de reconnexion automatique robuste

Tests

Pour tester rapidement, tu peux créer deux comptes et ouvrir deux onglets. Les comptes de test (mot de passe "secret") : alice, bob, charlie, diana.

---

