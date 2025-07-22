import { PieceType, PlayerSide, MoveType } from "./constants";
export type PieceType = (typeof PieceType)[keyof typeof PieceType];
export type PlayerSide = (typeof PlayerSide)[keyof typeof PlayerSide];
export type MoveType = (typeof MoveType)[keyof typeof MoveType];

export type Position = {
	x: number;
	y: number;
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

export type PieceState = {
	id: number;
	pieceType: PieceType;
	coordinates: Position;
};

export type BoardState = {
	check?: {
		side: PlayerSide;
		pieceId: number;
		from: Position;
		to: Position;
	};
	mate?: {
		side: PlayerSide;
		pieceId: number;
		from: Position;
		to: Position;
	};
	stalemate?: {
		side: PlayerSide;
		pieceId: number;
		from: Position;
		to: Position;
	};
};

export type GameState = {
	winner?: PlayerSide;
	board: BoardState;
};
