import { PieceType, PlayerSide, MoveType } from "./constants";
export type PieceType = (typeof PieceType)[keyof typeof PieceType];
export type PlayerSide = (typeof PlayerSide)[keyof typeof PlayerSide];
export type MoveType = (typeof MoveType)[keyof typeof MoveType];

type PieceStatus = "ALIVE" | "DEAD";

export type Position = {
	col: number; // 0-7 (A-H)
	row: number; // 0-7 (1-8)
};

export type Move = {
	pieceId: number;
	from: Position;
	to: Position;
	capturedPieceId?: number;
	castling?: {
		rook: {
			pieceId: number;
			from: Position;
			to: Position;
		};
		king: {
			pieceId: number;
			from: Position;
			to: Position;
		};
	};
	canPromote?: boolean;
};

export type MoveResult = Move & {
	promotion?: {
		fromType: PieceType;
		toType: PieceType;
	};
};

export type GameStatus = {
	check: {
		threatPieces: PieceState[];
		kingPiece: PieceState;
	} | null;
	mate: {
		threatPieces: PieceState[];
		kingPiece: PieceState;
	} | null;
	stalemate: {
		threatPieces: PieceState[];
		kingPiece: PieceState;
	} | null;
};

export type TurnResult = MoveResult & {
	side: PlayerSide;
	turnCount: number;
};

export type PieceState = {
	id: number;
	type: PieceType;
	side: PlayerSide;
	position: Position;
	status: PieceStatus;
};
