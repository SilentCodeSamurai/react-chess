import { Board } from "./board";
import type { IBoard, IGame } from "./interfaces";
import type {
	GameState,
	Move,
	MoveResult,
	PieceState,
	PieceType,
	PlayerSide,
	Position,
} from "./types";

export class Game implements IGame {
	private _board: IBoard;
	private _currentTurn: PlayerSide;

	constructor() {
		this._board = new Board();
		this._currentTurn = "WHITE";
	}

	public get board(): PieceState[] {
		return this._board.pieces
			.filter((piece) => piece.state !== "DEAD")
			.map((piece) => ({
				id: piece.id,
				pieceType: piece.type,
				coordinates: piece.position,
			}));
	}

	public get currentTurn(): PlayerSide {
		return this._currentTurn;
	}

	public get state(): GameState {
		// check for check, mate, stalemate
		// check if there is a winner
		// return the state
		const state: GameState = {
			winner: undefined,
			board: {
				check: undefined,
				mate: undefined,
				stalemate: undefined,
			},
		};
		return state;
	}

	public getAvailableMoves(pieceId: number): Move[] {
		return this._board.getAvailableMoves(pieceId);
	}

	public makeTurn(
		pieceId: number,
		to: Position,
		promotionType?: PieceType
	): MoveResult {
		const piece = this._board.pieceMap.get(pieceId);
		if (!piece) {
			throw new Error("Piece not found");
		}
		if (piece.side !== this._currentTurn) {
			throw new Error("Invalid turn side");
		}
		if (piece.state === "DEAD") {
			throw new Error("Piece is dead");
		}
		const moveResult = this._board.movePiece(pieceId, to, promotionType);
		this._currentTurn = this._currentTurn === "WHITE" ? "BLACK" : "WHITE";
		return moveResult;
	}

	public undoTurn(): MoveResult {
		throw new Error("Not implemented");
	}
}
