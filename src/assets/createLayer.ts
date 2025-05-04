// hooks/useGLTFOverlay.ts
import {MercatorCoordinate} from "mapbox-gl";
import * as THREE from "three";
import { GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";


type tempNode = {
    lat: number,
    long: number,
    floor: number,
    kind: "poi" | "elevator" | "inter"
}


export function CreateLayer(
    map: mapboxgl.Map,
    sceneCoords: mapboxgl.LngLatLike,
    builidngCoords: mapboxgl.LngLatLike,
    buildingPath: string,
    buildingRotation: number,
    floorHeight: number,
    nodes: tempNode[]
) {

    // use the nodes to get how many floors to render
    let numFloors = 1;
    for (const node of nodes){
        if (node.floor > numFloors){
            numFloors = node.floor
        }
    }


    async function loadModel(path: string){
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(path);
        return gltf.scene;
    }

    function calcMeterOffset(from: MercatorCoordinate, to: MercatorCoordinate) {
        const mercatorPerMeter = from.meterInMercatorCoordinateUnits();
        // mercator x: 0=west, 1=east
        const dEast = from.x - to.x;
        const dEastMeter = dEast / mercatorPerMeter;
        // mercator y: 0=north, 1=south
        const dNorth = to.y - from.y;
        const dNorthMeter = dNorth / mercatorPerMeter;
        return {dEastMeter, dNorthMeter};
    }


    const createCustomLayer = async () => {

        const camera = new THREE.Camera();
        const scene = new THREE.Scene();

        // rotations for threejs norms -> mapbox norms:
        scene.rotateX(Math.PI/2);

        // scene is now x=east y=up z=north
        scene.scale.multiply(new THREE.Vector3(1, 1, -1));

        // create light (objects black without it)
        const light = new THREE.DirectionalLight('white');
        light.position.set(50, 70, -30).normalize(); // noon light
        scene.add(light);


        // debug
        scene.add(new THREE.AxesHelper(60))

        // scene origin coords
        const sceneOriginMercator = MercatorCoordinate.fromLngLat(sceneCoords)

        // add nodes to scene
        for(const node of nodes){
            const nodeMercator = MercatorCoordinate.fromLngLat([node.long, node.lat]);
            const dNode = calcMeterOffset(nodeMercator, sceneOriginMercator);
            const nodeMarker = new THREE.Mesh( // replace this with certain 3D objects depending on what kind of node
                new THREE.SphereGeometry(0.5),
                new THREE.MeshStandardMaterial({
                    color: 'skyblue'
                })
            )

            nodeMarker.position.set(dNode.dEastMeter, 1 + (node.floor - 1) * floorHeight, dNode.dNorthMeter);
            scene.add(nodeMarker);
        }

        // add paths to scene
        const lineMaterial = new THREE.LineBasicMaterial({ color: 'blue' });
        const dashedMaterial = new THREE.LineDashedMaterial({
            color: 'blue',
            dashSize: 1,
            gapSize: 0.5,
            linewidth: 2
        });

        const fullPathPoints: THREE.Vector3[] = [];

        for (let i = 0; i < nodes.length - 1; i++) {
            const from = nodes[i];
            const to = nodes[i + 1];

            if (from.kind === 'inter' || to.kind === 'inter') continue;

            const fromMercator = MercatorCoordinate.fromLngLat([from.long, from.lat]);
            const toMercator = MercatorCoordinate.fromLngLat([to.long, to.lat]);

            const offsetFrom = calcMeterOffset(fromMercator, sceneOriginMercator);
            const offsetTo = calcMeterOffset(toMercator, sceneOriginMercator);

            const fromVec = new THREE.Vector3(
                offsetFrom.dEastMeter,
                1 + (from.floor - 1) * floorHeight,
                offsetFrom.dNorthMeter
            );
            const toVec = new THREE.Vector3(
                offsetTo.dEastMeter,
                1 + (to.floor - 1) * floorHeight,
                offsetTo.dNorthMeter
            );

            fullPathPoints.push(fromVec, toVec);

            // Create line segment
            const lineGeo = new THREE.BufferGeometry().setFromPoints([fromVec, toVec]);

            const line = new THREE.Line(
                lineGeo,
                from.floor === to.floor ? lineMaterial : dashedMaterial
            );

            if (from.floor !== to.floor) {
                line.computeLineDistances(); // Needed for dashed lines
            }

            scene.add(line);
        }

        // animate icon along path
        const arrowMarker = new THREE.Mesh(
            new THREE.SphereGeometry(1),
            new THREE.MeshStandardMaterial({ color: 'orange' })
        );
        scene.add(arrowMarker);

        const rawPoints: THREE.Vector3[] = [];

        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].kind === 'inter') continue;

            const merc = MercatorCoordinate.fromLngLat([nodes[i].long, nodes[i].lat]);
            const offset = calcMeterOffset(merc, sceneOriginMercator);

            rawPoints.push(new THREE.Vector3(
                offset.dEastMeter,
                1 + (nodes[i].floor - 1) * floorHeight,
                offset.dNorthMeter
            ));
        }


        // animate along path segments
        let segmentIndex = 0;
        let progress = 0;
        const arrowSpeed = 0.005;

        function animateArrowOnPath() {
            if (segmentIndex >= rawPoints.length - 1) {
                // Restart from beginning
                segmentIndex = 0;
                progress = 0;
            }

            const start = rawPoints[segmentIndex];
            const end = rawPoints[segmentIndex + 1];
            const dir = new THREE.Vector3().subVectors(end, start);
            dir.normalize();

            progress += arrowSpeed;

            if (progress >= 1) {
                segmentIndex++;
                progress = 0;
            }

            const pos = new THREE.Vector3().lerpVectors(start, end, progress);
            arrowMarker.position.copy(pos);

            requestAnimationFrame(animateArrowOnPath);
        }

        animateArrowOnPath();



        // calculate building location in scene
        const buildingMercator = MercatorCoordinate.fromLngLat(builidngCoords);
        const dBuilding = calcMeterOffset(buildingMercator, sceneOriginMercator);

        // create all floors in scene
        for (let i = 0;i < numFloors; i++){
            console.log("asdf")
            const floor =  await loadModel(buildingPath);

            const originAxes = new THREE.AxesHelper(2);
            originAxes.position.set(0, 0, 0);
            floor.scale.multiply(new THREE.Vector3(1, 1, -1))
            floor.rotateY(buildingRotation)
            floor.position.set(dBuilding.dEastMeter, i * floorHeight - 1.8, dBuilding.dNorthMeter);
            scene.add(floor)
        }


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
                const sceneTransform = {
                    translateX: sceneOriginMercator.x,
                    translateY: sceneOriginMercator.y,
                    translateZ: sceneOriginMercator.z,
                    scale: sceneOriginMercator.meterInMercatorCoordinateUnits()
                };

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