# Momo Tech — Boutique Free Fire (Diamants & Abonnements)

Site e-commerce complet pour la vente de diamants et produits Free Fire, avec
paiement réel via **PayDunya** (MTN Mobile Money, Moov Money, Celtiis au Bénin).

```
momo-tech/
├── backend/     API Node.js/Express + SQLite (prix, commandes, paiement, admin)
└── frontend/    Site public + espace admin, HTML/CSS/JS (pas de framework lourd)
```

---

## 1. Pourquoi cette architecture

- **Le prix n'est jamais décidé par le navigateur.** Chaque produit a un `id`
  fixe défini uniquement dans `backend/src/data/products.js`. Le frontend
  affiche ce catalogue mais quand une commande est créée, le serveur relit
  le prix depuis ce fichier à partir de l'`id` — jamais depuis ce que le
  client a envoyé.
- **Les clés PayDunya restent côté serveur.** Elles sont lues depuis des
  variables d'environnement (`backend/.env`, jamais commité) et ne sont
  jamais renvoyées au frontend.
- **Le paiement n'est confirmé que par PayDunya, jamais par le retour client.**
  Quand PayDunya notifie le serveur (IPN/callback), le serveur **rappelle
  PayDunya** pour vérifier le statut réel avant de marquer une commande
  payée. Revenir sur `/confirmation` ne suffit jamais à valider un paiement.

---

## 2. Installation

### Backend

```bash
cd backend
npm install
cp .env.example .env
# édite .env et renseigne tes vraies clés PayDunya (voir section 4)
node scripts/createAdmin.js   # crée le compte admin (interactif)
npm run dev                   # démarre l'API sur http://localhost:4000
```

### Frontend

Le frontend est du HTML/CSS/JS statique. Pendant le développement, sers-le
avec n'importe quel serveur statique, par exemple :

```bash
cd frontend
npx serve .
# ou : python3 -m http.server 5500
```

Dans `frontend/js/api.js`, adapte `API_BASE_URL` si ton backend ne tourne
pas sur `http://localhost:4000`.

En production, sers `frontend/` derrière ton reverse-proxy (Nginx, etc.) et
pointe `API_BASE_URL` vers l'URL publique de l'API.

---

## 3. Variables d'environnement (`backend/.env`)

Voir `backend/.env.example` pour la liste complète. Les plus importantes :

| Variable | Rôle |
|---|---|
| `PAYDUNYA_MASTER_KEY` | Clé maître PayDunya (jamais dans le code, jamais côté client) |
| `PAYDUNYA_PRIVATE_KEY` | Clé privée PayDunya |
| `PAYDUNYA_TOKEN` | Token de compte PayDunya |
| `PAYDUNYA_MODE` | `test` (Sandbox) ou `live` (Production) |
| `PAYDUNYA_CALLBACK_URL` | URL publique HTTPS que PayDunya appelle pour l'IPN (`.../api/payments/ipn`) |
| `PAYDUNYA_RETURN_URL` | Page où PayDunya redirige le client après paiement |
| `PAYDUNYA_CANCEL_URL` | Page où PayDunya redirige si le client annule |
| `JWT_SECRET` | Secret pour signer les tokens admin |
| `PORT` | Port de l'API (défaut `4000`) |

**Je ne mets aucune vraie clé dans le code.** `backend/.env.example` ne
contient que des noms de variables vides — tu renseignes tes vraies clés
uniquement dans `backend/.env` (local) ou dans les "Environment Variables"
de ton hébergeur (production), jamais dans un fichier commité sur Git.

---

## 4. PayDunya — Sandbox puis Production

1. Crée un compte sur [paydunya.com](https://paydunya.com), active le mode
   **Test/Sandbox** dans ton tableau de bord PayDunya et récupère les 3 clés
   de test (Master, Private, Token).
2. Mets-les dans `backend/.env` avec `PAYDUNYA_MODE=test`.
3. `PAYDUNYA_CALLBACK_URL` doit être une URL **publique** joignable par
   PayDunya (utilise [ngrok](https://ngrok.com) ou un tunnel équivalent en
   développement local, ex : `https://xxxx.ngrok.io/api/payments/ipn`).
4. Teste le parcours complet en Sandbox (voir section 6) avec les numéros
   de test fournis par PayDunya dans leur documentation.
5. Une fois validé, repasse dans PayDunya en mode **Live**, récupère les
   clés de production, remplace-les dans les variables d'environnement de
   ton hébergeur, et mets `PAYDUNYA_MODE=live`. Aucun changement de code
   n'est nécessaire — seul l'environnement change.

⚠️ Je n'ai pas d'accès réseau pour appeler l'API PayDunya en direct pendant
ce build : `backend/src/services/paydunyaService.js` est écrit d'après le
fonctionnement standard documenté de l'API "checkout-invoice" de PayDunya
(création de facture, puis confirmation du statut par token). **Vérifie les
noms exacts des champs/endpoints dans la documentation officielle PayDunya
au moment de l'intégration réelle**, au cas où l'API aurait changé — les
commentaires `// PAYDUNYA:` dans ce fichier indiquent les points à
recontrôler en priorité.

---

## 5. Espace admin

```bash
cd backend
node scripts/createAdmin.js
```

Le script demande un email et un mot de passe, les enregistre (mot de passe
haché avec bcrypt) dans la table `admins` de la base SQLite. Connecte-toi
ensuite sur `frontend/admin.html` avec ces identifiants.

L'admin peut : voir toutes les commandes, chercher par numéro de commande /
ID Free Fire / téléphone / email, filtrer par statut, voir les statistiques
(total, payées, en attente, CA, commandes du jour), et changer le **statut
de traitement** d'une commande (En attente → En traitement → Terminée,
Annulée, Échec) — mais jamais le statut réel du paiement, qui vient
uniquement de PayDunya.

---

## 6. Checklist de test avant mise en production

- [ ] Chaque produit affiché correspond exactement au tarif fixé (voir
      `backend/src/data/products.js`)
- [ ] Impossible de faire baisser un prix en modifiant la requête réseau
      côté client (le serveur ignore tout prix envoyé par le frontend)
- [ ] Commande créée sans ID Free Fire → rejetée (validation front + back)
- [ ] Facture PayDunya créée avec le bon montant pour chaque produit
- [ ] Redirection PayDunya fonctionnelle en Sandbox
- [ ] Callback/IPN reçu, revérifié auprès de PayDunya, commande mise à jour
- [ ] Statuts testés : paiement réussi, échoué, annulé, en attente
- [ ] Commande bien enregistrée en base avec tous les champs requis
- [ ] Page de confirmation affiche les bonnes infos après paiement réussi
- [ ] Connexion admin sécurisée, routes admin protégées par JWT
- [ ] Recherche et filtres admin fonctionnels
- [ ] Aucune clé API visible dans le code source ni le réseau frontend
- [ ] Site testé à 360px, 390px, 412px, tablette et desktop
- [ ] Animations fluides sur un smartphone milieu de gamme

---

## 7. Déploiement (résumé)

1. Héberge `backend/` sur un service Node (Render, Railway, VPS...), avec
   les variables d'environnement de la section 3 renseignées dans le
   tableau de bord de l'hébergeur.
2. Héberge `frontend/` en statique (Netlify, Vercel, Nginx...) et mets à
   jour `API_BASE_URL` dans `frontend/js/api.js` vers l'URL publique du
   backend.
3. Mets à jour `PAYDUNYA_CALLBACK_URL`, `PAYDUNYA_RETURN_URL` et
   `PAYDUNYA_CANCEL_URL` avec les vraies URLs publiques.
4. Passe `PAYDUNYA_MODE=live` avec les clés de production une fois les
   tests Sandbox validés.
