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

export type imageConstants = {
    width: number,
    height: number,
    offsetEast: number,
    offsetNorth: number
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
    {
        lat: 42.09248682590311,
        long: -71.26629410633672,
        floor: 3,
        kind: "elevator"
    },

    {
        lat: 42.09277375925052,
        long: -71.26599086652641,
        floor: 3,
        kind: "inter"
    },
    {
        lat: 42.09324032652947,
        long: -71.26658286746988,
        floor: 3,
        kind: "poi"
    },
    {
        lat: 42.09324032652947,
        long: -71.26658286746988,
        floor: 4,
        kind: "poi"
    },

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
    nodes: tempNode[],
    imageConstants: imageConstants
};


// const Pat20SceneCoords: LngLatLike = [-71.26599086652641, 42.09277375925052]
// const Pat20BuildingCoords: LngLatLike = [-71.26646779246585, 42.093016005061315]
// const Pat20BuildingMaskCoords: LngLatLike = [-71.26629497632113, 42.09248760267727]
// const Patriot20Building: buildingAttributes = {
//     sceneCoords: Pat20SceneCoords,
//     buildingCoords: Pat20BuildingCoords,
//     buildingPaths: ["/20Patriot/Pat20Floor.glb", "/20Patriot/Pat20Floor.glb", "/20Patriot/Pat20Floor.glb", "/20Patriot/Pat20Floor.glb"],
//     buildingMaskPath: '/20Patriot/PatExterior.glb',
//     buildingRotation: -Math.PI/10,
//     floorHeight: 20,
//     buildingMaskCoords: Pat20BuildingMaskCoords,
//     floorPlanPaths: [""],
//     nodes: tempNodes,
// }

const Pat22SceneCoords: LngLatLike = [-71.26696722883923, 42.09258410491776]
const Pat22BuildingCoords: LngLatLike = [-71.26697223199403, 42.09223043183033]
const Pat22BuildingMaskCoords: LngLatLike = [-71.26629497632113, 42.09248760267727]
const Pat22ImageConstants: imageConstants = {
    width: 68,
    height: 87,
    offsetEast: -2,
    offsetNorth: 5
}
const Patriot22Building = {
    sceneCoords: Pat22SceneCoords,
    buildingCoords: Pat22BuildingCoords,
    buildingPaths: ["/22Patriot/Pat22Floor.gltf", "/22Patriot/Pat22Floor.gltf", "/22Patriot/Pat22Floor.gltf", "/22Patriot/Pat22Floor.gltf"],
    buildingMaskPath: "/20Patriot/PatExterior.glb",
    buildingRotation: -Math.PI/10,
    floorHeight: 20,
    buildingMaskCoords: Pat22BuildingMaskCoords,
    floorPlanPaths: ['22Patriot/22PatFloor1.png', '22Patriot/22PatFloor2.png', "22Patriot/22PatFloor3.png", "22Patriot/22PatFloor4.png"],
    nodes: tempNodes,
    imageConstants: Pat22ImageConstants
}

// const MainSceneCoords: LngLatLike = [-71.106549430016, 42.335842853824396]
// const MainBuildingCoords: LngLatLike = [-71.10636459548073, 42.33526357549587]
// const MainBuildingMaskCoords: LngLatLike = [-71.10636459548073, 42.33526357549587]
// const MainBuilding = {
//     sceneCoords: MainSceneCoords,
//     buildingCoords: MainBuildingCoords,
//     buildingPaths: ["/Main/MainFloor1.gltf", "/Main/MainFloor2.gltf"], // one per floor
//     buildingMaskPath: "/Main/MainExterior.gltf",
//     buildingRotation: 0,
//     floorHeight: 45,
//     buildingMaskCoords: MainBuildingMaskCoords,
//     floorPlanPaths: [''],
//     nodes: tempNodes,
// }

// const FaulknerSceneCoords: LngLatLike = [-71.12834142530612, 42.30150822410094]
// const FaulknerBuildingCoords: LngLatLike = [-71.12855652822122, 42.300928445283546]
// const FaulknerBuildingMaskCoords: LngLatLike = [-71.12855652822122, 42.300928445283546]
// const FaulknerBuilding = {
//     sceneCoords: FaulknerSceneCoords,
//     buildingCoords: FaulknerBuildingCoords,
//     buildingPaths: ["/Faulkner/FaulknerFloor1.gltf"], // one per floor
//     buildingMaskPath: "/Faulkner/FaulknerExterior.gltf",
//     buildingRotation: 0,
//     floorHeight: 45,
//     buildingMaskCoords: FaulknerBuildingMaskCoords,
//     floorPlanPaths: [''],
//     nodes: tempNodes,
// }

// const ChestnutSceneCoords: LngLatLike = [-71.14974760810384, 42.325950820451]
// const ChestnutBuildingCoords: LngLatLike = [-71.1500853668773, 42.325693309988054]
// const ChestnutBuildingMaskCoords: LngLatLike = [-71.1500853668773, 42.325693309988054]
// const ChestnutImageConstants: imageConstants = {
//     width: 72,
//     height: 63,
//     offsetEast: 5,
//     offsetNorth: 2
// }
// const ChestnutBuilding = {
//     sceneCoords: ChestnutSceneCoords,
//     buildingCoords: ChestnutBuildingCoords,
//     buildingPaths: ["/Chestnut/ChestnutFloor1.gltf"], // one per floor
//     buildingMaskPath: "/Chestnut/ChestnutExterior.gltf",
//     buildingRotation: 0,
//     floorHeight: 25,
//     buildingMaskCoords: ChestnutBuildingMaskCoords,
//     floorPlanPaths: ['/Chestnut/ChestnutFloor1.png'],
//     nodes: tempNodes,
//     imageConstants: ChestnutImageConstants
// }


const MapboxMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mapboxgl.accessToken = myKey;

        const map: Map = new mapboxgl.Map({
            container: mapContainer.current as HTMLDivElement,
            style: "mapbox://styles/mapbox/light-v11",
            center: Pat22SceneCoords,
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