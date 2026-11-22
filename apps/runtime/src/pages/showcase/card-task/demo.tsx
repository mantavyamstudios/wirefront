// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the board with a sample sprint. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { TaskBoard } from "./view";

export function CardTaskShowcasePage() {
  const board = fixtures.getBoard;
  return (
    <TaskBoard
      columns={board.columns}
      endsOn={board.endsOn}
      startsOn={board.startsOn}
      taskHref={(task) => `#${task.key}`}
      title={board.name}
    />
  );
}
