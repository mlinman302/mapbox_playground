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
    kind: string
}

const tempNodes: tempNode[] = [
    {
        lat: 42.09248682590311,
        long: -71.26629410633672,
        floor: 1,
        kind: "poi"
    },
    {
        lat: 42.09324032652947,
        long: -71.26658286746988,
        floor: 1,
        kind: "poi"
    }
]

// const buildingRotation: [number, number, number] = [0, 0, Math.PI/2 + Math.PI/10];
// const buildingCoords: LngLatLike = [-71.26553640553078, 42.09268306821]
const sceneCoords: LngLatLike = [-71.26599086652641, 42.09287375925052]

const MapboxMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mapboxgl.accessToken = myKey;

        const map: Map = new mapboxgl.Map({
            container: mapContainer.current as HTMLDivElement,
            style: "mapbox://styles/mapbox/light-v11",
            center: sceneCoords,
            zoom: 18,
            pitch: 60,
            antialias: true,
        });

        CreateLayer(map, sceneCoords, tempNodes)

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