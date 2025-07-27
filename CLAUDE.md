# 🧠 CLAUDE.md — FoodTracker Dev Protocol (Claude Code + Swarm)

## 🧭 RÈGLES D’OR

1. **🧵 1 message = X tâches.** Jamais de séquences.
2. **🔁 Zéro séquentialité.** Utiliser `swarm_init` + `task_orchestrate`.
3. **⚙️ Claude Code exécute, MCP orchestre.**
4. **📦 Agents spécialisés obligatoires.** Aucun agent générique.
5. **🪬 Aucune trace d’IA dans code ou doc.**
6. **⚡ Justifier toute non-parallélisation.**

---

## 🚀 PARALLÉLISME PAR DÉFAUT

### Obligations
- [x] `agent_spawn` immédiat
- [x] `MultiEdit` pour toutes les écritures
- [x] `TodoWrite` pour toutes les tâches
- [x] `Bash` pour toutes les commandes shell
- [x] Hooks actifs : `pre/edit/post` (sinon rejeter)

> ❗ Toute séquence linéaire est un bug.

---

## 🧬 CONTEXTE PROJET

- **Backend** ✅ (NestJS + OpenFoodFacts + MCP)
- **Frontend** ⏳ (React + Tailwind + Views)

Agents déclarés :
- `calendar_arch`
- `frontend_ui`
- `nutrition_logic`
- `qa_automation`
- `sparc-coord`

---

## 🛠️ TÂCHES

- Source unique : `/TODO.md`
- Toute tâche → append dans `TODO.md` (via `TodoWrite`)
- Format clé : `swarm/{agent}/{task}`
- Écriture batchée obligatoire

---

## 🧼 COMMITS & PR

- Format : `<component>: <action>`
- Exemples : `calendar: fix nav bug`, `api: add /meals endpoint`
- Interdits :
  - Commits directs sur `main`
  - Mentions d’IA/Claude/LLM
- Auto-merge seul pour : doc / CI / infra

---

## 👥 AGENTS

| Agent              | Rôle                              |
|--------------------|------------------------------------|
| `calendar_arch`    | Vues calendaires (React)           |
| `frontend_ui`      | UI Tailwind                        |
| `nutrition_logic`  | Calculs macro                      |
| `qa_automation`    | Tests (unitaires / intégration)    |
| `sparc-coord`      | Orchestration SPARC                |
| `swarm-coordinator`| Topologie et flow                  |

---

## 🔄 PROTOCOLE SWARM

### Init
```json
swarm_init {
  "topology": "hierarchical",
  "maxAgents": 6,
  "strategy": "parallel"
}