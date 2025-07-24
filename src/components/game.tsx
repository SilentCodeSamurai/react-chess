import { useGLTF } from "@react-three/drei";
import type { PieceState, MoveType, PlayerSide, Move, Position, GameStatus } from "../engine/types";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Tile } from "./tile";
import { Game } from "@/engine/game";
import { Piece } from "./piece";
import { AnimationManager } from "./animationManager";

const Y_POSITION_OFFSET = 0.018;
const HORIZONTAL_MULTIPLIER = 0.0624;

const HIGHLIGHTED_TILE_COLORS: Record<MoveType, string> = {
	NORMAL: "green",
	CAPTURE: "red",
	CASTLING: "blue",
	PROMOTION: "purple",
};

type TileState = {
	position: Position;
	color: string;
	highlighted: boolean;
};

function generateEmptyTiles(): TileState[] {
	return Array.from({ length: 8 }, (_, i) =>
		Array.from({ length: 8 }, (_, j) => ({
			position: { row: i, col: j },
			color: "white",
			highlighted: false,
		}))
	).flat();
}

function getHiglitedTiles(tiles: TileState[], state: { status: GameStatus; side: PlayerSide }, availableMoves: Move[]) {
	const newTiles: TileState[] = [];
	const check = state.status.check;
	const mate = state.status.mate;
	const stalemate = state.status.stalemate;

	const checkPositions = check
		? {
				threats: check.threatPieces.map((piece) => piece.position),
				king: check.kingPiece.position,
		  }
		: null;

	const matePositions = mate
		? {
				threats: mate.threatPieces.map((piece) => piece.position),
				king: mate.kingPiece.position,
		  }
		: null;

	const stalematePositions = stalemate
		? {
				threats: stalemate.threatPieces.map((piece) => piece.position),
				king: stalemate.kingPiece.position,
		  }
		: null;

	const posEq = (a: Position, b: Position) => a.col === b.col && a.row === b.row;

	for (let i = 0; i < tiles.length; i++) {
		const tile = tiles[i];
		const availableMove =
			availableMoves.find((move) => move.to.col === tile.position.col && move.to.row === tile.position.row) ||
			null;

		const isCheckThreat = checkPositions?.threats.some((pos) => posEq(pos, tile.position));
		const isMateThreat = matePositions?.threats.some((pos) => posEq(pos, tile.position));
		const isStalemateThreat = stalematePositions?.threats.some((pos) => posEq(pos, tile.position));
		const isCheckKing = checkPositions?.king && posEq(checkPositions.king, tile.position);
		const isMateKing = matePositions?.king && posEq(matePositions.king, tile.position);
		const isStalemateKing = stalematePositions?.king && posEq(stalematePositions.king, tile.position);

		if (isStalemateThreat) {
			newTiles[i] = {
				...tile,
				color: "orange",
				highlighted: true,
			};
		} else if (isMateThreat) {
			newTiles[i] = {
				...tile,
				color: "#ff0000",
				highlighted: true,
			};
		} else if (isCheckThreat) {
			newTiles[i] = {
				...tile,
				color: "purple",
				highlighted: true,
			};
		} else if (isStalemateKing) {
			newTiles[i] = {
				...tile,
				color: "orange",
				highlighted: true,
			};
		} else if (isMateKing) {
			newTiles[i] = {
				...tile,
				color: "#7d0000",
				highlighted: true,
			};
		} else if (isCheckKing) {
			newTiles[i] = {
				...tile,
				color: "#e63970",
				highlighted: true,
			};
		} else {
			newTiles[i] = {
				...tile,
				color: availableMove ? HIGHLIGHTED_TILE_COLORS[getMoveType(availableMove)] : "white",
				highlighted: availableMove !== null,
			};
		}
	}
	return newTiles;
}

function getMoveType(move: Move): MoveType {
	if (move.canPromote) {
		return "PROMOTION";
	}
	if (move.capturedPieceId) {
		return "CAPTURE";
	}
	if (move.castling) {
		return "CASTLING";
	}
	return "NORMAL";
}

// Transpose position to coordinates
function trasposePositionToCoordinates(position: Position): [number, number, number] {
	const { col, row } = position;
	const offsetedX = row - 3;
	const offsetedZ = col - 3;
	const positionX = offsetedX * HORIZONTAL_MULTIPLIER - HORIZONTAL_MULTIPLIER / 2;
	const positionZ = offsetedZ * HORIZONTAL_MULTIPLIER - HORIZONTAL_MULTIPLIER / 2;
	return [positionX, Y_POSITION_OFFSET, positionZ];
}

export function GameComponent() {
	const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
	const [game] = useState(() => new Game());
	const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
	const [state, setState] = useState<{
		status: GameStatus;
		side: PlayerSide;
	}>({
		status: game.status,
		side: game.currentTurn,
	});
	const [tiles, setTiles] = useState<TileState[]>(generateEmptyTiles());

	// Local piece info array (id, type, color, ref, alive, coordinates)
	const pieceRefs = useRef<Record<number, any>>({});
	const pieces = useRef<
		Array<{
			id: number;
			pieceType: PieceState["type"];
			color: PlayerSide;
			ref: any;
			alive: boolean;
			coordinates: [number, number, number];
		}>
	>([]);
	const capturedEdgePositions = useRef<{ WHITE: number; BLACK: number }>({
		WHITE: 0,
		BLACK: 0,
	});

	// Animation manager instance
	const animationManager = useRef<AnimationManager | null>(null);
	if (!animationManager.current) {
		animationManager.current = new AnimationManager(
			pieceRefs,
			pieces,
			capturedEdgePositions,
			Y_POSITION_OFFSET,
			Y_POSITION_OFFSET * 10
		);
	}

	// On mount, initialize pieces
	useEffect(() => {
		const initial = game.pieceStates.map((piece) => ({
			id: piece.id,
			pieceType: piece.type,
			color: piece.side,
			ref: null,
			alive: true,
			coordinates: trasposePositionToCoordinates(piece.position),
		}));
		pieces.current = initial;
	}, []); // Only on mount!

	// Update highlighted moves when selection and status changes
	useEffect(() => {
		let legalMoves: Move[] = [];
		if (selectedPieceId) {
			legalMoves = game.getLegalMoves(selectedPieceId);
		}
		const newTiles = getHiglitedTiles(tiles, state, legalMoves);
		setTiles(newTiles);
	}, [selectedPieceId, game, state]);

	// Handle position click
	const handlePositionClick = useCallback(
		async (position: Position) => {
			console.log("handlePositionClick", position);
			const pieceStateAtPosition = game.getPieceStateAt(position);
			if (selectedPieceId != null) {
				const legalMoves = game.getLegalMoves(selectedPieceId);
				const availableMove = legalMoves.find(
					(move) => move.to.col === position.col && move.to.row === position.row
				);
				if (availableMove) {
					await handleMakeTurn(availableMove.to);
				} else if (pieceStateAtPosition !== null && pieceStateAtPosition.side === game.currentTurn) {
					await handlePieceSelect(pieceStateAtPosition.id);
				} else {
					await handlePieceDeselect();
				}
			} else {
				if (pieceStateAtPosition !== null && pieceStateAtPosition.side === game.currentTurn) {
					await handlePieceSelect(pieceStateAtPosition.id);
				}
			}
		},
		[game, selectedPieceId]
	);

	// Handle piece click
	const handlePieceClick = useCallback(
		async (e: ThreeEvent<MouseEvent>, pieceId: number) => {
			e.stopPropagation();
			const pieceState = game.getPieceStateById(pieceId);
			if (pieceState?.status === "DEAD") return;
			if (!pieceState) return;
			await handlePositionClick(pieceState.position);
		},
		[handlePositionClick]
	);

	// Handle tile click
	const handleTileClick = useCallback(
		async (e: ThreeEvent<MouseEvent>, position: Position) => {
			e.stopPropagation();
			await handlePositionClick(position);
		},
		[handlePositionClick]
	);

	async function handlePieceDeselect() {
		if (!animationManager.current) return;
		setSelectedPieceId(null);
		if (selectedPieceId != null) {
			await animationManager.current.animateSelection(selectedPieceId, false);
		}
	}

	async function handlePieceSelect(pieceId: number) {
		if (!animationManager.current) return;
		const pieceState = game.getPieceStateById(pieceId);
		if (!pieceState || pieceState.status === "DEAD") return;
		if (pieceState.side !== game.currentTurn) return;
		if (selectedPieceId === pieceId) {
			await handlePieceDeselect();
		} else if (selectedPieceId !== null) {
			setSelectedPieceId(pieceId);
			await Promise.all([
				animationManager.current.animateSelection(selectedPieceId, false),
				animationManager.current.animateSelection(pieceId, true),
			]);
		} else {
			setSelectedPieceId(pieceId);
			await animationManager.current.animateSelection(pieceId, true);
		}
	}

	async function handleMakeTurn(position: Position) {
		if (!animationManager.current) {
			return;
		}
		if (selectedPieceId == null) throw new Error("No piece selected");
		const turnResult = game.makeTurn(selectedPieceId, position);
		await Promise.all([
			animationManager.current.animateTurn(turnResult, trasposePositionToCoordinates),
			setSelectedPieceId(null),
		]);
		console.log("algebraicHistory", game.algebraicHistory);
		console.log("history", game.history);
		setState({
			status: game.status,
			side: game.currentTurn,
		});
	}

	return (
		<>
			<mesh castShadow receiveShadow geometry={nodes.Chessboard.geometry} material={materials.Chessboard} />
			{pieces.current.map((piece) => (
				<Piece
					type={piece.pieceType}
					key={piece.id}
					initialCoordinates={piece.coordinates} // Only initial position on mount
					color={piece.color}
					ref={(ref) => {
						pieceRefs.current[piece.id] = ref;
						piece.ref = ref;
					}}
					onClick={(e) => handlePieceClick(e, piece.id)}
				/>
			))}
			{tiles.map((tile) => (
				<Tile
					key={`${tile.position.col}-${tile.position.row}`}
					color={tile.color}
					highlighted={tile.highlighted}
					position={trasposePositionToCoordinates(tile.position)}
					onClick={(e) => handleTileClick(e, tile.position)}
				/>
			))}
		</>
	);
}
