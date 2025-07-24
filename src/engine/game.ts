import { Board } from "./board";
import type { IGame, IPiece } from "./interfaces";
import type { MoveResult, PieceState, PieceType, PlayerSide, Position, GameStatus, TurnResult, Move } from "./types";

function getAlgebraicPosition(position: Position): string {
	return `${String.fromCharCode(position.col + 65)}${position.row + 1}`;
}

export class Game extends Board implements IGame {
	private _currentTurn: PlayerSide;
	private _history: MoveResult[];
	public turnCount: number;

	constructor() {
		super();
		this._currentTurn = "WHITE";
		this._history = [];
		this.turnCount = 0;
	}

	public get history(): MoveResult[] {
		return this._history;
	}

	public get algebraicHistory(): string[] {
		return this._history.map((move) => {
			return `${getAlgebraicPosition(move.from)} -> ${getAlgebraicPosition(move.to)}`;
		});
	}

	public get currentTurn(): PlayerSide {
		return this._currentTurn;
	}

	public get status(): GameStatus {
		return {
			check: this.checkForCheck(this._currentTurn),
			mate: this.checkForMate(this._currentTurn),
			stalemate: this.checkForStalemate(this._currentTurn),
		};
	}

	public reset(): void {
		super.reset();
		this._currentTurn = "WHITE";
		this._history = [];
		this.turnCount = 0;
	}

	public getLegalMoves(pieceId: number): Move[] {
		const piece = this.getPieceById(pieceId);
		const moves = this.getAvailableMoves(pieceId).filter((move) => {
			// Simulate the move
			return !this.isKingInCheckAfterMove(piece.side, {
				pieceId: piece.id,
				to: move.to,
				promotionType: (move as any).promotionType,
			});
		});
		return moves;
	}

	public makeTurn(pieceId: number, to: Position, promotionType?: PieceType): TurnResult {
		const piece = this.getPieceById(pieceId);
		if (!piece) {
			throw new Error("Piece not found");
		}
		if (piece.side !== this._currentTurn) {
			throw new Error("Invalid turn side");
		}
		if (piece.status === "DEAD") {
			throw new Error("Piece is dead");
		}
		const legalMove = this.getLegalMoves(pieceId).find((move) => move.to.col === to.col && move.to.row === to.row);
		if (!legalMove) {
			throw new Error("Invalid move");
		}
		const turnResult: TurnResult = {
			...legalMove,
			side: this._currentTurn,
			turnCount: this.turnCount,
		};
		if (legalMove.capturedPieceId) {
			const capturedPiece = this.getPieceById(legalMove.capturedPieceId);
			capturedPiece.kill();
		}
		if (legalMove.castling) {
			const rook = this.getPieceById(legalMove.castling.rook.pieceId);
			const king = this.getPieceById(legalMove.castling.king.pieceId);
			turnResult.castling = legalMove.castling;
			rook.move(legalMove.castling.rook.to);
			king.move(legalMove.castling.king.to);
		} else {
			piece.move(to);
		}
		if (legalMove.canPromote && promotionType) {
			// TODO: Implement promotion
			turnResult.promotion = {
				fromType: piece.type,
				toType: promotionType,
			};
		}
		this._currentTurn = this._currentTurn === "WHITE" ? "BLACK" : "WHITE";
		this._history.push(turnResult);
		this.turnCount++;
		return turnResult;
	}

	// Helper: Deep clone the board state (pieces, pieceMap)
	private cloneBoardState(): { pieces: IPiece[]; pieceMap: Map<number, IPiece> } {
		const piecesCopy = this.pieces.map((piece) =>
			Object.assign(Object.create(Object.getPrototypeOf(piece)), piece)
		);
		const pieceMapCopy = new Map<number, (typeof piecesCopy)[0]>();
		piecesCopy.forEach((piece) => pieceMapCopy.set(piece.id, piece));
		return { pieces: piecesCopy, pieceMap: pieceMapCopy };
	}

	// Helper: Simulate a move and check if king is in check
	private isKingInCheckAfterMove(
		side: PlayerSide,
		move: { pieceId: number; to: Position; promotionType?: PieceType }
	): boolean {
		const { pieces, pieceMap } = this.cloneBoardState();
		// Find the piece to move
		const piece = pieceMap.get(move.pieceId);
		if (!piece) return false;

		const capturedPiece = pieces.find(
			(p) => p.position.col === move.to.col && p.position.row === move.to.row && p.status === "ALIVE"
		);
		let capturedOriginalStatus: "ALIVE" | "DEAD" | undefined;
		if (capturedPiece) {
			capturedOriginalStatus = capturedPiece.status;
			capturedPiece.kill();
		}
		piece.move(move.to);
		// If promotion
		if (move.promotionType) {
			piece.type = move.promotionType;
		}
		// Now check if king is in check
		const king = pieces.find((p) => p.type === "KING" && p.side === side && p.status === "ALIVE");
		if (!king) return true;
		const enemyPieces = pieces.filter((p) => p.side !== side && p.status === "ALIVE");
		for (const enemy of enemyPieces) {
			const availableMoves = this.getAvailableMovesForPiece(enemy, pieces, pieceMap);
			if (availableMoves.some((m) => m.to.row === king.position.row && m.to.col === king.position.col)) {
				return true;
			}
		}
		return false;
	}

	// Helper: Get available moves for a piece given a board state
	private getAvailableMovesForPiece(piece: any, pieces: any[], pieceMap: Map<number, any>) {
		// Patch this Board instance's pieces and pieceMap temporarily
		const oldPieces = this.pieces;
		const oldPieceMap = this.pieceMap;
		this.pieces = pieces;
		this.pieceMap = pieceMap;
		let moves: any[] = [];
		try {
			moves = this.getAvailableMoves(piece.id);
		} catch {}
		this.pieces = oldPieces;
		this.pieceMap = oldPieceMap;
		return moves;
	}

	private checkForCheck(side: PlayerSide): {
		threatPieces: PieceState[];
		kingPiece: PieceState;
	} | null {
		const kingPiece = this.getPiecesByTypeAndSide("KING", side)[0];
		if (!kingPiece || kingPiece.status === "DEAD") return null;
		const enemyPieces = this.pieces.filter((p) => p.side !== side && p.status === "ALIVE");
		const threatPieces = enemyPieces
			.filter((enemy) => {
				const moves = this.getAvailableMoves(enemy.id);
				return moves.some((m) => m.to.col === kingPiece.position.col && m.to.row === kingPiece.position.row);
			})
			.map((p) => ({
				id: p.id,
				type: p.type,
				side: p.side,
				position: { ...p.position },
				status: p.status,
			}));
		if (threatPieces.length === 0) return null;
		return {
			threatPieces,
			kingPiece: {
				id: kingPiece.id,
				type: kingPiece.type,
				side: kingPiece.side,
				position: { ...kingPiece.position },
				status: kingPiece.status,
			},
		};
	}

	private checkForMate(side: PlayerSide): {
		threatPieces: PieceState[];
		kingPiece: PieceState;
	} | null {
		const check = this.checkForCheck(side);
		if (!check) return null;
		const myPieces = this.pieces.filter((p) => p.side === side && p.status === "ALIVE");
		for (const piece of myPieces) {
			const moves = this.getAvailableMoves(piece.id);
			for (const move of moves) {
				if (
					!this.isKingInCheckAfterMove(side, {
						pieceId: piece.id,
						to: move.to,
						promotionType: (move as any).promotionType,
					})
				) {
					return null;
				}
			}
		}
		return check;
	}

	private checkForStalemate(side: PlayerSide): {
		threatPieces: PieceState[];
		kingPiece: PieceState;
	} | null {
		const check = this.checkForCheck(side);
		if (check) return null;
		const myPieces = this.pieces.filter((p) => p.side === side && p.status === "ALIVE");
		const threatPieces: PieceState[] = [];
		for (const piece of myPieces) {
			const moves = this.getAvailableMoves(piece.id);
			for (const move of moves) {
				if (
					!this.isKingInCheckAfterMove(side, {
						pieceId: piece.id,
						to: move.to,
						promotionType: (move as any).promotionType,
					})
				) {
					return null;
				} else {
					threatPieces.push({
						id: piece.id,
						type: piece.type,
						side: piece.side,
						position: { ...piece.position },
						status: piece.status,
					});
				}
			}
		}
		const kingPiece = this.getPiecesByTypeAndSide("KING", side)[0];
		return {
			threatPieces,
			kingPiece: kingPiece
				? {
						id: kingPiece.id,
						type: kingPiece.type,
						side: kingPiece.side,
						position: { ...kingPiece.position },
						status: kingPiece.status,
				  }
				: (undefined as any),
		};
	}

	public undoTurn(): MoveResult {
		throw new Error("Not implemented");
	}

	private getAvailableMoves(pieceId: number): Move[] {
		const piece = this.getPieceById(pieceId);
		// Special moves
		const specialMoves = this.getSpecialMoves(piece);
		// Normal moves
		const normalMoves: Move[] = [];
		const movePaths = piece.getMovePaths();
		for (const movePath of movePaths) {
			for (const position of movePath) {
				if (position.col < 0 || position.col > 7 || position.row < 0 || position.row > 7) {
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

	private getSpecialMoves(piece: IPiece): Move[] {
		const moves: Move[] = [];
		switch (piece.type) {
			case "PAWN": {
				const direction = piece.side === "WHITE" ? 1 : -1;
				// Pawn forward move
				const forwardMovePosition = {
					row: piece.position.row + direction,
					col: piece.position.col,
				};
				const forwardMoveTargetPiece = this.getPieceAt(forwardMovePosition);
				if (!forwardMoveTargetPiece) {
					moves.push({
						pieceId: piece.id,
						from: piece.position,
						to: forwardMovePosition,
						canPromote: piece.position.row === (piece.side === "WHITE" ? 6 : 1),
					});
				}
				// Pawn forward move 2
				if (!piece.hasMoved) {
					const forwardMovePosition2 = {
						row: piece.position.row + 2 * direction,
						col: piece.position.col,
					};
					const forwardMoveTargetPiece1 = this.getPieceAt(forwardMovePosition);
					const forwardMoveTargetPiece2 = this.getPieceAt(forwardMovePosition2);
					if (!forwardMoveTargetPiece1 && !forwardMoveTargetPiece2) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: forwardMovePosition2,
						});
					}
				}
				// Pawn capture
				const capturePositions = [
					{
						row: piece.position.row + direction,
						col: piece.position.col + 1,
					},
					{
						row: piece.position.row + direction,
						col: piece.position.col - 1,
					},
				];
				for (const capturePosition of capturePositions) {
					const targetPiece = this.getPieceAt(capturePosition);
					if (targetPiece && targetPiece.side !== piece.side) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: capturePosition,
							capturedPieceId: targetPiece.id,
						});
					}
				}
				// Pawn en passant
				const enPassantTargetPositions = [
					{
						row: piece.position.row,
						col: piece.position.col + 1,
					},
					{
						row: piece.position.row,
						col: piece.position.col - 1,
					},
				];
				const enPassantTargetPieces = enPassantTargetPositions.map((position) => this.getPieceAt(position));
				for (const targetPiece of enPassantTargetPieces) {
					const latestMove = this.history[this.history.length - 1];
					if (
						targetPiece &&
						targetPiece.type === "PAWN" &&
						targetPiece.side !== piece.side &&
						latestMove &&
						latestMove.pieceId === targetPiece.id
					) {
						const enPassantMovePosition = {
							row: piece.position.row + direction,
							col: targetPiece.position.col,
						};
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: enPassantMovePosition,
							capturedPieceId: targetPiece.id,
						});
					}
				}
				break;
			}
			case "ROOK": {
				// Rooks do not generate castling moves; only the king does.
				break;
			}
			case "KING": {
				// King castling
				if (piece.hasMoved) {
					return moves;
				}
				const row = piece.position.row;
				const col = piece.position.col;
				const rooks = this.getPiecesByTypeAndSide("ROOK", piece.side).filter(
					(r) => !r.hasMoved && r.position.row === row
				);
				// King-side castling
				const kingSideRook = rooks.find((r) => r.position.col === 7);
				if (kingSideRook) {
					let pathClear = true;
					for (let c = col + 1; c < 7; c++) {
						if (this.getPieceAt({ row, col: c })) {
							pathClear = false;

							break;
						}
					}
					if (pathClear) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: { row, col: col + 2 },
							castling: {
								rook: {
									pieceId: kingSideRook.id,
									from: kingSideRook.position,
									to: { row, col: col + 1 },
								},
								king: {
									pieceId: piece.id,
									from: piece.position,
									to: { row, col: col + 2 },
								},
							},
						});
					}
				}
				// Queen-side castling
				const queenSideRook = rooks.find((r) => r.position.col === 0);
				if (queenSideRook) {
					let pathClear = true;
					for (let c = col - 1; c > 0; c--) {
						if (this.getPieceAt({ row, col: c })) {
							pathClear = false;
							break;
						}
					}
					if (pathClear) {
						moves.push({
							pieceId: piece.id,
							from: piece.position,
							to: { row, col: col - 2 },
							castling: {
								rook: {
									pieceId: queenSideRook.id,
									from: queenSideRook.position,
									to: { row, col: col - 1 },
								},
								king: {
									pieceId: piece.id,
									from: piece.position,
									to: { row, col: col - 2 },
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
}
