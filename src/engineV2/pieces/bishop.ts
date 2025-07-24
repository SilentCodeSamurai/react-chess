import type { IPiece } from "../interfaces";
import type { PlayerSide, Position } from "../types";
import { BasePiece } from "./base";

export class Bishop extends BasePiece implements IPiece {
	constructor(side: PlayerSide, position: Position) {
		super("BISHOP", side, position);
	}

	getMovePaths(): Array<Generator<Position, void, unknown>> {
		const steps: Position[] = [
			{ row: 1, col: 1 },
			{ row: 1, col: -1 },
			{ row: -1, col: 1 },
			{ row: -1, col: -1 },
		];

		return steps.map((step) => {
			const self = this;
			return (function* () {
				let currentPosition = self.position;
				while (true) {
					currentPosition = {
						col: currentPosition.col + step.col,
						row: currentPosition.row + step.row,
					};
					yield currentPosition;
				}
			})();
		});
	}
}
