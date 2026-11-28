---
description: Crear un worktree local a partir del argumento
---

Analiza el argumento `$ARGUMENTS` (puede contener espacios) y deduce un nombre corto en kebab-case basado en el contexto que proporciona.

Ejecuta únicamente este comando con la herramienta de shell, usando como directorio de trabajo el actual del proyecto:

`git worktree add .worktrees/<nombre>`

No cambies de directorio, no ejecutes ningún otro comando, no modifiques archivos, no verifiques el resultado y no hagas nada adicional.
