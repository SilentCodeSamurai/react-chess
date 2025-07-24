import type {
	PieceType,
	Move,
	MoveResult,
	PieceState,
	PlayerSide,
	Position,
	TurnResult,
	GameStatus,
} from "./types";

export interface IPiece extends PieceState {
	readonly hasMoved: boolean;
	getMovePaths(): Array<Generator<Position, void, unknown>>;
	move(position: Position): void;
	kill(): void;
}

export interface IBoard {
	readonly pieceStates: PieceState[];
	getPieceStateById(id: number): PieceState | null;
	getPieceStateAt(position: Position): PieceState | null;
	reset(): void;
}

export interface IGame extends IBoard {
	readonly currentTurn: PlayerSide;
	readonly history: MoveResult[];
	readonly algebraicHistory: string[];
	readonly turnCount: number;
	readonly status: GameStatus;
	getLegalMoves(pieceId: number): Move[];
	makeTurn(
		pieceId: number,
		to: Position,
		promotionType?: PieceType
	): TurnResult;
	reset(): void;
}
