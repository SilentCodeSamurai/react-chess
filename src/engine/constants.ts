export const PlayerSide = {
	WHITE: "WHITE",
	BLACK: "BLACK",
} as const;

export const PieceType = {
	PAWN: "PAWN",
	ROOK: "ROOK",
	KNIGHT: "KNIGHT",
	BISHOP: "BISHOP",
	QUEEN: "QUEEN",
	KING: "KING",
} as const;

export const MoveType = {
	NORMAL: "NORMAL",
	CAPTURE: "CAPTURE",
	CASTLING: "CASTLING",
	PROMOTION: "PROMOTION",
} as const;
