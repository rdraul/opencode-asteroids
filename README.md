# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups de velocidad, triple disparo y escudo, y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: al destruir asteroides puede aparecer un ítem cian; al recogerlo duplica el desplazamiento de la nave durante 5 segundos (HUD y aura cian)
- Power-up **Escudo**: al destruir asteroides puede aparecer un ítem azul; al recogerlo protege la nave durante 6 segundos o hasta absorber un impacto de asteroide (lo que ocurra primero). El asteroide rebota y sigue en juego (HUD y aura azules)
- Power-up **Triple disparo**: un ítem magenta con la misma probabilidad de aparición; durante 5 segundos cada pulsación lanza 3 balas en abanico (HUD y aura magenta). Se puede combinar con Velocidad y Escudo
- **Estrella fugaz**: con un 35% de probabilidad aparece una por oleada; es ámbar, con estela y se mueve 3 veces más rápido. Desaparece sola a los 5 segundos, otorga el doble de puntos al destruirla y no se fragmenta
