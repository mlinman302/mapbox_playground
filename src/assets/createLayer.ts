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

        let first = false;
        for(const node of nodes){
            const nodeMercator = MercatorCoordinate.fromLngLat([node.long, node.lat]);
            const dNode = calcMeterOffset(nodeMercator, sceneOriginMercator);

            if (first == false){
                const nodeMarker = new THREE.Mesh(
                    new THREE.SphereGeometry(1),
                    new THREE.MeshStandardMaterial({
                        color: 'red',
                    })
                )
                nodeMarker.position.set(dNode.dEastMeter, 1 + (node.floor - 1) * floorHeight, dNode.dNorthMeter);
                scene.add(nodeMarker)
                first = true;
                continue;
            }

            if (node.kind == "poi"){
                const nodeMarker = await loadModel("/endStar.gltf")
                nodeMarker.position.set(dNode.dEastMeter, 1 + (node.floor - 1) * floorHeight, dNode.dNorthMeter)
                scene.add(nodeMarker)
            } else if (node.kind == "elevator"){
                const nodeMarker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5),
                    new THREE.MeshStandardMaterial({
                        color: 'skyblue'
                    })
                )
                nodeMarker.position.set(dNode.dEastMeter, 1 + (node.floor - 1) * floorHeight, dNode.dNorthMeter)
                scene.add(nodeMarker)
            } else {
                continue;
            }
        }


        // set path material params
        const lineMaterial = new THREE.LineBasicMaterial({ color: 'blue' }); // normal path
        const dashedMaterial = new THREE.LineDashedMaterial({ // elevator path (dashed)
            color: 'blue',
            dashSize: 1,
            gapSize: 0.5,
            linewidth: 2
        });


        // iterate over all subpaths to create full path
        for (let i = 0; i < nodes.length - 1; i++) {
            const from = nodes[i];
            const to = nodes[i + 1];

            const fromNodeMercator = MercatorCoordinate.fromLngLat([from.long, from.lat]);
            const toNodeMercator = MercatorCoordinate.fromLngLat([to.long, to.lat]);

            // for location of path starts/ends in scene
            const dFromNode = calcMeterOffset(fromNodeMercator, sceneOriginMercator);
            const dToNode = calcMeterOffset(toNodeMercator, sceneOriginMercator);

            const fromVec = new THREE.Vector3(
                dFromNode.dEastMeter,
                1 + (from.floor - 1) * floorHeight,
                dFromNode.dNorthMeter
            );

            const toVec = new THREE.Vector3(
                dToNode.dEastMeter,
                1 + (to.floor - 1) * floorHeight,
                dToNode.dNorthMeter
            );

            // create subpath line segment
            const lineGeo = new THREE.BufferGeometry().setFromPoints([fromVec, toVec]);

            const line = new THREE.Line(
                lineGeo,
                from.floor === to.floor ? lineMaterial : dashedMaterial
            );

            // if there's a floor change, it's an elevator: therefore make a dotted line
            if (from.floor !== to.floor) {
                line.computeLineDistances(); // Needed for dashed lines
            }

            // add subpath line to scene
            scene.add(line);
        }



        // animate icon along path

        // multiple arrow types: one for same floor, one for elevator
        const sphereArrow = new THREE.Mesh(
            new THREE.SphereGeometry(2),
            new THREE.MeshStandardMaterial({ color: 'blue' })
        );

        const elevatorArrow = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({ color: 'blue' })
        );

        scene.add(sphereArrow, elevatorArrow);

        // make both "arrows" (really need better name) invisible
        elevatorArrow.visible = false;
        sphereArrow.visible = false;

        const rawPoints: THREE.Vector3[] = [];

        for (let i = 0; i < nodes.length; i++) {
            // the same as the node scene positioning calculations
            const nodeMercator = MercatorCoordinate.fromLngLat([nodes[i].long, nodes[i].lat]);
            const offset = calcMeterOffset(nodeMercator, sceneOriginMercator);

            rawPoints.push(new THREE.Vector3(
                offset.dEastMeter,
                1 + (nodes[i].floor - 1) * floorHeight,
                offset.dNorthMeter
            ));
        }


        // animate along path segments
        let subpathIndex = 0;
        let progress = 0;


        function animateArrowOnPath() {
            // checker for if done with path (goes back to beginning)
            if (subpathIndex >= rawPoints.length - 1) {
                // reset the progress for the next path
                subpathIndex = 0;
                progress = 0;
            }

            if(nodes[subpathIndex].kind === "elevator" && subpathIndex + 1 < nodes.length && nodes[subpathIndex + 1].floor != nodes[subpathIndex].floor){
                elevatorArrow.visible = true;
                sphereArrow.visible = false;
            } else{
                elevatorArrow.visible = false;
                sphereArrow.visible = true;
            }


            const start = rawPoints[subpathIndex];
            const end = rawPoints[subpathIndex + 1];
            const dir = new THREE.Vector3().subVectors(end, start);
            const length = dir.length(); // for normalizing object speed along path
            dir.normalize();

            const arrowSpeed = .5 / length; // normalized to path length: arrow moves at constant speed

            progress += arrowSpeed;

            const pos = new THREE.Vector3().lerpVectors(start, end, progress); // move arrow along path
            sphereArrow.position.copy(pos); // have both elevator and sphere are rendered together and visibility is toggles
            elevatorArrow.position.copy(pos);

            requestAnimationFrame(animateArrowOnPath);

            // if we get to the end of the subpath
            if (progress >= 1) {
                subpathIndex++;
                progress = 0;
            }
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