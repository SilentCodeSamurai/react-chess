import type { ThreeEvent } from "@react-three/fiber";
import type { PlayerSide } from "@/engine/types";

export type PieceProps = {
	initialCoordinates: [number, number, number];
	color: PlayerSide;
	onClick: (e: ThreeEvent<MouseEvent>) => void;
};
