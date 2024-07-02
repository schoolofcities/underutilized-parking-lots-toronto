<script>
    import { onMount } from "svelte";
    import * as maplibregl from "maplibre-gl";
    import * as pmtiles from "pmtiles";
    import BaseLayer from "../data/toronto.json";
    import "../assets/maplibre-gl.css";
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

    let map;
    let MASSING_URL = "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";
	  let CN_TOWER_URL = "/underutilized-parking-lots-toronto/cn-tower.gltf";
    let pageHeight;

    // Adding scale bar to the map
    let scale = new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });

    const maxBounds = [
        [-79.7712, 43.44], // SW coords
        [-78.914763, 43.93074], // NE coords
    ];

    onMount(() => {
        pageHeight = document.body.clientHeight;

        let protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        map = new maplibregl.Map({
            container: "map",
            style: {
                version: 8,
                name: "Empty",
                glyphs: "https://schoolofcities.github.io/fonts/fonts/{fontstack}/{range}.pbf",
                sources: {},
                layers: [
                    {
                        id: "background",
                        type: "background",
                        paint: {
                            "background-color": "rgba(0,0,0,0)",
                        },
                    },
                ],
            },
            center: [-79.3871, 43.6426],
            zoom: 15,
			      pitch: 60,
            maxZoom: 16.5,
            minZoom: 10,
            bearing: -17.1,
            projection: "globe",
            scrollZoom: true,
            maxBounds: maxBounds,
            attributionControl: true,
			      antialias: true,
        });

        const attributions = [
            '<a href="https://openstreetmap.org">OpenStreetMap</a>',
            '<a href="https://open.toronto.ca/">City of Toronto </a>',
        ];

        const attributionString = attributions.join(", ");

        map.addControl(scale, "bottom-left");
        map.addControl(new maplibregl.NavigationControl(), 'top-left');

        let protoLayers = BaseLayer;

		// three js model of CN Tower

		const modelOrigin = [-79.3871, 43.6426];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];
  
    const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
      );
  
    const modelTransform = {
			translateX: modelAsMercatorCoordinate.x,
			translateY: modelAsMercatorCoordinate.y,
			translateZ: modelAsMercatorCoordinate.z,
			rotateX: modelRotate[0],
			rotateY: modelRotate[1],
			rotateZ: modelRotate[2],
			scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
      };

	  const customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();
  
          const directionalLight = new THREE.DirectionalLight(0xffffff);
          directionalLight.position.set(0, -70, 100).normalize();
          this.scene.add(directionalLight);
  
          const directionalLight2 = new THREE.DirectionalLight(0xffffff);
          directionalLight2.position.set(0, 70, 100).normalize();
          this.scene.add(directionalLight2);
  
          const loader = new GLTFLoader();
          loader.load(
            CN_TOWER_URL,
            (gltf) => {
              this.scene.add(gltf.scene);
            }
          );
          this.map = map;
  
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
          });
  
          this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
          const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
          );
          const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
          );
          const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
          );
  
          const m = new THREE.Matrix4().fromArray(matrix);
          const l = new THREE.Matrix4()
            .makeTranslation(
              modelTransform.translateX,
              modelTransform.translateY,
              modelTransform.translateZ
            )
            .scale(
              new THREE.Vector3(
                modelTransform.scale,
                -modelTransform.scale,
                modelTransform.scale
              )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);
  
          this.camera.projectionMatrix = m.multiply(l);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          this.map.triggerRepaint();
        }
      };

	  /////////

        map.on("load", function () {

            // Toronto base map tiles 
            map.addSource("protomaps", {
                type: "vector",
                url: "pmtiles://" + PMTILES_URL,
                attribution: attributionString,
                attributionControl: false,
            });

            protoLayers.forEach((e) => {
                map.addLayer(e);
            });

			map.addLayer(customLayer);

            // 3D massing tiles
            map.addSource("massing", {
                type: "vector",
                url: "pmtiles://" + MASSING_URL,
            });

            map.addLayer({
                "id": "massing-layer",
                "type": "fill-extrusion",
                "source": "massing",
                "source-layer": "3DMassingToronto",
                "paint": {
                    "fill-extrusion-color": "#D3D3D3",
                    "fill-extrusion-height": ["get", "height"],
                }
            });

        });
    });
</script>

<div id="map"/>

<style>
    #map {
        position: fixed;
        width: 100%;
        height: 100%;
    }
</style>
