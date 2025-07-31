# 🧠 CLAUDE.md — FoodTracker Development Guide (Claude Code + SPARC + Swarm)

## 🧭 GOLDEN RULES

1. 🧵 **ONE message, MANY tasks** — batch all instructions by type.
2. 🧠 **Dedicated agents per role** — aucun agent générique.
3. ⚙️ **Claude Code exécute. MCP coordonne.**
4. 🪢 **Zéro séquentialité. Utiliser fork/join.**
5. 🧼 **AUCUNE trace AI/LLM dans code ou doc.**

---

## 🚨 MANDATORY PR WORKFLOW — MUST FOLLOW FOR EVERY PR

### ⚡ Quick Validation (ALWAYS RUN FIRST)
```bash
./scripts/pr-validate.sh
```
This script MUST pass before ANY pull request. No exceptions.

### 📋 PR Checklist Enforcement
The following items MUST be checked (with [x]) in EVERY PR description:
- [ ] 🏃 I have run `./scripts/pr-validate.sh` and all checks pass
- [ ] ✅ Unit tests pass (`npm run test`)
- [ ] ✅ TypeScript compilation (`npm run typecheck`)
- [ ] 🔍 I have performed a self-review of my code

GitHub Actions will BLOCK the PR if these are not checked.

### 🔒 Validation Steps
1. **ALWAYS** run `./scripts/pr-validate.sh` first
2. **ALWAYS** fix any errors before committing
3. **ALWAYS** update PR template checkboxes
4. **ALWAYS** wait for CI checks to pass

### ❌ PR Will Be AUTO-REJECTED If:
- Validation script not run
- TypeScript errors exist
- Tests are failing
- Required checkboxes not marked
- CI checks fail

See `/docs/PR_TEST_WORKFLOW.md` for complete workflow details.

---

## 🚀 EXECUTION MODEL — PARALLEL PAR DÉFAUT

### ✅ Obligations de coordination

- [x] Spawner tous les agents **dès le début**
- [x] Grouper toutes les écritures avec `MultiEdit`
- [x] Grouper tous les todos avec `TodoWrite`
- [x] Grouper les commandes shell dans un bloc `Bash`
- [x] Activer les hooks sur chaque tâche (pre/edit/post)

> ❗ Si l'exécution reste séquentielle : forcer `swarm_init`, `agent_spawn` et `task_orchestrate`.

---

## 🧬 CONTEXTE DU PROJET

- **Backend** : ✅ Terminé (NestJS + OpenFoodFacts API + MCP Server)
- **Frontend** : ⏳ En cours (React + Tailwind + Calendar Views)

> Toute la suite repose sur des agents spécialisés : `frontend_ui`, `calendar_arch`, `nutrition_logic`, `qa_automation`, `sparc-coord`

---

## 🛠️ GESTION DES TÂCHES

- ✅ `/TODO.md` = source unique de vérité
- 🔄 Toute tâche, idée, bug, dette technique → `TODO.md`
- ✅ Les écritures dans `TODO.md` doivent être batchées
- 🧠 Utiliser des clés mémoire : `swarm/{agent}/{task}`

---

## 🧼 COMMITS & PR

- ❌ Aucune mention de Claude, AI ou LLM
- ✅ Commits formatés : `<component>: <action>` (ex: `calendar: add month view`)
- ⛔ Jamais de commits directs sur `main`
- ✅ Auto-merge uniquement pour : doc, README, CI, infra

---

## 👥 AGENTS SPÉCIALISÉS UNIQUEMENT

| Agent              | Rôle technique                          |
|--------------------|------------------------------------------|
| `calendar_arch`    | Architecture des vues React              |
| `frontend_ui`      | Composants Tailwind                      |
| `nutrition_logic`  | Calculs nutritionnels                    |
| `qa_automation`    | Tests unitaires / intégration / e2e      |
| `sparc-coord`      | Coordination méthodologie SPARC          |
| `swarm-coordinator`| Gestion du graphe d'exécution            |

---

## 🔄 PROTOCOLE SWARM

### Initialisation
```json
swarm_init {
  "topology": "hierarchical",
  "maxAgents": 6,
  "strategy": "parallel"
}
```

### Spawn des agents
```json
agent_spawn { "type": "calendar_arch", "name": "ViewPlanner" }
agent_spawn { "type": "frontend_ui", "name": "TailwindBuilder" }
agent_spawn { "type": "nutrition_logic", "name": "MacroLogic" }
agent_spawn { "type": "qa_automation", "name": "TestMaster" }
agent_spawn { "type": "sparc-coord", "name": "WorkflowLead" }
```

### Hooks obligatoires
```
pre-task:        description du plan
post-edit:       avec clé mémoire
notification:    décision ou statut
post-task:       analyse de performance
```

---

## 📊 MONITORING SWARM

```
🐝 SWARM STATUS
├── Topologie: hierarchical
├── Agents actifs: 5/6
├── Mode d'exécution: parallel
├── Tâches totales: 12 (✔ 4 done / 🔄 3 actives / ⭕ 5 à faire)
└── Mémoire: 12/12 slots utilisés
```

---

## 🧠 BONNES PRATIQUES MÉMOIRE / PERF

- Clés mémoire déterministes : `swarm-{id}/agent-{name}/{task-step}`
- Stockage après `post-edit`, récupération via `memory_search`
- Déclenchement régulier de `benchmark_run` pour détecter les goulets

---

## ⚠️ PROBLÈMES COURANTS

| Problème                     | Solution                                            |
|-----------------------------|-----------------------------------------------------|
| Agents lancés en série      | Forcer `task_orchestrate` avec `strategy: parallel` |
| Doublons ou blocage         | Vérifier bon usage des hooks                        |
| Perte de contexte           | Écrire dans `memory_usage`, relire via `memory_search` |
| Agents inactifs             | Vérifier `maxAgents` + priorisation                 |

---

## 🏗️ COMMANDES DE DÉVELOPPEMENT

```bash
# ALWAYS RUN BEFORE PR
./scripts/pr-validate.sh

npm run dev         # Serveur frontend dev
npm run test        # Exécution des tests
npm run lint        # Vérification du code
npm run typecheck   # Validation TypeScript
```

---

## ✅ CHECKLIST AVANT CHAQUE SWARM

- [ ] Tâches batchées par type
- [ ] Agents nommés et typés
- [ ] Hooks activés sur chaque étape
- [ ] `swarm_status` consulté régulièrement
- [ ] Utilisation mémoire synchronisée

---

## 🔒 WORKFLOW PR AUTOMATISÉ - ENFORCEMENT 100%

### Mécanismes de contrôle en place:

1. **Git Pre-commit Hook** (`.git/hooks/pre-commit`)
   - ✅ Bloque commits directs sur main/master
   - ✅ Exécute `./scripts/pr-validate.sh` automatiquement
   - ✅ Impossible de commit si validation échoue

2. **GitHub Actions** (`.github/workflows/pr-validation-enforce.yml`)
   - ✅ Vérifie checklist obligatoire dans PR
   - ✅ Exécute validation automatique
   - ✅ Bloque merge si échec

3. **Protection des branches**
   - ✅ main/master protégées
   - ✅ PR obligatoire avec validation
   - ✅ Auto-merge désactivé sauf exceptions

### Commandes essentielles:
```bash
# Validation manuelle (toujours avant PR)
./scripts/pr-validate.sh

# Réinstaller le hook si nécessaire
chmod +x .git/hooks/pre-commit

# Urgence seulement (À ÉVITER!)
git commit --no-verify -m "hotfix: critical issue"
```

### Garantie 100%:
- Hook local = validation avant commit
- CI/CD = validation avant merge
- Protection branch = bloque push direct

---

## 📚 RÉFÉRENCES

- `/TODO.md` = fichier de tâches unique
- `/api/docs` = Swagger API backend
- `/docs/PR_TEST_WORKFLOW.md` = WORKFLOW OBLIGATOIRE POUR PR
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.