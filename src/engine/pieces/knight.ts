import type { IPiece } from "../interfaces";
import type { PlayerSide, Position } from "../types";
import { BasePiece } from "./base";

export class Knight extends BasePiece implements IPiece {
	constructor(side: PlayerSide, position: Position) {
		super("KNIGHT", side, position);
	}

	getMovePaths(): Array<Generator<Position, void, unknown>> {
		const steps: Position[] = [
			{ row: 2, col: 1 },
			{ row: 2, col: -1 },
			{ row: -2, col: 1 },
			{ row: -2, col: -1 },
			{ row: 1, col: 2 },
			{ row: 1, col: -2 },
			{ row: -1, col: 2 },
			{ row: -1, col: -2 },
		];

		return steps.map((step) => {
			const self = this;
			return (function* () {
				yield {
					row: self.position.row + step.row,
					col: self.position.col + step.col,
				};
			})();
		});
	}
}
