import type { ThreeEvent } from "@react-three/fiber";
import type { PlayerSide } from "../engineV2/types";

export type PieceProps = {
	initialCoordinates: [number, number, number];
	color: PlayerSide;
	onClick: (e: ThreeEvent<MouseEvent>) => void;
};
