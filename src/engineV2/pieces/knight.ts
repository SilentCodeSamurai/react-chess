import type { IPiece } from "../interfaces";
import type { PlayerSide, Position } from "../types";
import { BasePiece } from "./base";

export class Knight extends BasePiece implements IPiece {
	constructor(side: PlayerSide, position: Position) {
		super("KNIGHT", side, position);
	}

	getMovePaths(): Array<Generator<Position, void, unknown>> {
		const steps = [
			{ x: 2, y: 1 },
			{ x: 2, y: -1 },
			{ x: -2, y: 1 },
			{ x: -2, y: -1 },
			{ x: 1, y: 2 },
			{ x: 1, y: -2 },
			{ x: -1, y: 2 },
			{ x: -1, y: -2 },
		];

		return steps.map((step) => {
			const self = this;
			return (function* () {
				yield {
					x: self.position.x + step.x,
					y: self.position.y + step.y,
				};
			})();
		});
	}
}
