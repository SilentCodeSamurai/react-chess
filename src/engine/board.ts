import type { PlayerSide, PieceType, PieceState } from "./types";
import type { IBoard, IPiece } from "./interfaces";
import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";
import type { Position } from "./types";

export class Board implements IBoard {
	protected pieces: IPiece[];
	protected pieceMap: Map<number, IPiece>;
	constructor() {
		this.pieces = [];
		this.pieceMap = new Map();
		this.reset();
	}

	public get pieceStates(): PieceState[] {
		return this.pieces.map((piece) => ({
			id: piece.id,
			type: piece.type,
			side: piece.side,
			position: piece.position,
			status: piece.status,
		}));
	}

	public reset(): void {
		this.pieces = [
			new King("WHITE", { col: 4, row: 0 }),
			new King("BLACK", { col: 4, row: 7 }),
			new Queen("WHITE", { col: 3, row: 0 }),
			new Queen("BLACK", { col: 3, row: 7 }),
			new Rook("WHITE", { col: 0, row: 0 }),
			new Rook("BLACK", { col: 0, row: 7 }),
			new Rook("WHITE", { col: 7, row: 0 }),
			new Rook("BLACK", { col: 7, row: 7 }),
			new Knight("WHITE", { col: 1, row: 0 }),
			new Knight("BLACK", { col: 1, row: 7 }),
			new Knight("WHITE", { col: 6, row: 0 }),
			new Knight("BLACK", { col: 6, row: 7 }),
			new Bishop("WHITE", { col: 2, row: 0 }),
			new Bishop("BLACK", { col: 2, row: 7 }),
			new Bishop("WHITE", { col: 5, row: 0 }),
			new Bishop("BLACK", { col: 5, row: 7 }),
			...Array.from({ length: 8 }, (_, i) => new Pawn("WHITE", { col: i, row: 1 })),
			...Array.from({ length: 8 }, (_, i) => new Pawn("BLACK", { col: i, row: 6 })),
		];
		this.pieceMap.clear();
		this.pieces.forEach((piece) => {
			this.pieceMap.set(piece.id, piece);
		});
	}

	public getPieceStateById(id: number): PieceState | null {
		const piece = this.getPieceById(id);
		return piece
			? {
					id: piece.id,
					type: piece.type,
					side: piece.side,
					position: piece.position,
					status: piece.status,
			  }
			: null;
	}

	public getPieceStateAt(position: Position): PieceState | null {
		const piece = this.getPieceAt(position);
		return piece
			? {
					id: piece.id,
					type: piece.type,
					side: piece.side,
					position: piece.position,
					status: piece.status,
			  }
			: null;
	}

	protected getPiecesByTypeAndSide(type: PieceType, side: PlayerSide): IPiece[] {
		return this.pieces.filter((piece) => piece.type === type && piece.side === side);
	}

	protected getPieceById(id: number): IPiece {
		const piece = this.pieceMap.get(id);
		if (!piece) {
			throw new Error("Piece not found");
		}
		return piece;
	}

	protected getPieceAt(coordinates: Position): IPiece | null {
		return (
			this.pieces.find(
				(piece) =>
					piece.position.col === coordinates.col &&
					piece.position.row === coordinates.row &&
					piece.status === "ALIVE"
			) || null
		);
	}
}
