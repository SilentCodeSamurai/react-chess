import type { IPiece } from "../interfaces";
import type { PieceType } from "../types";
import type { PlayerSide, Position } from "../types";

export class BasePiece implements IPiece {
	private _id: number;
	private _type: PieceType;
	private _side: PlayerSide;
	private _position: Position;
	private _hasMoved: boolean;
	private _state: "ALIVE" | "DEAD";

	constructor(type: PieceType, side: PlayerSide, position: Position) {
		this._id = Math.floor(Math.random() * 1000000);
		this._type = type;
		this._side = side;
		this._position = position;
		this._hasMoved = false;
		this._state = "ALIVE";
	}

	public get id(): number {
		return this._id;
	}

	public get type(): PieceType {
		return this._type;
	}

	public get side(): PlayerSide {
		return this._side;
	}

	public get position(): Position {
		return this._position;
	}

	public get status(): "ALIVE" | "DEAD" {
		return this._state;
	}

	public get hasMoved(): boolean {
		return this._hasMoved;
	}

	public getMovePaths(): Array<Generator<Position, void, unknown>> {
		throw new Error("Not implemented");
	}

	public move(position: Position): void {
		this._position = position;
		this._hasMoved = true;
	}

	public kill(): void {
		this._state = "DEAD";
	}
}
