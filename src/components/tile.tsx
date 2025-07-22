import { Center, RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

type TileProps = {
	color: string;
	position: [number, number, number];
	onClick: (e: ThreeEvent<MouseEvent>) => void;
};

export function Tile({ color, position, onClick }: TileProps) {
	return (
		<Center position={position}>
			<RoundedBox
				scale={[0.98, 0.98, 0.98]}
				radius={0.0005}
				args={[0.063, 0.001, 0.063]}
				onClick={onClick}
			>
				<meshBasicMaterial color={color} transparent opacity={0.3} />
			</RoundedBox>
		</Center>
	);
}
