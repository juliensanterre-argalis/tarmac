# Site catalogue TARMAC Aerosave Formation

Site du centre de formation TARMAC Aerosave : catalogue des formations, calendrier des sessions, pages de présentation et formulaires de devis / préinscription.

- **Production** : https://training.tarmacaerosave.aero
- **Dépôt** : `juliensanterre-argalis/tarmac` (branche `main`)
- **Hébergement** : Clever Cloud, application PHP 8.3
- **Données** : exports du logiciel Argalis (formations, sessions, organisme)

Le site est un SPA en JavaScript vanilla. Il n'y a ni build, ni bundler, ni `npm` : les fichiers du dépôt sont servis tels quels. Le seul code serveur est `send-email.php`, qui envoie les emails des formulaires.

---

## Sommaire

1. [Structure du dépôt](#structure-du-dépôt)
2. [Déploiement (Clever Cloud)](#déploiement-clever-cloud)
3. [Données du catalogue (JSON)](#données-du-catalogue-json)
4. [Règles Apache (.htaccess)](#règles-apache-htaccess)
5. [Fonctionnement du front (script.js)](#fonctionnement-du-front-scriptjs)
6. [Pages de contenu et menu (local.json)](#pages-de-contenu-et-menu-localjson)
7. [Formulaires et emails (Mailgun)](#formulaires-et-emails-mailgun)
8. [SEO](#seo)
9. [Tester en local](#tester-en-local)
10. [Points d'attention connus](#points-dattention-connus)

---

## Structure du dépôt

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Unique page HTML du SPA. Contient `<base href="/">`, la config Tailwind et les conteneurs des vues. |
| `script.js` | Toute la logique du site : chargement des données, routing, rendu du catalogue, du calendrier, des fiches et des formulaires. Chargé avec `?v=2` : incrémenter ce numéro pour forcer les navigateurs à recharger le fichier. |
| `filters-functions.js`, `range-slider.js` | Filtres du catalogue (prix, durée…) et curseurs. |
| `fictive-data.js` | Formations et sessions fictives, affichées quand aucune donnée réelle n'est disponible (voir [Modes d'affichage](#modes-daffichage)). |
| `style.css` | Styles complémentaires à Tailwind. |
| `organism.json` | Identité de l'organisme (nom, logo, couleur, contacts). **Repli**, voir [Données](#données-du-catalogue-json). |
| `export_formation.json` | Export des formations Argalis. **Repli**. |
| `export_session.json` | Export des sessions Argalis. **Repli** (actuellement vide : `[ ]`). |
| `local.json` | Configuration propre au client : page d'accueil personnalisée et pages de contenu du menu. |
| `custom-home.html`, `le-groupe.html`, `centre-formation.html`, `notre-expertise.html`, `nous-contacter.html` | Fragments HTML des pages de contenu, injectés dans le SPA (ce ne sont pas des pages complètes). |
| `send-email.php` | Endpoint des formulaires : envoi via l'API Mailgun. |
| `mailgun-templates/` | Templates d'emails à copier dans Mailgun (voir son [README](mailgun-templates/README.md)). |
| `Assets/`, `Documents/` | Images, logos, PDF (CGV, certificats Qualiopi et Part 147, plan d'accès, welcome kit…). |
| `sitemap.xml`, `robots.txt`, `llms.txt` | SEO et description du site pour les LLM. |
| `.htaccess` | Réécritures Apache : données, routing SPA, cache, CORS. |
| `clevercloud/php.json` | Config Clever Cloud (`webroot: "/"`). |
| `composer.json` | Uniquement pour déclarer la version de PHP (8.3) et les extensions (`curl`, `json`, `mbstring`) à Clever Cloud. Aucune dépendance. |

---

## Déploiement (Clever Cloud)

- **Déploiement automatique à chaque push sur `main`.** Il n'y a pas de CI GitHub : l'ancien workflow SFTP a été supprimé.
- La racine web est la racine du dépôt (`clevercloud/php.json` → `"webroot": "/"`).
- Version de PHP : fixée par `composer.json` (`config.platform.php = 8.3`).

### Variables d'environnement (console Clever Cloud)

| Variable | Rôle |
|---|---|
| `CC_FS_BUCKET` | Monte le FS Bucket des exports sur `/data` (format `/data:<host-du-bucket>`). |
| `MAILGUN_API_KEY` | Clé API Mailgun utilisée par `send-email.php`. Sans elle, aucun email ne part. |
| `MAILGUN_DOMAIN` | Domaine d'envoi Mailgun (défaut : `argalis.fr`). |

> ⚠️ Ne pas créer de fichier `clevercloud/buckets.json` : il remplacerait la configuration de `CC_FS_BUCKET`.

---

## Données du catalogue (JSON)

### Circuit de mise à jour

```
Argalis ──(cron nocturne, FTP)──▶ FS Bucket Clever Cloud ──(CC_FS_BUCKET)──▶ /data dans l'app
```

Chaque nuit, un cron dépose `export_formation.json` et `export_session.json` dans le sous-dossier `web/` du FS Bucket, monté dans l'application sur `/data`. `organism.json` reste à la racine du bucket.

### Mécanisme de service avec repli

Le JavaScript demande toujours `/<nom>.json` à la racine. Le `.htaccess` décide ensuite quel fichier servir :

1. pour `export_formation.json` et `export_session.json` : si `/data/web/<nom>.json` existe, c'est lui qui est servi ;
2. sinon, si `/data/<nom>.json` existe (ancien emplacement, et emplacement d'`organism.json`), c'est lui qui est servi ;
3. sinon, c'est le fichier de la racine du dépôt qui est servi (**repli**).

Conséquences :

- **Ne jamais supprimer les 3 JSON de la racine du dépôt.** Ils servent de secours si le bucket est absent, démonté ou vide.
- **Ne jamais créer de dossier `data/` dans le dépôt**, même vide : c'est le point de montage du bucket. Il est dans le `.gitignore`.
- Aucune modification du JS n'est nécessaire pour changer la source des données.

### Vérifier en production

```bash
# Doit renvoyer le contenu du bucket (ou celui du dépôt si le bucket est absent)
curl -s https://training.tarmacaerosave.aero/organism.json

# Doit renvoyer 403 : accès direct au bucket interdit
curl -sI https://training.tarmacaerosave.aero/data/organism.json

# Doit contenir "Cache-Control: no-cache, must-revalidate"
curl -sI https://training.tarmacaerosave.aero/export_formation.json
```

Pour savoir quelle source est servie, comparer le contenu avec la version du dépôt, ou déposer un fichier reconnaissable dans le bucket.

### Règles de publication appliquées par le front

Les exports contiennent tout ; c'est `script.js` qui filtre ce qui s'affiche.

**Formations** (`mapAndCleanData`) : affichées seulement si `actif === true` **et** `publication_site_web === true`.

**Sessions** (`filterAndMapSessions`) : affichées seulement si toutes ces conditions sont réunies :
- `statut` vaut `PRÉVISIONNEL` ou `CONFIRMÉ` (avec accents) ;
- `publication_session_site_web === true` ;
- `j1` (date de début) est aujourd'hui ou plus tard ;
- la session est rattachée à une formation affichée, par `code_produit` = `reference` de la formation, ou à défaut par `libelleproduit` = titre de la formation (sans tenir compte de la casse).

Le nombre de places n'est affiché que si `publication_places_site_web === true`.

**Tarifs masqués (demande client, 24/09/2026)** : `mapAndCleanData` vide les prix (`prix_apprenant`, `prix_groupe`), donc « Nous contacter » s'affiche sur les tuiles, les fiches formation et les sessions. Le filtre « Budget » du catalogue a été retiré. Pour réafficher les tarifs, remettre `cleanValue(formation.prix_apprenant)` et `cleanValue(formation.prix_groupe)`, puis restaurer le filtre (voir l'historique Git). Les prix restent présents dans `export_formation.json`, qui est public.

Les valeurs `null`, `"null"` et `"NULL"` sont traitées comme vides. Dans les textes, `objectif_formation` est découpé sur les retours à la ligne, `prerequis` et `controle_connaissance` sur le caractère `|`.

### organism.json

```json
{
  "nomOrganisme": "TARMAC AEROSAVE",
  "logoUrl": "https://…/logo.png",
  "couleurPrincipale": "#002857",
  "telephone": "…",
  "email": "…",
  "emailDestination": "…",
  "adresse": "…",
  "moduladmin": true
}
```

- `couleurPrincipale` : couleur du thème, injectée dans la variable CSS `--primary`.
- `emailDestination` : destinataire des demandes de devis et de préinscription.
- `moduladmin` : `false` active le mode démo (voir ci-dessous). **Doit rester `true` en production.**

### Modes d'affichage

| `moduladmin` | Formations réelles | Sessions réelles | Résultat |
|---|---|---|---|
| `true` | oui | peu importe | Normal : données réelles. |
| `true` | non | – | Données **fictives** (`fictive-data.js`). |
| `false` | oui | oui | Démo : 1 formation et 1 session réelles, tirées au hasard. |
| `false` | sinon | | Démo avec données fictives. |

Si le catalogue affiche soudain des formations inconnues, il faut d'abord vérifier que `export_formation.json` n'est pas vide ou invalide et que `moduladmin` vaut `true`.

---

## Règles Apache (.htaccess)

Les règles sont évaluées dans cet ordre :

1. **Blocage de `/data/`** : toute requête directe vers `/data…` renvoie 403. La condition `%{ENV:REDIRECT_STATUS} ^$` laisse passer la réécriture interne des JSON. Elle ne peut pas être contournée par une URL encodée (`/%64ata/…`) ou un double slash (`//data/…`), contrairement à une condition sur `%{THE_REQUEST}`.
2. **Blocage des fichiers `.md`** : `README.md` et les autres fichiers Markdown du dépôt renvoient 403, pour ne pas exposer la documentation interne.
3. **Réécriture des JSON** vers `data/web/` (formations, sessions) puis `data/` (les 3 JSON) si le fichier y existe (voir plus haut).
4. **`/cgv`** : redirection 301 vers le PDF des CGV.
5. **Slash final** : redirection 301 de `/page/` vers `/page`.
6. **Routing SPA** : toute URL qui n'est ni un fichier ni un dossier existant et qui ne se termine pas par une extension d'asset (`js`, `css`, `json`, `php`, images, polices…) est servie par `index.html`.

Autres directives :

- `Options -Indexes` : pas de listing de dossiers.
- Compression gzip (`mod_deflate`) pour HTML, CSS, JS et JSON.
- Cache (`mod_expires`) : images 1 mois, CSS/JS 1 semaine.
- **JSON : `Cache-Control: no-cache, must-revalidate`**, pour que les navigateurs revalident à chaque visite et récupèrent l'export de la nuit. Cette directive prend le pas sur l'`Expires` à 1 jour de `mod_expires`.
- CORS ouvert sur `send-email.php`.

> Toute nouvelle règle générique (redirection, SPA…) doit être placée **après** les règles 1 et 2.

---

## Fonctionnement du front (script.js)

### Séquence de démarrage (`init`)

1. `checkLocalOverrides()` : si un fichier `script.local.js` existe, il remplace entièrement `script.js`. Charge aussi `local.json`.
2. `loadData()` : charge `organism.json`, `export_formation.json` et `export_session.json`, puis applique les filtres et le mode d'affichage.
3. Applique la couleur principale, crée les modales et les écouteurs des formulaires.
4. `injectOrganismInfo()` : construit le header et le footer (logo, contacts, menu).
5. `handleLocalConfig()` : page d'accueil personnalisée et pages de contenu (`local.json`).
6. `handleInitialRoute()` : affiche la vue correspondant à l'URL.

### Routes

| URL | Vue |
|---|---|
| `/` | Accueil (`custom-home.html`, via `local.json`) |
| `/catalogue` | Catalogue filtrable (secteur → famille → groupe, recherche, prix, durée) |
| `/calendrier` | Liste des sessions à venir, avec filtres |
| `/<slug>` | Page de contenu déclarée dans `local.json` |
| autre | Retour à l'accueil |

Les fiches formation et session s'ouvrent **sans changer d'URL** : elles ne sont ni partageables ni indexables individuellement.

La hiérarchie du menu catalogue vient des champs `produit_secteur`, `produit_famille` et `produit_groupe` des formations.

### APIs externes appelées depuis le navigateur

- `recherche-entreprises.api.gouv.fr` : autocomplétion entreprise et SIRET dans les formulaires.
- `geo.api.gouv.fr` : autocomplétion code postal / ville.
- `nominatim.openstreetmap.org` : géocodage du lieu de session pour la carte Leaflet.

Bibliothèques chargées par CDN dans `index.html` : Tailwind (CDN « Play »), Popper, Leaflet, Flatpickr.

---

## Pages de contenu et menu (local.json)

`local.json` déclare :

- `homePage` : fragment HTML servant de page d'accueil (`custom-home.html`) ;
- `pages` : entrées du menu, éventuellement imbriquées avec `children`. Pour chaque entrée :
  - `slug` : l'URL (`/notre-expertise`) ;
  - `label` : le texte affiché ;
  - `file` : le fragment HTML à charger ;
  - `menu: true` : affichage dans le header ;
  - `footer: true` : affichage dans le footer ;
  - `style: "button-outline"` : entrée affichée en bouton.

**Pour ajouter une page** :
1. créer le fragment HTML ;
2. l'ajouter dans `local.json` ;
3. ajouter l'URL dans `sitemap.xml` et `llms.txt`.

Les fragments sont récupérés avec `cache: 'no-store'`. Sur la page d'accueil personnalisée, les éléments `#dynamic-success-rate` et `#dynamic-success-date` sont remplis automatiquement à partir des taux de réussite des formations.

---

## Formulaires et emails (Mailgun)

Il y a quatre formulaires : devis et préinscription, chacun en version particulier ou entreprise.

1. Le front envoie en POST, en JSON, les champs du formulaire et un objet `organism` (nom, logo, couleur, `emailDestination`…) à `send-email.php`.
2. `send-email.php` envoie via l'API Mailgun (templates stockés **dans Mailgun**) :
   - une notification à `emailDestination` (templates `devis-particulier`, `devis-entreprise`, `preinscription-particulier`, `preinscription-entreprise`) ;
   - un accusé de réception au demandeur (template `confirmation-demande`).
3. L'expéditeur est `noreply@<MAILGUN_DOMAIN>`.

Pour modifier un email, il faut éditer le template **dans l'interface Mailgun**. Les fichiers de `mailgun-templates/` ne sont qu'une copie de référence. Le détail des variables est dans [mailgun-templates/README.md](mailgun-templates/README.md).

---

## SEO

- `sitemap.xml` : les 7 URL publiques (accueil, catalogue, calendrier, 4 pages de contenu).
- `robots.txt` : tout est autorisé, avec un lien vers le sitemap.
- `llms.txt` : description du centre et des formations pour les LLM. À tenir à jour si l'offre ou les certifications changent (Qualiopi depuis juin 2022, Part 147 FR.147.0050).
- Le nom de l'organisme s'écrit **TARMAC** en majuscules.

---

## Tester en local

Le site doit être servi par **Apache avec `AllowOverride All`** pour que le `.htaccess` s'applique (routing SPA, réécriture des JSON). Un simple `python -m http.server` affiche l'accueil, mais pas les routes profondes ni la logique `/data`.

Exemple minimal avec l'Apache fourni par macOS :

```apache
# httpd-test.conf (chemins à adapter)
ServerRoot "/tmp/tarmac-httpd"
Listen 127.0.0.1:8089
PidFile /tmp/tarmac-httpd/pid
ErrorLog /tmp/tarmac-httpd/error.log
LoadModule mpm_prefork_module /usr/libexec/apache2/mod_mpm_prefork.so
LoadModule authz_core_module  /usr/libexec/apache2/mod_authz_core.so
LoadModule unixd_module       /usr/libexec/apache2/mod_unixd.so
LoadModule mime_module        /usr/libexec/apache2/mod_mime.so
LoadModule dir_module         /usr/libexec/apache2/mod_dir.so
LoadModule rewrite_module     /usr/libexec/apache2/mod_rewrite.so
LoadModule headers_module     /usr/libexec/apache2/mod_headers.so
LoadModule expires_module     /usr/libexec/apache2/mod_expires.so
TypesConfig /private/etc/apache2/mime.types
DocumentRoot "/chemin/vers/tarmac-site"
<Directory "/chemin/vers/tarmac-site">
  AllowOverride All
  Require all granted
</Directory>
DirectoryIndex index.html
```

```bash
mkdir -p /tmp/tarmac-httpd
httpd -f /chemin/vers/httpd-test.conf -k start   # http://127.0.0.1:8089
httpd -f /chemin/vers/httpd-test.conf -k stop
```

Pour simuler le bucket, créer un `data/` **temporaire** dans une **copie** du site, jamais dans le dépôt. PHP n'étant pas chargé dans cette configuration, les formulaires ne fonctionnent pas en local.

---

## Points d'attention connus

Problèmes relevés lors de l'analyse du 24/09/2026, **non corrigés** à cette date. Deux autres ont été corrigés le même jour : l'URL d'envoi des formulaires (`/send-email.php`) et le domaine `www.` inexistant dans `sitemap.xml`, `robots.txt` et `llms.txt`.

1. **Destinataire fourni par le navigateur.** `send-email.php` prend `emailDestination` dans la requête JSON, sans contrôle. N'importe qui peut donc s'en servir pour faire envoyer des emails par Mailgun à une adresse arbitraire, avec en plus un CORS `*`. Il faudrait fixer le destinataire côté serveur (lire `organism.json` ou une variable d'environnement).
2. **Fichiers hérités d'un autre site** dans `Assets/` (logos, favicons et PDF « Loxam »). À trier, en vérifiant qu'aucun n'est encore référencé.
3. **Tailwind via `cdn.tailwindcss.com`** : ce CDN « Play » n'est pas prévu pour la production (compilation dans le navigateur, avertissement en console).
4. **Titre générique** : le `<title>` d'`index.html` est « Catalogue de Formations » sur toutes les pages. Il n'y a ni meta description ni canonical.
5. **Upload du bucket** : un fichier en cours d'écriture par le FTP peut être servi incomplet. Le cron devrait déposer sous un nom temporaire puis renommer.
