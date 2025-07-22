import { Canvas } from "@react-three/fiber";
import { Html, useProgress, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { GameComponent } from "./components/game";

function Loader() {
	const { progress } = useProgress();
	return <Html center>{progress} % loaded</Html>;
}

export default function App() {
	return (
		<div id="canvas-container">
			<Canvas shadows>
				<OrbitControls />

				<directionalLight
					// castShadow
					position={[0.8, 0.5, 0.1]}
					shadow-mapSize={[1024, 1024]}
					intensity={10}
				></directionalLight>
				<Suspense fallback={<Loader />}>
					<GameComponent />
				</Suspense>
			</Canvas>
		</div>
	);
}
