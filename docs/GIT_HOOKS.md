# Git Hooks Configuration

Ce projet utilise Husky pour gérer les hooks Git et lint-staged pour optimiser les vérifications pre-commit.

## Pre-commit Hook

Le hook pre-commit exécute automatiquement :
- Les tests unitaires sur les fichiers modifiés
- Le linting avec auto-fix sur les fichiers modifiés

### Comportement

Lorsque vous faites un commit, le hook :
1. Identifie les fichiers modifiés
2. Exécute le linter avec auto-fix
3. Lance les tests associés aux fichiers modifiés
4. Bloque le commit si des tests échouent ou si le linting échoue

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