// hooks/useGLTFOverlay.ts
import mapboxgl, {MercatorCoordinate} from "mapbox-gl";
import * as THREE from "three";
import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";


type tempNode = {
    lat: number,
    long: number,
    floor: number,
    kind: string
}


export function CreateLayer(
    map: mapboxgl.Map,
    sceneCoords: mapboxgl.LngLatLike,
    nodes: tempNode[]
) {

    // const numFloors = 1; // could ascertain through nodes: that way only show floors up to where you go


    // async function loadModel(path: string){
    //     const loader = new GLTFLoader();
    //     const gltf = await loader.loadAsync(path);
    //     return gltf.scene;
    // }

    function calcMeterOffset(from: MercatorCoordinate, to: MercatorCoordinate) {
        const mercatorPerMeter = from.meterInMercatorCoordinateUnits();
        // mercator x: 0=west, 1=east
        const dEast = to.x - from.x;
        const dEastMeter = dEast / mercatorPerMeter;
        // mercator y: 0=north, 1=south
        const dNorth = from.y - to.y;
        const dNorthMeter = dNorth / mercatorPerMeter;
        return {dEastMeter, dNorthMeter};
    }


    const createCustomLayer = async () => {

        const camera = new THREE.Camera();
        const scene = new THREE.Scene();

        // rotations for threejs norms -> mapbox norms:
        scene.rotateX(Math.PI/2);

        //scene is now x=east y=up z=north
        scene.scale.multiply(new THREE.Vector3(1, 1, -1));


        const light = new THREE.DirectionalLight('white');
        light.position.set(50, 70, -30).normalize(); // noon light
        scene.add(light);


        // debug
        scene.add(new THREE.AxesHelper(60))



        const sceneOriginMercator = mapboxgl.MercatorCoordinate.fromLngLat(sceneCoords)

        const node0Mercator = mapboxgl.MercatorCoordinate.fromLngLat([nodes[0].long, nodes[0].lat])
        const d0Node = calcMeterOffset(node0Mercator, sceneOriginMercator);

        const marker0 = new THREE.Mesh(
            new THREE.SphereGeometry(0.5),
            new THREE.MeshStandardMaterial({
                color: 'skyblue'
            })
        );

        marker0.position.set(d0Node.dEastMeter, 0, d0Node.dNorthMeter);

        scene.add(marker0);

        const node1Mercator = mapboxgl.MercatorCoordinate.fromLngLat([nodes[1].long, nodes[1].lat])
        const d1Node = calcMeterOffset(node1Mercator, sceneOriginMercator);

        const marker1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.5),
            new THREE.MeshStandardMaterial({
                color: 'skyblue'
            })
        );

        marker1.position.set(d1Node.dEastMeter, 0, d1Node.dNorthMeter);

        scene.add(marker1);


        const sceneTransform = {
            translateX: sceneOriginMercator.x,
            translateY: sceneOriginMercator.y,
            translateZ: sceneOriginMercator.z,
            scale: sceneOriginMercator.meterInMercatorCoordinateUnits()
        };


        const renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: map.painter.context.gl as WebGLRenderingContext,
            antialias: true,
        });

        renderer.autoClear = false;


        return {
            id: "building-and-nodes",
            type: "custom" as const,
            renderingMode: "3d" as const,
            onAdd: () => {
            },
            render: (_gl: WebGLRenderingContext, matrix: number[]) => {
                const m = new THREE.Matrix4().fromArray(matrix);
                const l = new THREE.Matrix4()
                    .makeTranslation(sceneTransform.translateX, sceneTransform.translateY, sceneTransform.translateZ)
                    .scale(new THREE.Vector3(sceneTransform.scale, -sceneTransform.scale, sceneTransform.scale));

                camera.projectionMatrix = m.multiply(l);
                renderer.resetState();
                renderer.render(scene, camera);
                map.triggerRepaint();
            }
        };
    };

    map.on("style.load", async () => {
        map.addLayer(await createCustomLayer(), "waterway-label");
    });
}