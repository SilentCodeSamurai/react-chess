import { useGLTF } from "@react-three/drei";
import type {
	PieceState,
	MoveType,
	PlayerSide,
	Move,
	MoveResult,
} from "../engineV2/types";
import { PieceTypeComponentMap } from "./pieceMap";
import { useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Tile } from "./tile";
import { Game } from "../engineV2/game";

const Y_POSITION_OFFSET = 0.018;
const HORIZONTAL_MULTIPLIER = 0.0624;

const HIGHLIGHTED_TILE_COLORS: Record<MoveType, string> = {
	NORMAL: "green",
	CAPTURE: "red",
	CASTLING: "blue",
	PROMOTION: "purple",
};

// Helper to get color for a pieceId from the engine
function getPieceColor(game: Game, pieceId: number): PlayerSide | undefined {
	// @ts-ignore
	const piece = game._board.pieceMap.get(pieceId);
	return piece?.side;
}

export function GameComponent() {
	const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
	const [game] = useState(() => new Game());
	const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
	const [highlightedMoves, setHighlightedMoves] = useState<Move[]>([]);
	const [boardState, setBoardState] = useState<PieceState[]>(game.board);

	// Store refs for each piece by pieceId
	const pieceRefs = useRef<Record<number, any>>({});

	// Update highlighted moves when selection changes
	useEffect(() => {
		if (selectedPieceId) {
			setHighlightedMoves(game.getAvailableMoves(selectedPieceId));
		} else {
			setHighlightedMoves([]);
		}
	}, [selectedPieceId, game]);

	function trasposeCoordinatesToPosition(coordinates: {
		x: number;
		y: number;
	}): [number, number, number] {
		const { x, y } = coordinates;
		const offsetedX = x - 3;
		const offsetedZ = y - 3;
		const positionX =
			offsetedX * HORIZONTAL_MULTIPLIER - HORIZONTAL_MULTIPLIER / 2;
		const positionZ =
			offsetedZ * HORIZONTAL_MULTIPLIER - HORIZONTAL_MULTIPLIER / 2;
		return [positionX, Y_POSITION_OFFSET, positionZ];
	}

	function getPiecePosition(
		pieceState: PieceState
	): [number, number, number] {
		const { x, y } = pieceState.coordinates;
		return trasposeCoordinatesToPosition({ x, y });
	}

	// Imperative move handler
	async function handleMakeTurn(coordinates: { x: number; y: number }) {
		if (selectedPieceId == null) throw new Error("No piece selected");
		const move = highlightedMoves.find(
			(move) => move.to.x === coordinates.x && move.to.y === coordinates.y
		);
		if (!move) throw new Error("Move not found");
		// Play animation for the moving piece
		const from = trasposeCoordinatesToPosition(move.from);
		const to = trasposeCoordinatesToPosition(move.to);
		const pieceRef = pieceRefs.current[move.pieceId];

		// Make the move in the engine and get the result
		const moveResult: MoveResult = game.makeTurn(move.pieceId, move.to);
		// Animate the moving piece
		await new Promise<void>((resolve) => {
			if (pieceRef && pieceRef.playMoveAnimation) {
				pieceRef.playMoveAnimation(from, to, resolve);
			} else {
				resolve();
			}
		});
		// Animate captured piece (if any)
		if (moveResult.capturedPieceId) {
			// Optionally, you could fade out or animate the captured piece here
		}
		// Animate castling (if any)
		if (moveResult.castling) {
			const rookRef = pieceRefs.current[moveResult.castling.rook.pieceId];
			const rookFrom = trasposeCoordinatesToPosition(
				moveResult.castling.rook.from
			);
			const rookTo = trasposeCoordinatesToPosition(
				moveResult.castling.rook.to
			);
			await new Promise<void>((resolve) => {
				if (rookRef && rookRef.playMoveAnimation) {
					rookRef.playMoveAnimation(rookFrom, rookTo, resolve);
				} else {
					resolve();
				}
			});
		}
		// Update board state after animation
		setBoardState(game.board);
		setSelectedPieceId(null);
	}

	function handlePieceClick(e: ThreeEvent<MouseEvent>, pieceId: number) {
		e.stopPropagation();
		// Only allow selecting pieces of the current turn
		const color = getPieceColor(game, pieceId);
		if (color !== game.currentTurn) return;
		const pieceState = game.board.find((piece) => piece.id === pieceId);
		if (!pieceState) return;
		const pieceRef = pieceRefs.current[pieceId];
		if (!pieceRef) return;
		const piecePosition = getPiecePosition(pieceState);

		if (selectedPieceId === pieceId) {
			const unselectedPiecePosition = [
				piecePosition[0],
				Y_POSITION_OFFSET,
				piecePosition[2],
			];
			pieceRef.playMoveAnimation(
				piecePosition,
				unselectedPiecePosition,
				() => {}
			);
			setSelectedPieceId(null);
			return;
		}
		const selectedPiecePosition = [
			piecePosition[0],
			Y_POSITION_OFFSET * 2,
			piecePosition[2],
		];
		pieceRef.playMoveAnimation(
			piecePosition,
			selectedPiecePosition,
			() => {}
		);
		setSelectedPieceId(pieceId);
	}

	function handleTileClick(e: ThreeEvent<MouseEvent>, x: number, y: number) {
		e.stopPropagation();
		handleMakeTurn({ x, y });
	}

	// Render a piece with ref
	function renderPiece(pieceState: PieceState) {
		const PieceComponent = PieceTypeComponentMap[pieceState.pieceType];
		return (
			<PieceComponent
				key={pieceState.id}
				ref={(ref) => {
					pieceRefs.current[pieceState.id] = ref;
				}}
				position={getPiecePosition(pieceState)}
				color={getPieceColor(game, pieceState.id) as PlayerSide}
				onClick={(e) => handlePieceClick(e, pieceState.id)}
			/>
		);
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

	return (
		<>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Chessboard.geometry}
				material={materials.Chessboard}
			/>
			{boardState.map((pieceState) => renderPiece(pieceState))}
			{highlightedMoves.map((move) => (
				<Tile
					key={`${move.to.x}-${move.to.y}`}
					color={HIGHLIGHTED_TILE_COLORS[getMoveType(move)]}
					position={trasposeCoordinatesToPosition({
						x: move.to.x,
						y: move.to.y,
					})}
					onClick={(e) => handleTileClick(e, move.to.x, move.to.y)}
				/>
			))}
		</>
	);
}
