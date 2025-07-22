import type { IPiece } from "../interfaces";
import type { PlayerSide, Position } from "../types";
import { BasePiece } from "./base";

export class Pawn extends BasePiece implements IPiece {
	constructor(side: PlayerSide, position: Position) {
		super("PAWN", side, position);
	}

	getMovePaths(): Array<Generator<Position, void, unknown>> {
		return [];
	}
}
