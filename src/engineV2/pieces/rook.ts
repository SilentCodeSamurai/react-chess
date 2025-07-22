import type { IPiece } from "../interfaces";
import type { PlayerSide, Position } from "../types";
import { BasePiece } from "./base";

export class Rook extends BasePiece implements IPiece {
	constructor(side: PlayerSide, position: Position) {
		super("ROOK", side, position);
	}

	getMovePaths(): Array<Generator<Position, void, unknown>> {
		const steps = [
			{ x: 1, y: 0 },
			{ x: -1, y: 0 },
			{ x: 0, y: 1 },
			{ x: 0, y: -1 },
		];

		return steps.map((step) => {
			const self = this;
			return (function* () {
				let currentPosition = self.position;
				while (true) {
					currentPosition = {
						x: currentPosition.x + step.x,
						y: currentPosition.y + step.y,
					};
					yield currentPosition;
				}
			})();
		});
	}
}
