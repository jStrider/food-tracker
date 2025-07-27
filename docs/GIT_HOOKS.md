# Git Hooks Configuration

Ce projet utilise Husky pour gérer les hooks Git et lint-staged pour optimiser les vérifications pre-commit.

## Pre-commit Hook

Le hook pre-commit exécute automatiquement :
- Les tests unitaires sur les fichiers modifiés
- Le linting avec auto-fix sur les fichiers modifiés
- Docker Compose build (TOUJOURS) pour garantir que l'application compile correctement

### Comportement

Lorsque vous faites un commit, le hook :
1. Identifie les fichiers modifiés
2. Exécute le linter avec auto-fix
3. Lance les tests associés aux fichiers modifiés
4. Vérifie que Docker est en cours d'exécution (OBLIGATOIRE)
5. Lance TOUJOURS Docker Compose build pour vérifier que l'application compile
6. Bloque le commit si des tests échouent, si le linting échoue, ou si le build Docker échoue

### Désactiver temporairement

Si vous devez absolument faire un commit sans passer par les hooks (non recommandé) :
```bash
git commit --no-verify -m "votre message"
```

### Configuration

- **Husky** : Les hooks sont dans le dossier `.husky/`
- **lint-staged** : La configuration est dans `.lintstagedrc.json`

### Troubleshooting

Si les hooks ne s'exécutent pas :
```bash
npx husky
```

Pour réinstaller les hooks :
```bash
rm -rf .husky && npx husky init
```

Si Docker n'est pas lancé :
- Le hook affichera une ERREUR et bloquera le commit
- Docker DOIT être lancé pour pouvoir commiter
- Lancez Docker Desktop avant de committer

### Important

Le Docker Compose build est maintenant OBLIGATOIRE à chaque commit pour garantir que :
- L'application compile correctement pour tous les développeurs
- Les problèmes de build sont détectés immédiatement
- La cohérence du projet est maintenue