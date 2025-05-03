import * as THREE from "three";
import mapboxgl from "mapbox-gl";

type tempNode = {
    lat: number,
    long: number,
    floor: number,
    kind: string
}


export function addNodeMarkers(
    nodes: tempNode[],
    scene: THREE.Scene,
    floorSeparation: number,
    modelTransform: {
        translateX: number;
        translateY: number;
        translateZ: number;
        scale: number;
    }
): void {
    for (const node of nodes) {
        const merc = mapboxgl.MercatorCoordinate.fromLngLat(
            [node.long, node.lat],
            0 // altitude in meters
        );

        // Convert from absolute coordinates → relative to the model's origin
        const relativeX = (merc.x - modelTransform.translateX) / modelTransform.scale;
        const relativeY = (merc.y - modelTransform.translateY) / modelTransform.scale;
        const relativeZ =
            (merc.z - modelTransform.translateZ + node.floor * floorSeparation) /
            modelTransform.scale;

        const position = new THREE.Vector3(relativeX, relativeY, relativeZ);

        const geometry = new THREE.SphereGeometry(0.5); // 0.5 meter radius
        const material = new THREE.MeshStandardMaterial({
            color:
                {
                    poi: "skyblue",
                    stairs: "orange",
                    elevator: "limegreen",
                    path: "crimson",
                }[node.kind] ?? "gray",
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        scene.add(sphere);
    }
}