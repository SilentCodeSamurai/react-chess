import type {
	PieceType,
	Move,
	MoveResult,
	PieceState,
	PlayerSide,
	Position,
	GameState,
} from "./types";

export interface IPiece {
	readonly id: number;
	readonly type: PieceType;
	readonly side: PlayerSide;
	readonly position: Position;
	readonly state: "ALIVE" | "DEAD";
	readonly hasMoved: boolean;
	getMovePaths(): Array<Generator<Position, void, unknown>>;
	move(position: Position): void;
	kill(): void;
}

export interface IBoard {
	readonly pieces: IPiece[];
	readonly pieceMap: Map<number, IPiece>;
	readonly history: MoveResult[];
	getAvailableMoves(pieceId: number): Move[];
	movePiece(id: number, to: Position, promotionType?: PieceType): MoveResult;
	reset(): void;
}

export interface IGame {
	readonly board: PieceState[];
	readonly state: GameState;
	readonly currentTurn: PlayerSide;
	getAvailableMoves(pieceId: number): Move[];
	makeTurn(
		pieceId: number,
		to: Position,
		promotionType?: PieceType
	): MoveResult;
	undoTurn(): MoveResult;
}
