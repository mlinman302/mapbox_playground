// hooks/useGLTFOverlay.ts
import mapboxgl, {LngLatLike, MercatorCoordinate} from "mapbox-gl";
import * as THREE from "three";
import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";


type tempNode = {
    lat: number,
    long: number,
    floor: number,
    kind: string
}


export function CreateBuilding(
    map: mapboxgl.Map,
    buildingOrigin: mapboxgl.LngLatLike,
    buildingRotation: [number, number, number],
    buildingObjectPath: string,
    floorSeparation: number,
    nodes: tempNode[]
) {

    // const numFloors = 1; // could ascertain through nodes: that way only show floors up to where you go


    async function loadModel(path: string){
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(path);
        return gltf.scene;

    }

    function calcMercatorOffset(fromCoords: MercatorCoordinate, toCoords: MercatorCoordinate) {
        const mercatorPerMeter = fromCoords.meterInMercatorCoordinateUnits();
        const dX = toCoords.x - fromCoords.x;
        const dX_meter = dX / mercatorPerMeter;
        const dY = fromCoords.y - toCoords.y;
        const dY_meter = dY / mercatorPerMeter;
        return {dX_meter, dY_meter};
    }


    const createCustomLayer = async () => {
        const camera = new THREE.Camera();
        const scene = new THREE.Scene();

        // rotations for threejs norms -> mapbox norms:
        scene.rotateX(Math.PI/2);
        scene.scale.multiply(new THREE.Vector3(1, 1, -1));
        //scene is now x=east y=up z=north

        const light = new THREE.DirectionalLight('white');
        light.position.set(50, 70, -30).normalize(); // noon light
        scene.add(light);


        // debug
        scene.add(new THREE.AxesHelper(60))

        const renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: map.painter.context.gl as WebGLRenderingContext,
            antialias: true,
        });

        const buildingMercator = mapboxgl.MercatorCoordinate.fromLngLat(buildingOrigin)
        const sceneOriginMercator = mapboxgl.MercatorCoordinate.fromLngLat(buildingOrigin)

        const dBuilding = calcMercatorOffset(buildingMercator, sceneOriginMercator);

        console.log(dBuilding)


        const buildingModel = await loadModel(buildingObjectPath);

        buildingModel.position.set(dBuilding.dX_meter, dBuilding.dY_meter, 0);
        scene.add(buildingModel)

        // const loader = new GLTFLoader();
        // // for all floors
        // for (let i = 0; i < numFloors; i++) {
        //     loader.load(
        //         buildingObjectPath,
        //         (gltf: GLTF) => {
        //             const floor = gltf.scene;
        //             floor.position.y = i * floorSeparation;
        //             scene.add(floor);
        //         },
        //         undefined,
        //     );
        // }

        const anchor = mapboxgl.MercatorCoordinate.fromLngLat(
            buildingOrigin,
            0
        );

        console.log("building anchor: ", anchor)

        const buildingTransform = {
            translateX: anchor.x,
            translateY: anchor.y,
            translateZ: anchor.z,
            rotateX: buildingRotation[0],
            rotateY: buildingRotation[1],
            rotateZ: buildingRotation[2],
            scale: anchor.meterInMercatorCoordinateUnits(),
        };

        for (const node of nodes) {
            const nodeAnchor = mapboxgl.MercatorCoordinate.fromLngLat(
                [node.long, node.lat],
                0
            );
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshStandardMaterial({
                    color: {
                        poi: "skyblue",
                        stairs: "orange",
                        elevator: "limegreen",
                        path: "crimson",
                    }[node.kind] ?? "gray"
                })
            );
            console.log("node coordinate: ", nodeAnchor)
            scene.add(marker);

            const nodeMercator = mapboxgl.MercatorCoordinate.fromLngLat([node.long, node.lat])

            const dNode = calcMercatorOffset(nodeMercator, sceneOriginMercator)

            marker.position.set(dNode.dY_meter, 0, dNode.dX_meter);
            scene.add(marker)
        }




        renderer.autoClear = false;

        return {
            id: "building-and-nodes",
            type: "custom" as const,
            renderingMode: "3d" as const,
            onAdd: () => {
            },
            render: (_gl: WebGLRenderingContext, matrix: number[]) => {
                const mapMatrix = new THREE.Matrix4().fromArray(matrix);

                const rotationX = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(1, 0, 0), buildingTransform.rotateX);
                const rotationY = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 1, 0), buildingTransform.rotateY);
                const rotationZ = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 0, 1), buildingTransform.rotateZ);

                const transformMatrix = new THREE.Matrix4()
                    .makeTranslation(buildingTransform.translateX, buildingTransform.translateY, buildingTransform.translateZ)
                    .scale(new THREE.Vector3(buildingTransform.scale, -buildingTransform.scale, buildingTransform.scale))
                    .multiply(rotationX)
                    .multiply(rotationY)
                    .multiply(rotationZ);

                camera.projectionMatrix = mapMatrix.multiply(transformMatrix);
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