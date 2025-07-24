import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "@/engine/types";

export function useBishopMesh(color: PlayerSide) {
  const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
  const isWhite = color === "WHITE";
  return {
    body: {
      geometry: isWhite ? nodes.Bishop_W1.geometry : nodes.Bishop_B1.geometry,
      material: isWhite ? materials.Bishop_White : materials.Bishop_Black,
    },
    top: null,
  };
} 