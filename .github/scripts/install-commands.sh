#!/bin/bash

# Script d'installation des commandes personnalisées
echo "🔧 Installation des commandes personnalisées FoodTracker..."

# Ajouter au .bashrc ou .zshrc
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    echo "⚠️  Shell non détecté, ajoutez manuellement à votre fichier de config:"
    echo "source $(pwd)/.github/scripts/gh-custom-commands.sh"
    exit 1
fi

# Vérifier si déjà installé
if grep -q "gh-custom-commands.sh" "$SHELL_RC" 2>/dev/null; then
    echo "✅ Commandes déjà installées dans $SHELL_RC"
else
    echo "" >> "$SHELL_RC"
    echo "# FoodTracker custom gh commands" >> "$SHELL_RC"
    echo "if [ -f \"$(pwd)/.github/scripts/gh-custom-commands.sh\" ]; then" >> "$SHELL_RC"
    echo "    source \"$(pwd)/.github/scripts/gh-custom-commands.sh\"" >> "$SHELL_RC"
    echo "fi" >> "$SHELL_RC"
    
    echo "✅ Commandes ajoutées à $SHELL_RC"
    echo "🔄 Rechargez votre terminal ou tapez: source $SHELL_RC"
fi

# Charger immédiatement
source .github/scripts/gh-custom-commands.sh

echo ""
echo "🎉 Installation terminée !"
echo "📚 Tapez 'gh-help' pour voir toutes les commandes disponibles"