#!/bin/bash

# Commandes personnalisées gh pour FoodTracker
# Utilisation: source .github/scripts/gh-custom-commands.sh

# 🐛 Workflow de correction de bug
gh-fix() {
    local issue_title="$1"
    local branch_name="$2"
    
    if [ -z "$issue_title" ] || [ -z "$branch_name" ]; then
        echo "Usage: gh-fix 'Titre du bug' 'nom-de-branche'"
        echo "Exemple: gh-fix 'Erreur 500 lors de l\'ajout d\'aliment' 'fix/add-food-error'"
        return 1
    fi
    
    echo "🐛 Création du workflow de correction de bug..."
    
    # 1. Créer l'issue GitHub
    echo "Création de l'issue..."
    local issue_url=$(gh issue create \
        --title "[BUG] $issue_title" \
        --label "bug,backend" \
        --body "## Description
Bug à investiguer et corriger.

## Étapes de reproduction
À détailler lors de l'investigation.

## Impact
À évaluer.

---
*Issue créée automatiquement via gh-fix*")
    
    echo "✅ Issue créée: $issue_url"
    
    # 2. Créer et changer de branche
    echo "Création de la branche $branch_name..."
    git checkout -b "$branch_name"
    
    # 3. Premier commit vide pour initialiser
    git commit --allow-empty -m "🐛 Start fixing: $issue_title

Issue: $issue_url
Branch: $branch_name

🤖 Generated with gh-fix command"
    
    # 4. Pousser la branche
    git push -u origin "$branch_name"
    
    echo "✅ Branche créée et poussée"
    echo "🔧 Vous pouvez maintenant travailler sur le fix"
    echo "📝 Quand terminé, utilisez: gh-finish-fix"
}

# ✨ Workflow de nouvelle fonctionnalité
gh-feature() {
    local feature_title="$1"
    local branch_name="$2"
    
    if [ -z "$feature_title" ] || [ -z "$branch_name" ]; then
        echo "Usage: gh-feature 'Titre de la fonctionnalité' 'nom-de-branche'"
        echo "Exemple: gh-feature 'Ajout graphique nutrition' 'feature/nutrition-charts'"
        return 1
    fi
    
    echo "✨ Création du workflow de nouvelle fonctionnalité..."
    
    # 1. Créer l'issue GitHub
    echo "Création de l'issue..."
    local issue_url=$(gh issue create \
        --title "[FEATURE] $feature_title" \
        --label "feature,enhancement" \
        --body "## Description
Nouvelle fonctionnalité à implémenter.

## Spécifications
À détailler.

## Critères d'acceptation
- [ ] Fonctionnalité implémentée
- [ ] Tests ajoutés
- [ ] Documentation mise à jour

---
*Issue créée automatiquement via gh-feature*")
    
    echo "✅ Issue créée: $issue_url"
    
    # 2. Créer et changer de branche
    echo "Création de la branche $branch_name..."
    git checkout -b "$branch_name"
    
    # 3. Premier commit vide pour initialiser
    git commit --allow-empty -m "✨ Start feature: $feature_title

Issue: $issue_url
Branch: $branch_name

🤖 Generated with gh-feature command"
    
    # 4. Pousser la branche
    git push -u origin "$branch_name"
    
    echo "✅ Branche créée et poussée"
    echo "🔧 Vous pouvez maintenant développer la fonctionnalité"
    echo "📝 Quand terminé, utilisez: gh-finish-feature"
}

# 🚀 Finaliser un fix/feature et créer la PR
gh-finish() {
    local pr_title="$1"
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "main" ]; then
        echo "❌ Vous ne pouvez pas finaliser depuis la branche main"
        return 1
    fi
    
    if [ -z "$pr_title" ]; then
        echo "Usage: gh-finish 'Titre de la PR'"
        echo "Exemple: gh-finish 'Fix: Correction erreur 500 lors de l\'ajout d\'aliment'"
        return 1
    fi
    
    echo "🚀 Finalisation et création de la PR..."
    
    # 1. Vérifier qu'il y a des commits
    local commits_count=$(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "0")
    if [ "$commits_count" -eq "0" ] || [ "$commits_count" -eq "1" ]; then
        echo "⚠️  Pas de commits significatifs détectés. Ajoutez vos changements d'abord."
        return 1
    fi
    
    # 2. Pousser les derniers changements
    echo "Poussée des derniers changements..."
    git push
    
    # 3. Créer la PR
    echo "Création de la Pull Request..."
    local pr_url=$(gh pr create \
        --title "$pr_title" \
        --body "## 📝 Description

Changements apportés dans cette PR.

## 🔧 Type de changement

- [x] Modification (préciser le type)

## 🧪 Tests

- [x] Tests ajoutés/mis à jour
- [x] Tests passent localement

## 📋 Checklist

- [x] Code suit les conventions
- [x] Auto-review effectuée
- [x] Documentation mise à jour si nécessaire

---
*PR créée automatiquement via gh-finish*" \
        --assignee "@me")
    
    echo "✅ Pull Request créée: $pr_url"
    echo "🔍 N'oubliez pas de demander une review !"
}

# 🔥 Hotfix rapide
gh-hotfix() {
    local hotfix_title="$1"
    local branch_name="hotfix/$(date +%Y%m%d-%H%M)-$(echo "$hotfix_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')"
    
    if [ -z "$hotfix_title" ]; then
        echo "Usage: gh-hotfix 'Description du hotfix'"
        echo "Exemple: gh-hotfix 'Fix critique API auth'"
        return 1
    fi
    
    echo "🔥 Création d'un hotfix critique..."
    
    # 1. Créer l'issue avec priorité haute
    echo "Création de l'issue hotfix..."
    local issue_url=$(gh issue create \
        --title "[HOTFIX] $hotfix_title" \
        --label "hotfix,bug" \
        --body "## 🚨 Hotfix Critique

**Description:** $hotfix_title

**Urgence:** Correction immédiate requise

## Impact
- [ ] Production
- [ ] Sécurité  
- [ ] Données

## Plan d'action
1. Investigation
2. Fix
3. Tests
4. Déploiement

---
*Hotfix créé automatiquement via gh-hotfix*")
    
    echo "✅ Issue hotfix créée: $issue_url"
    
    # 2. Créer la branche depuis main
    git checkout main
    git pull origin main
    git checkout -b "$branch_name"
    
    # 3. Commit initial
    git commit --allow-empty -m "🔥 HOTFIX: $hotfix_title

CRITICAL FIX REQUIRED

Issue: $issue_url
Branch: $branch_name

🤖 Generated with gh-hotfix command"
    
    # 4. Pousser
    git push -u origin "$branch_name"
    
    echo "✅ Branche hotfix créée: $branch_name"
    echo "🚨 Traitez ce hotfix en priorité !"
    echo "📝 Utilisez: gh-finish 'HOTFIX: $hotfix_title' quand terminé"
}

# 📊 Statut du projet
gh-status() {
    echo "📊 Statut du projet FoodTracker"
    echo "================================="
    
    # Branche actuelle
    local current_branch=$(git branch --show-current)
    echo "🌟 Branche actuelle: $current_branch"
    
    # Statut git
    echo ""
    echo "📋 Statut Git:"
    git status --short
    
    # Issues ouvertes
    echo ""
    echo "🐛 Issues ouvertes:"
    gh issue list --limit 5
    
    # PRs ouvertes
    echo ""
    echo "🔄 Pull Requests ouvertes:"
    gh pr list --limit 5
    
    # Derniers commits
    echo ""
    echo "📝 Derniers commits:"
    git log --oneline -5
}

# 📚 Aide pour les commandes
gh-help() {
    echo "🛠️  Commandes personnalisées FoodTracker"
    echo "========================================"
    echo ""
    echo "🐛 gh-fix 'titre' 'branche'      - Créer un workflow de correction de bug"
    echo "✨ gh-feature 'titre' 'branche'  - Créer un workflow de fonctionnalité"
    echo "🚀 gh-finish 'titre-pr'          - Finaliser et créer une PR"
    echo "🔥 gh-hotfix 'description'       - Créer un hotfix critique"
    echo "📊 gh-status                     - Afficher le statut du projet"
    echo "📚 gh-help                       - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  gh-fix 'Erreur 500 ajout aliment' 'fix/add-food-500'"
    echo "  gh-feature 'Graphique nutrition' 'feature/nutrition-chart'"
    echo "  gh-hotfix 'API auth cassée'"
    echo "  gh-finish 'Fix: Correction erreur 500 ajout aliment'"
}

echo "✅ Commandes personnalisées gh chargées !"
echo "📚 Tapez 'gh-help' pour voir la liste des commandes"