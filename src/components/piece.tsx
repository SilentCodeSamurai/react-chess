import React, { useImperativeHandle, useRef, forwardRef } from "react";
import { animated, useSpring } from "@react-spring/three";
import type { PieceProps } from "./types";
import type { PieceType, PlayerSide } from "../engineV2/types";
import { useKingMesh } from "./meshes/kingMesh";
import { useQueenMesh } from "./meshes/queenMesh";
import { useRookMesh } from "./meshes/rookMesh";
import { useBishopMesh } from "./meshes/bishopMesh";
import { useKnightMesh } from "./meshes/knightMesh";
import { usePawnMesh } from "./meshes/pawnMesh";

export type PieceHandle = {
	playMoveAnimation: (
		fromCoordinates: [number, number, number],
		toCoordinates: [number, number, number],
		onRest?: () => void
	) => void;
};

export type GenericPieceProps = PieceProps & {
	type: PieceType;
	initialCoordinates: [number, number, number]; // renamed from startCoordinates
};

const meshHooks: Record<PieceType, (color: PlayerSide) => any> = {
	KING: useKingMesh,
	QUEEN: useQueenMesh,
	ROOK: useRookMesh,
	BISHOP: useBishopMesh,
	KNIGHT: useKnightMesh,
	PAWN: usePawnMesh,
};

export const Piece = React.memo(
	forwardRef<PieceHandle, GenericPieceProps>(({ type, color, initialCoordinates, onClick }, ref) => {
		const meshData = meshHooks[type](color);
		const positionRef = useRef<[number, number, number]>(initialCoordinates);
		const [springs, api] = useSpring(() => ({
			from: { position: initialCoordinates },
			config: { mass: 0.1 },
		}), []); // only use initialCoordinates on mount

		useImperativeHandle(ref, () => ({
			playMoveAnimation: (fromCoordinates, toCoordinates, onRest) => {
				api.start({
					from: { position: fromCoordinates },
					to: { position: toCoordinates },
					onRest: () => {
						positionRef.current = toCoordinates;
						onRest?.();
					},
				});
			},
		}));

		return (
			<animated.group position={springs.position.to((x, y, z) => [x, y, z])} onClick={onClick}>
				<mesh castShadow receiveShadow geometry={meshData.body.geometry} material={meshData.body.material} />
				{meshData.top && (
					<mesh
						castShadow
						receiveShadow
						geometry={meshData.top.geometry}
						material={meshData.top.material}
						position={meshData.top.position}
					/>
				)}
			</animated.group>
		);
	}),
	(prevProps, nextProps) => {
		// Only re-render if onClick changes (not position)
		return prevProps.onClick === nextProps.onClick;
	}
);
