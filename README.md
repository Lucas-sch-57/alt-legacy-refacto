# alt-legacy-refacto

Refactoring d'un système de génération de rapports de commandes e-commerce en Node.js/TypeScript.

---

## Installation

### Prérequis

- Node.js >= 18
- npm >= 9

### Commandes

```bash
git clone https://github.com/lucas-sch-57/alt-legacy-refacto
cd alt-legacy-refacto
npm install
```

---

## Exécution

### Exécuter le code legacy

```bash
npm run legacy
```

### Exécuter le code refactoré

```bash
npm run refactor
```

### Lancer les tests

```bash
npm test
```

### Générer la référence du golden master

À exécuter une seule fois, avant les tests :

```bash
npm run generate:output
```

### Comparer les sorties manuellement

```bash
diff <(npm run legacy --silent) <(npm run refactor --silent)
```

---

## Choix de Refactoring

### Problèmes Identifiés dans le Legacy

1. **Fonction monolithique** : l'intégralité de la logique était dans une seule fonction `run()` de ~250 lignes.
   - Impact : impossible à tester unitairement, difficile à maintenir et à faire évoluer.

2. **Parsing CSV dupliqué** : le parsing des fichiers CSV était répété 4 fois avec de légères variations à chaque fois.
   - Impact : toute modification du parsing devait être faite à 4 endroits.

3. **Magic numbers** : des valeurs numériques sans nom étaient éparpillées dans le code (`0.03`, `0.05`, `1.1`, `0.85`...).
   - Impact : impossible de comprendre leur signification sans lire le contexte complet.

4. **Règles métier cachées** : des règles importantes étaient dans le code sans nom explicite.
   - Impact : comportement incompréhensible à première vue et non documenté

5. **Gestion d'erreurs silencieuse** : plusieurs `try/catch` vides avalaient les erreurs sans log ni traitement.
   - Impact : débogage impossible en cas de problème sur les données d'entrée.

---

### Solutions Apportées

1. **Séparation des responsabilités** : le code est découpé en modules, avec un rôle unique chacun.
   - Justification : respecte le principe de responsabilité unique, chaque module est modifiable indépendamment.

2. **Parsing CSV générique** : une seule fonction `parseCsv(content, mapper)` avec un système de mapper typé par entité.
   - Justification : élimine les 4 duplications

3. **Constantes nommées** : tous les magic numbers sont centralisés dans `constants.ts` avec des noms explicites.
   - Justification : le code se comprend sans commentaire, les valeurs sont modifiables en un seul endroit.

4. **Fonctions de calcul pures** : chaque calcul est isolé dans une fonction.
   - Justification : testables unitairement, réutilisables.

5. **Types et interfaces** : chaque entité du domaine est typée (`Customer`, `Product`, `Order`, `ShippingZone`, `Promotion`).
   - Justification : On peut détecter les erreurs avant l'execution.

---

### Architecture Choisie

```
src/
├── constants/
│   └── constants.ts      # Toutes les constantes nommées du domaine
├── types/
│   ├── customer.ts       # Interfaces Customer et CustomerTotal
│   ├── product.ts        # Interface Product
│   ├── order.ts          # Interface Order
│   ├── shipping.ts       # Interface ShippingZone
│   ├── promotion.ts      # Interface Promotion
│   └── formatter.ts      # Interfaces FormatterData et ReportSummary
├── parsers.ts            # Parsing CSV générique
├── dataLoader.ts         # Lecture des fichiers CSV
├── calculators.ts        # Fonctions pures de calcul métier
├── formatter.ts          # Mise en forme du rapport texte
└── index.ts              # Orchestration et point d'entrée
```

---

### Exemples Concrets

**Exemple 1 : Parsing CSV générique**

- Problème : 4 blocs de parsing quasi-identiques avec des variables légèrement différentes
- Solution : une fonction `parseCsv<T>(content, mapper)` générique, un mapper par entité dans `dataLoader.ts`

**Exemple 2 : Règles métier nommées**

- Problème : `if (hour < 10) morningBonus = lineTotal * 0.03` — sans contexte, incompréhensible
- Solution : `if (hour < MORNING_BONUS_HOUR) morningBonus = lineTotal * MORNING_BONUS_RATE`

**Exemple 3 : I/O isolés**

- Problème : `fs.readFileSync` appelé au milieu des calculs
- Solution : tous les appels I/O sont dans `dataLoader.ts`, les calculators reçoivent des données en paramètre

---

## Bugs Connus du Legacy (Préservés Intentionnellement)

Le test golden master impose de conserver le comportement exact du legacy, **bugs inclus** :

1. **Paliers de remise volume** : utilise des `if` au lieu de `else if` — les paliers s'écrasent les uns les autres. Un client avec 600€ de subtotal obtient 15% et non 5% ou 10%.

2. **Remise fixe multipliée par la quantité** : une promo `FIXED` de 10€ sur une commande de 3 articles déduit 30€ au lieu de 10€.

3. **Conversion devise sur la taxe uniquement** : le taux de change est appliqué dans le calcul du total global mais la ligne `Tax` l'applique une seconde fois dans le formatage.

---

## Limites et Améliorations Futures

### Ce qui n'a pas été fait (par manque de temps)

- [ ] Tests d'intégration avec des jeux de données variés
- [ ] Couverture complète des tests unitaires
- [ ] Validation des données d'entrée

### Compromis Assumés

- **Un seul fichier `calculators.ts`** : aurait pu être découpé en `discountCalculator.ts`, `taxCalculator.ts` etc. Pour la taille actuelle du projet, un fichier unique avec des sections commentées est suffisant.

### Pistes d'Amélioration Future

- Remplacer le parsing CSV maison par une bibliothèque (ex: `papaparse`)
- Ajouter une validation des données d'entrée avec un schéma (ex: `zod`)
- Corriger les bugs documentés dans une version `v2` une fois le golden master mis à jour
