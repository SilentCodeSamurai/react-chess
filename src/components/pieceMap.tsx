import type { PieceType } from "../engineV2/types";
import { Pawn } from "./pieces/pawn";
import { Rook } from "./pieces/rook";
import { Knight } from "./pieces/knight";
import { Bishop } from "./pieces/bishop";
import { Queen } from "./pieces/queen";
import { King } from "./pieces/king";
import type { PieceProps } from "./pieces/types";

export const PieceTypeComponentMap: Record<PieceType, React.ForwardRefExoticComponent<PieceProps & React.RefAttributes<any>>> = {
	PAWN: Pawn,
	ROOK: Rook,
	KNIGHT: Knight,
	BISHOP: Bishop,
	QUEEN: Queen,
	KING: King,
};
