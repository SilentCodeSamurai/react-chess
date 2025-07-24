import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "../../engineV2/types";

export function useKingMesh(color: PlayerSide) {
  const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
  const isWhite = color === "WHITE";
  return {
    body: {
      geometry: isWhite ? nodes.King_W.geometry : nodes.King_B.geometry,
      material: isWhite ? materials.King_White : materials.King_Black,
    },
    top: null,
  };
} 