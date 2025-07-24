import type { PieceHandle } from "./piece";
import type { PieceState, PlayerSide, Position, TurnResult } from "@/engine/types";

export class AnimationManager {
	private pieceRefs: React.RefObject<Record<number, PieceHandle>>;
	private pieces: React.RefObject<
		Array<{
			id: number;
			pieceType: PieceState["type"];
			color: PlayerSide;
			ref: React.RefObject<PieceHandle>;
			alive: boolean;
			coordinates: [number, number, number];
		}>
	>;
	private capturedEdgePositions: React.RefObject<{
		WHITE: number;
		BLACK: number;
	}>;
	private Y_COORDINATE_OFFSET: number;
	private LIFTED_Y_COORDINATE_OFFSET: number;

	constructor(
		pieceRefs: React.RefObject<Record<number, any>>,
		pieces: React.RefObject<Array<any>>,
		capturedEdgePositions: React.RefObject<{ WHITE: number; BLACK: number }>,
		Y_COORDINATE_OFFSET: number,
		LIFTED_Y_COORDINATE_OFFSET: number
	) {
		this.pieceRefs = pieceRefs;
		this.pieces = pieces;
		this.capturedEdgePositions = capturedEdgePositions;
		this.Y_COORDINATE_OFFSET = Y_COORDINATE_OFFSET;
		this.LIFTED_Y_COORDINATE_OFFSET = LIFTED_Y_COORDINATE_OFFSET;
	}

	getPieceInfo(pieceId: number) {
		return this.pieces.current.find((p) => p.id === pieceId);
	}

	async animateTurn(
		turnResult: TurnResult,
		trasposePositionToCoordinates: (position: Position) => [number, number, number]
	) {
		const moveResult = turnResult;
		// --- Castling: animate king and rook in parallel ---
		if (moveResult.castling) {
			console.log("animateTurn castling", moveResult.castling);
			const kingInfo = this.getPieceInfo(moveResult.castling.king.pieceId);
			const rookInfo = this.getPieceInfo(moveResult.castling.rook.pieceId);
			if (!kingInfo || !rookInfo) {
				throw new Error("King or rook not found");
			}
			const kingRef = this.pieceRefs.current[moveResult.castling.king.pieceId];
			const rookRef = this.pieceRefs.current[moveResult.castling.rook.pieceId];

			const kingFrom = kingInfo.coordinates;
			const kingTo = trasposePositionToCoordinates(moveResult.castling.king.to);
			const kingFromUp: [number, number, number] = [kingFrom[0], this.LIFTED_Y_COORDINATE_OFFSET, kingFrom[2]];
			const kingToUp: [number, number, number] = [kingTo[0], this.LIFTED_Y_COORDINATE_OFFSET, kingTo[2]];
			const kingToDown: [number, number, number] = [kingTo[0], this.Y_COORDINATE_OFFSET, kingTo[2]];

			console.log({ kingFrom, kingTo, kingFromUp, kingToUp, kingToDown });

			const rookFrom = rookInfo.coordinates;
			const rookTo = trasposePositionToCoordinates(moveResult.castling.rook.to);
			const rookFromUp: [number, number, number] = [rookFrom[0], this.LIFTED_Y_COORDINATE_OFFSET, rookFrom[2]];
			const rookToUp: [number, number, number] = [rookTo[0], this.LIFTED_Y_COORDINATE_OFFSET, rookTo[2]];
			const rookToDown: [number, number, number] = [rookTo[0], this.Y_COORDINATE_OFFSET, rookTo[2]];

			console.log({ rookFrom, rookTo, rookFromUp, rookToUp, rookToDown });

			// Only animate lift if not already lifted
			const kingNeedsLift = Math.abs(kingFrom[1] - this.LIFTED_Y_COORDINATE_OFFSET) > 1e-6;
			const rookNeedsLift = Math.abs(rookFrom[1] - this.LIFTED_Y_COORDINATE_OFFSET) > 1e-6;

			if (kingNeedsLift || rookNeedsLift) {
				await Promise.all([
					kingNeedsLift
						? new Promise<void>((resolve) => {
							if (kingRef && kingRef.playMoveAnimation) {
								kingRef.playMoveAnimation(kingFrom, kingFromUp, resolve);
							} else {
								resolve();
							}
						})
						: Promise.resolve(),
					rookNeedsLift
						? new Promise<void>((resolve) => {
							if (rookRef && rookRef.playMoveAnimation) {
								rookRef.playMoveAnimation(rookFrom, rookFromUp, resolve);
							} else {
								resolve();
							}
						})
						: Promise.resolve(),
				]);
			}
			// Both slide
			await Promise.all([
				new Promise<void>((resolve) => {
					if (kingRef && kingRef.playMoveAnimation) {
						kingRef.playMoveAnimation(kingFromUp, kingToUp, resolve);
					} else {
						resolve();
					}
				}),
				new Promise<void>((resolve) => {
					if (rookRef && rookRef.playMoveAnimation) {
						rookRef.playMoveAnimation(rookFromUp, rookToUp, resolve);
					} else {
						resolve();
					}
				}),
			]);
			// Both down
			await Promise.all([
				new Promise<void>((resolve) => {
					if (kingRef && kingRef.playMoveAnimation) {
						kingRef.playMoveAnimation(kingToUp, kingToDown, resolve);
					} else {
						resolve();
					}
				}),
				new Promise<void>((resolve) => {
					if (rookRef && rookRef.playMoveAnimation) {
						rookRef.playMoveAnimation(rookToUp, rookToDown, resolve);
					} else {
						resolve();
					}
				}),
			]);
			kingInfo.coordinates = kingToDown;
			rookInfo.coordinates = rookToDown;
			return;
		}

		// --- Normal move and capture logic (unchanged) ---
		const from = this.getPieceInfo(moveResult.pieceId)!.coordinates as [number, number, number];
		const to = trasposePositionToCoordinates(moveResult.to) as [number, number, number];
		const pieceRef = this.pieceRefs.current[moveResult.pieceId];
		const fromUp = [from[0], this.LIFTED_Y_COORDINATE_OFFSET, from[2]] as [number, number, number];
		const toUp = [to[0], this.LIFTED_Y_COORDINATE_OFFSET, to[2]] as [number, number, number];
		const toDown = [to[0], this.Y_COORDINATE_OFFSET, to[2]] as [number, number, number];

		// Animate the moving piece: up at source -> up at dest
		await new Promise<void>((resolve) => {
			if (pieceRef && pieceRef.playMoveAnimation) {
				pieceRef.playMoveAnimation(fromUp, toUp, resolve);
			} else {
				resolve();
			}
		});

		// Animate captured piece (if any) in sync with capturing piece moving down
		if (moveResult.capturedPieceId) {
			const captured = this.getPieceInfo(moveResult.capturedPieceId);
			if (captured) {
				captured.alive = false;
				// Animate to board edge
				const edgeIdx = this.capturedEdgePositions.current[captured.color];
				this.capturedEdgePositions.current[captured.color] += 1;
				const edgeX = captured.color === "WHITE" ? -0.4 : 0.4;
				const edgeZ = -0.3 + 0.05 * edgeIdx;
				const edgePos: [number, number, number] = [edgeX, this.Y_COORDINATE_OFFSET, edgeZ];
				const capturedRef = this.pieceRefs.current[captured.id];
				await Promise.all([
					new Promise<void>((resolve) => {
						if (capturedRef && capturedRef.playMoveAnimation) {
							capturedRef.playMoveAnimation(captured.coordinates, edgePos, resolve);
						} else {
							resolve();
						}
					}),
					new Promise<void>((resolve) => {
						if (pieceRef && pieceRef.playMoveAnimation) {
							pieceRef.playMoveAnimation(toUp, toDown, resolve);
						} else {
							resolve();
						}
					}),
				]);
				captured.coordinates = edgePos;
				this.getPieceInfo(moveResult.pieceId)!.coordinates = toDown;
				return; // skip the separate move down below
			}
		}

		// Animate the moving piece: up at dest -> down at dest (if not a capture)
		await new Promise<void>((resolve) => {
			if (pieceRef && pieceRef.playMoveAnimation) {
				pieceRef.playMoveAnimation(toUp, toDown, resolve);
			} else {
				resolve();
			}
		});
		// Update local position
		this.getPieceInfo(moveResult.pieceId)!.coordinates = toDown;
	}

	async animateSelection(pieceId: number, lift: boolean) {
		const piece = this.getPieceInfo(pieceId);
		if (!piece) return;
		const pieceRef = this.pieceRefs.current[pieceId];
		const piecePosition = piece.coordinates;
		const targetY = lift ? this.LIFTED_Y_COORDINATE_OFFSET : this.Y_COORDINATE_OFFSET;
		const targetPosition: [number, number, number] = [piecePosition[0], targetY, piecePosition[2]];
		await new Promise<void>((resolve) => {
			if (pieceRef && pieceRef.playMoveAnimation) {
				pieceRef.playMoveAnimation(piecePosition, targetPosition, resolve);
			} else {
				resolve();
			}
		});
		piece.coordinates = targetPosition;
	}
}
