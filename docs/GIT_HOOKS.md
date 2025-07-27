# Git Hooks Configuration

Ce projet utilise Husky pour gérer les hooks Git et lint-staged pour optimiser les vérifications pre-commit.

## Pre-commit Hook

Le hook pre-commit exécute automatiquement :
- Les tests unitaires sur les fichiers modifiés
- Le linting avec auto-fix sur les fichiers modifiés
- Docker Compose build si des fichiers Docker ont été modifiés

### Comportement

Lorsque vous faites un commit, le hook :
1. Identifie les fichiers modifiés
2. Exécute le linter avec auto-fix
3. Lance les tests associés aux fichiers modifiés
4. Vérifie si Docker est en cours d'exécution
5. Si des fichiers Docker ont changé (Dockerfile, package.json, etc.), lance Docker Compose build
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
- Le hook affichera un warning mais ne bloquera pas le commit
- Il est recommandé de lancer Docker Desktop avant de committer

### Optimisation

Le hook Docker Compose build ne s'exécute que si l'un de ces fichiers a été modifié :
- Dockerfile
- package.json
- package-lock.json
- .dockerignore

Cela évite de reconstruire les images Docker à chaque commit.