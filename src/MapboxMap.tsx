// src/components/Map.tsx
import React, { useEffect, useRef } from "react";
import mapboxgl, {LngLatLike, Map} from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { myKey } from "./api_key.ts";
import {CreateBuilding} from "./assets/CreateBuilding.ts";

// temporary map data ( replace with actual data from backend)
type tempNode = {
    lat: number,
    long: number,
    floor: number,
    kind: string
}

const tempNodes: tempNode[] = [
    // {
    //     lat: 42.09260323541027,
    //     long: -71.26632027778273,
    //     floor: 1,
    //     kind: "elevator"
    // }
    // ,
    // {
    //     lat: 42.09277538838522,
    //     long: -71.26593841008295,
    //     floor: 1,
    //     kind: "elevator"
    // },
    // {
    //     lat: 42.09248742893092,
    //     long: -71.2662981180116,
    //     floor: 2,
    //     kind: "elevator"
    // },
    // {
    //     lat: 42.092958501330955,
    //     long: -71.26616773895759,
    //     floor: 2,
    //     kind: "poi"
    // },
    {
        lat: 42.092958501330955,
        long: -71.26629243895759,
        floor: 2,
        kind: "poi"
    },
]

const buildingRotation: [number, number, number] = [0, 0, Math.PI/2 + Math.PI/10];
const buildingCoords: LngLatLike = [-71.26553640553078, 42.09268306821]

const MapboxMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mapboxgl.accessToken = myKey;

        const map: Map = new mapboxgl.Map({
            container: mapContainer.current as HTMLDivElement,
            style: "mapbox://styles/mapbox/light-v11",
            center: [-71.26653814882252, 42.09298141501082],
            zoom: 18,
            pitch: 60,
            antialias: true,
        });

        CreateBuilding(map, buildingCoords, buildingRotation, "/20Patriot.gltf", 20, tempNodes)

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