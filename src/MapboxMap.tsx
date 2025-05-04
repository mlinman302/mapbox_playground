// src/components/Map.tsx
import React, { useEffect, useRef } from "react";
import mapboxgl, {LngLatLike, Map} from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { myKey } from "./api_key.ts";
import {CreateLayer} from "./assets/createLayer.ts";

// temporary map data ( replace with actual data from backend)
type tempNode = {
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

const sceneCoords: LngLatLike = [-71.26599086652641, 42.09277375925052]
const buildingCoords: LngLatLike = [-71.26646779246585, 42.093016005061315]
const buildingPath: string = "/public/20Patriot.gltf"
const buildingRotation: number = -Math.PI/10;
const floorHeight = 20;

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

        CreateLayer(map, sceneCoords, buildingCoords, buildingPath, buildingRotation, floorHeight, tempNodes)

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