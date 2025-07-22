import type { PlayerSide, PieceType } from "./types";
import type { IBoard, IPiece } from "./interfaces";
import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";
import type { Move, MoveResult, Position } from "./types";

export class Board implements IBoard {
	private _pieces: IPiece[];
	private _pieceMap: Map<number, IPiece>;
	private _history: MoveResult[];

	constructor() {
		this._pieces = [];
		this._pieceMap = new Map();
		this._history = [];
		this.reset();
	}
	public get pieceMap(): Map<number, IPiece> {
		return this._pieceMap;
	}
	public get history(): MoveResult[] {
		return this._history;
	}
	public get pieces(): IPiece[] {
		return this._pieces;
	}
	public reset(): void {
		this._history = [];
		this._pieces = [
			new King("WHITE", { x: 4, y: 7 }),
			new King("BLACK", { x: 4, y: 0 }),
			new Queen("WHITE", { x: 3, y: 7 }),
			new Queen("BLACK", { x: 3, y: 0 }),
			new Rook("WHITE", { x: 0, y: 7 }),
			new Rook("BLACK", { x: 0, y: 0 }),
			new Rook("WHITE", { x: 7, y: 7 }),
			new Rook("BLACK", { x: 7, y: 0 }),
			new Knight("WHITE", { x: 1, y: 7 }),
			new Knight("BLACK", { x: 1, y: 0 }),
			new Knight("WHITE", { x: 6, y: 7 }),
			new Knight("BLACK", { x: 6, y: 0 }),
			new Bishop("WHITE", { x: 2, y: 7 }),
			new Bishop("BLACK", { x: 2, y: 0 }),
			new Bishop("WHITE", { x: 5, y: 7 }),
			new Bishop("BLACK", { x: 5, y: 0 }),
			...Array.from(
				{ length: 8 },
				(_, i) => new Pawn("WHITE", { x: i, y: 6 })
			),
			...Array.from(
				{ length: 8 },
				(_, i) => new Pawn("BLACK", { x: i, y: 1 })
			),
		];
		this._pieceMap.clear();
		this._pieces.forEach((piece) => {
			this._pieceMap.set(piece.id, piece);
		});
	}

	private getPiecesByTypeAndSide(
		type: PieceType,
		side: PlayerSide
	): IPiece[] {
		return this._pieces.filter(
			(piece) => piece.type === type && piece.side === side
		);
	}

	private getPieceById(id: number): IPiece {
		const piece = this._pieceMap.get(id);
		if (!piece) {
			throw new Error("Piece not found");
		}
		return piece;
	}

	private getPieceAt(coordinates: Position): IPiece | null {
		return (
			this._pieces.find(
				(piece) =>
					piece.position.x === coordinates.x &&
					piece.position.y === coordinates.y
			) || null
		);
	}

	private getSpecialMoves(piece: IPiece): Move[] {
		const moves: Move[] = [];
		switch (piece.type) {
			case "PAWN": {
				const direction = piece.side === "WHITE" ? 1 : -1;
				// Pawn normal move
				const newPosition = {
					x: piece.position.x,
					y: piece.position.y + direction,
				};
				if (!this.getPieceAt(newPosition)) {
					moves.push({
						pieceId: piece.id,
						from: piece.position,
						to: newPosition,
					});
				}
				// Pawn first double advance
				if (!piece.hasMoved) {
					const newPosition = {
						x: piece.position.x,
						y: piece.position.y + 2 * direction,
					};
					if (!this.getPieceAt(newPosition)) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: newPosition,
						});
					}
				}
				// Pawn capture
				const capturePositions = [
					{
						x: piece.position.x + 1,
						y: piece.position.y + direction,
					},
					{
						x: piece.position.x - 1,
						y: piece.position.y + direction,
					},
				];
				capturePositions.forEach((capturePosition) => {
					const targetPiece = this.getPieceAt(capturePosition);
					if (targetPiece && targetPiece.side !== piece.side) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: capturePosition,
							capturedPieceId: targetPiece.id,
						});
					}
				});
				// Pawn en passant
				const enPassantTargetPositions = [
					{
						x: piece.position.x + 1,
						y: piece.position.y,
					},
					{
						x: piece.position.x - 1,
						y: piece.position.y,
					},
				];
				const enPassantTargetPieces = enPassantTargetPositions.map(
					(position) => this.getPieceAt(position)
				);
				const latestMove = this._history.at(-1);
				for (const targetPiece of enPassantTargetPieces) {
					if (
						targetPiece &&
						targetPiece.type === "PAWN" &&
						targetPiece.side !== piece.side &&
						latestMove &&
						latestMove.pieceId === targetPiece.id
					) {
						const enPassantMovePosition = {
							x: targetPiece.position.x,
							y: piece.position.y + direction,
						};
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: enPassantMovePosition,
							capturedPieceId: targetPiece.id,
						});
					}
				}
				// Pawn promotion
				if (piece.position.y === (piece.side === "WHITE" ? 0 : 7)) {
					moves.push({
						pieceId: piece.id,
						from: piece.position,
						to: {
							x: piece.position.x,
							y: piece.position.y + direction,
						},
						canPromote: true,
					});
				}
				break;
			}
			case "ROOK": {
				// Rook castling
				if (piece.hasMoved) {
					return moves;
				}
				const kings = this.getPiecesByTypeAndSide("KING", piece.side);
				const king = kings[0];
				if (kings.length !== 1 || kings[0].hasMoved) {
					return moves;
				}
				let castlingAvailable = true;
				if (piece.position.x < king.position.x) {
					for (
						let x = piece.position.x + 1;
						x < king.position.x;
						x++
					) {
						const blockingPiece = this.getPieceAt({
							x,
							y: piece.position.y,
						});
						if (blockingPiece) {
							castlingAvailable = false;
							break;
						}
					}
				} else {
					for (
						let x = piece.position.x - 1;
						x > king.position.x;
						x--
					) {
						const blockingPiece = this.getPieceAt({
							x,
							y: piece.position.y,
						});
						if (blockingPiece) {
							castlingAvailable = false;
							break;
						}
					}
				}
				if (castlingAvailable) {
					moves.push({
						pieceId: piece.id,
						from: piece.position,
						to: { x: king.position.x, y: piece.position.y },
						castling: {
							rook: {
								pieceId: piece.id,
								from: piece.position,
								to: { x: king.position.x, y: piece.position.y },
							},
							king: {
								pieceId: piece.id,
								from: king.position,
								to: { x: king.position.x, y: piece.position.y },
							},
						},
					});
				}
				break;
			}
			case "KING": {
				// King castling
				if (piece.hasMoved) {
					return moves;
				}
				const rooks = this.getPiecesByTypeAndSide("ROOK", piece.side);
				for (const rook of rooks) {
					let castlingAvailable = true;
					if (rook.hasMoved) {
						continue;
					}
					if (rook.position.x < piece.position.x) {
						for (
							let x = rook.position.x + 1;
							x < piece.position.x;
							x++
						) {
							const blockingPiece = this.getPieceAt({
								x,
								y: rook.position.y,
							});
							if (blockingPiece) {
								castlingAvailable = false;
								break;
							}
						}
					} else {
						for (
							let x = rook.position.x - 1;
							x > piece.position.x;
							x--
						) {
							const blockingPiece = this.getPieceAt({
								x,
								y: rook.position.y,
							});
							if (blockingPiece) {
								castlingAvailable = false;
								break;
							}
						}
					}
					if (castlingAvailable) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: { x: rook.position.x, y: rook.position.y },
							castling: {
								rook: {
									pieceId: rook.id,
									from: rook.position,
									to: {
										x: rook.position.x,
										y: rook.position.y,
									},
								},
								king: {
									pieceId: piece.id,
									from: piece.position,
									to: {
										x: rook.position.x,
										y: rook.position.y,
									},
								},
							},
						});
					}
				}
				break;
			}
		}
		return moves;
	}

	public getAvailableMoves(pieceId: number): Move[] {
		const piece = this.getPieceById(pieceId);
		// Special moves
		const specialMoves = this.getSpecialMoves(piece);
		// Normal moves
		const normalMoves: Move[] = [];
		const movePaths = piece.getMovePaths();
		for (const movePath of movePaths) {
			for (const position of movePath) {
				if (
					position.x < 0 ||
					position.x > 7 ||
					position.y < 0 ||
					position.y > 7
				) {
					break;
				}
				const targetPiece = this.getPieceAt(position);
				if (targetPiece) {
					if (targetPiece.side !== piece.side) {
						normalMoves.push({
							pieceId: piece.id,
							from: piece.position,
							to: position,
							capturedPieceId: targetPiece.id,
						});
					}
					break;
				} else {
					normalMoves.push({
						pieceId: piece.id,
						from: piece.position,
						to: position,
					});
				}
			}
		}
		return [...specialMoves, ...normalMoves];
	}

	public movePiece(
		id: number,
		to: Position,
		promotionType?: PieceType
	): MoveResult {
		const piece = this.getPieceById(id);
		const availableMoves = this.getAvailableMoves(id);
		const move = availableMoves.find(
			(move) => move.to.x === to.x && move.to.y === to.y
		);
		if (!move) {
			throw new Error("Invalid move");
		}
		if (move.capturedPieceId) {
			const capturedPiece = this.getPieceById(move.capturedPieceId);
			capturedPiece.kill();
		}
		if (move.castling) {
			const rook = this.getPieceById(move.castling.rook.pieceId);
			rook.move(move.castling.rook.to);
			const king = this.getPieceById(move.castling.king.pieceId);
			king.move(move.castling.king.to);
		} else {
			piece.move(to);
		}
		const moveResult: MoveResult = {
			...move,
		};
		if (move.canPromote && promotionType) {
			moveResult.promotion = {
				fromType: piece.type,
				toType: promotionType,
			};
		}
		this._history.push(moveResult);
		return moveResult;
	}
}
