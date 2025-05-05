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

]


export type buildingAttributes = {
    sceneCoords: LngLatLike,
    buildingCoords: LngLatLike,
    buildingPath: string,
    buildingMaskPath: string,
    buildingRotation: number,
    floorHeight: number,
    buildingMaskCoords: LngLatLike,
    nodes: tempNode[]
};


const Pat20SceneCoords: LngLatLike = [-71.26599086652641, 42.09277375925052]
const Pat20BuildingCoords: LngLatLike = [-71.26646779246585, 42.093016005061315]
const Pat20BuildingMaskCoords: LngLatLike = [-71.26629497632113, 42.09248760267727]
const Patriot20Building = {
    sceneCoords: Pat20SceneCoords,
    buildingCoords: Pat20BuildingCoords,
    buildingPath: "/public/20Patriot.gltf",
    buildingMaskPath: '/Pat20Exterior.glb',
    buildingRotation: -Math.PI/10,
    floorHeight: 20,
    buildingMaskCoords: Pat20BuildingMaskCoords,
    nodes: tempNodes
}


const MapboxMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mapboxgl.accessToken = myKey;

        const map: Map = new mapboxgl.Map({
            container: mapContainer.current as HTMLDivElement,
            style: "mapbox://styles/mapbox/light-v11",
            center: [-71.26599086652641, 42.09287375925052],
            zoom: 18,
            pitch: 0,
            antialias: true,
        });

        CreateLayer(map, Patriot20Building)

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