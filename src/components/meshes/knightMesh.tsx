import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "@/engine/types";

export function useKnightMesh(color: PlayerSide) {
  const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
  const isWhite = color === "WHITE";
  return {
    body: {
      geometry: isWhite ? nodes.Knight_W1.geometry : nodes.Knight_B1.geometry,
      material: isWhite ? materials.Knight_White : materials.Knight_Black,
    },
    top: null,
  };
} 