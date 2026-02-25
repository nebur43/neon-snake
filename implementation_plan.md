# Snake Game Implementation Plan

- [x] Create implementation plan <!-- id: 0 -->
- [x] Implement core Snake mechanics (exponential food, dynamic speed) <!-- id: 1 -->
- [x] Implement Special "Blue Food" mechanic <!-- id: 2 -->
- [x] Integrate Firebase for high score persistence <!-- id: 3 -->


## Goal Description
Build a modern, premium-style Snake game web application.
The game will feature smooth animations, a neon/dark aesthetic, and responsive design.

## User Review Required
> [!NOTE]
> No critical user review items at this stage. Standard game mechanics apply.

## Proposed Changes

### Project Structure
Root directory: `C:\workspaces\personal\SnakeGame3`

#### [NEW] [index.html](file:///C:/workspaces/personal/SnakeGame3/index.html)
- Main game container.
- Score display.
- Start/Restart overlay.
- [NEW] High Score leaderboard (Firebase).


#### [NEW] [style.css](file:///C:/workspaces/personal/SnakeGame3/style.css)
- Dark theme with neon accents (green snake, red food).
- Glow effects for a "cyberpunk" or "retro-arcade" feel.
- Responsive layout for the game board.

#### [MODIFY] [script.js](file:///C:/workspaces/personal/SnakeGame3/script.js)
- [NEW] Variable `currentSpeed` initialized to 100.
- [NEW] Array `foods` to store multiple food items.
- [MODIFY] `gameLoopStep` to use `currentSpeed`.
- [MODIFY] `update` to check collision with all foods.
- [MODIFY] `update` to decrease `currentSpeed` by 3% on eating.
- [MODIFY] `placeFood` to manage multiple foods.
- [MODIFY] `update` spawn logic: Start with 1 food. When eaten, spawn 2 new foods.
- [DONE] Blue Food mechanic (5% chance, removals, speed reduction, length growth).

### Firebase Integration
#### [MODIFY] [script.js](file:///C:/workspaces/personal/SnakeGame3/script.js)
- [NEW] Initialize Firebase app with configuration.
- [NEW] Function `saveScoreToFirebase(name, score)` to save high scores.
- [NEW] UI to prompt for name on game over.


## Verification Plan

### Automated Tests
- None planned.

### Manual Verification
- Verify game starts with 1 food item.
- Verify eating the first food spawns 2 new foods.
- Verify eating any food spawns 2 more (net increase of 1 food on screen per eat).
- Verify game speed noticeably increases after eating several food items.
