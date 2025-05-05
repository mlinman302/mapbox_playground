// src/components/Map.tsx
import React, { useEffect, useRef } from "react";
import mapboxgl, {LngLatLike, Map} from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { myKey } from "./api_key.ts";
import {CreateLayer} from "./assets/createLayer.ts";

// temporary map data ( replace with actual data from backend)
export type tempNode = {
    lat: number,
    long: number,
    floor: number,
    kind: "poi" | "elevator" | "inter"
}


const tempNodes: tempNode[] = [
    {
        lat: 42.09248682590311,
        long: -71.26629410633672,
        floor: 1,
        kind: "inter"
    },
    {
        lat: 42.09277375925052,
        long: -71.26599086652641,
        floor: 1,
        kind: "inter"
    },
    {
        lat: 42.09324032652947,
        long: -71.26658286746988,
        floor: 1,
        kind: "elevator"
    },
    {
        lat: 42.09324032652947,
        long: -71.26658286746988,
        floor: 2,
        kind: "elevator"
    },
    {
        lat: 42.09277375925052,
        long: -71.26599086652641,
        floor: 2,
        kind: "inter"
    },
    {
        lat: 42.09248682590311,
        long: -71.26629410633672,
        floor: 2,
        kind: "elevator"
    },
    // {
    //     lat: 42.09248682590311,
    //     long: -71.26629410633672,
    //     floor: 3,
    //     kind: "elevator"
    // },
    //
    // {
    //     lat: 42.09277375925052,
    //     long: -71.26599086652641,
    //     floor: 3,
    //     kind: "inter"
    // },
    // {
    //     lat: 42.09324032652947,
    //     long: -71.26658286746988,
    //     floor: 3,
    //     kind: "poi"
    // },

]


export type buildingAttributes = {
    sceneCoords: LngLatLike,
    buildingCoords: LngLatLike,
    buildingPaths: string[],
    buildingMaskPath: string,
    buildingRotation: number,
    floorHeight: number,
    buildingMaskCoords: LngLatLike,
    floorPlanPaths: string[]
    nodes: tempNode[]
};


// const Pat20SceneCoords: LngLatLike = [-71.26599086652641, 42.09277375925052]
// const Pat20BuildingCoords: LngLatLike = [-71.26646779246585, 42.093016005061315]
// const Pat20BuildingMaskCoords: LngLatLike = [-71.26629497632113, 42.09248760267727]
// const Patriot20Building: buildingAttributes = {
//     sceneCoords: Pat20SceneCoords,
//     buildingCoords: Pat20BuildingCoords,
//     buildingPaths: ["/public/Pat20Floor.glb", "/public/Pat20Floor.glb", "/public/Pat20Floor.glb", "/public/Pat20Floor.glb"],
//     buildingMaskPath: '/Pat20Exterior.glb',
//     buildingRotation: -Math.PI/10,
//     floorHeight: 20,
//     buildingMaskCoords: Pat20BuildingMaskCoords,
//     floorPlanPaths: [""],
//     nodes: tempNodes,
// }

const Pat22SceneCoords: LngLatLike = [-71.26696722883923, 42.09258410491776]
const Pat22BuildingCoords: LngLatLike = [-71.26697223199403, 42.09223043183033]
const Pat22BuildingMaskCoords: LngLatLike = [-71.26629497632113, 42.09248760267727]
const Patriot22Building = {
    sceneCoords: Pat22SceneCoords,
    buildingCoords: Pat22BuildingCoords,
    buildingPaths: ["/public/Pat22Floor.gltf", "/public/Pat22Floor.gltf", "/public/Pat22Floor.gltf", "/public/Pat22Floor.gltf"],
    buildingMaskPath: "Pat20Exterior.glb",
    buildingRotation: -Math.PI/10,
    floorHeight: 20,
    buildingMaskCoords: Pat22BuildingMaskCoords,
    floorPlanPaths: [''],
    nodes: tempNodes,
}

// const MainSceneCoords: LngLatLike = [-71.106549430016, 42.335842853824396]
// const MainBuildingCoords: LngLatLike = [-71.10636459548073, 42.33526357549587]
// const MainBuildingMaskCoords: LngLatLike = [-71.10636459548073, 42.33526357549587]
// const MainBuilding = {
//     sceneCoords: MainSceneCoords,
//     buildingCoords: MainBuildingCoords,
//     buildingPaths: ["/MainFloor1.gltf", "/MainFloor2.gltf"], // one per floor
//     buildingMaskPath: "/MainExterior.gltf",
//     buildingRotation: 0,
//     floorHeight: 45,
//     buildingMaskCoords: MainBuildingMaskCoords,
//     floorPlanPaths: [''],
//     nodes: tempNodes,
// }


const MapboxMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mapboxgl.accessToken = myKey;

        const map: Map = new mapboxgl.Map({
            container: mapContainer.current as HTMLDivElement,
            style: "mapbox://styles/mapbox/light-v11",
            center: Pat22BuildingCoords,
            zoom: 18,
            pitch: 55,
            antialias: true,
        });

        CreateLayer(map, Patriot22Building)

        return () => map.remove();
    }, []);

    return (
        <div
            ref={mapContainer}
            style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }}
        />
    );
};

export default MapboxMap;