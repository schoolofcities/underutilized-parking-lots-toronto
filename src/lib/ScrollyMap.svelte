<script> 
    import { onMount } from "svelte";
	import maplibregl from "maplibre-gl";
	import * as pmtiles from "pmtiles";
	import BaseLayer from "../data/toronto.json";
	import "../assets/maplibre-gl.css";
	import { SkyDome, CNTower } from '../data/3dModels.js';

    // export let steps;
    import Lot from "../data/lots.json";
    export let step;

    // Map Parameters

    let map;
    let MASSING_URL = "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
    let PARKING_URL = "/underutilized-parking-lots-toronto/ParkingLotArea.pmtiles";
	let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";

    let pageHeight;
	let pageWidth;

	let mapHeight = 600;
	$: if (pageHeight < 800) {
		mapHeight = pageHeight * 0.7;
	} else {
		mapHeight = 600;
	}

	let scale = new maplibregl.ScaleControl({
		maxWidth: 100,
		unit: "metric",
	});

    const maxBounds = [
		[-79.7712, 43.44], // SW coords
		[-78.914763, 43.93074], // NE coords
	];

    // Mounted Map

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
			center: [-79.37, 43.715],
			zoom: 10.5,
			maxZoom: 16.5,
			minZoom: 10,
			maxPitch: 85,
			bearing: -17.1,
			projection: "globe",
			scrollZoom: true,
			maxBounds: maxBounds,
			attributionControl: true,
		});

		const attributions = [
			'<a href="https://openstreetmap.org">OpenStreetMap</a>',
			// '<a href="https://github.com/Moraine729/Toronto_Heat_Vulnerability">Github</a>',
			'<a href="https://open.toronto.ca/">City of Toronto </a>',
		];

		const attributionString = attributions.join(", ");

		map.addControl(scale, "bottom-left");
		// map.addControl(new maplibregl.NavigationControl({showZoom: false}), 'top-left');

		// map.touchZoomRotate.disableRotation();
		// map.dragRotate.disable();
		// map.touchZoomRotate.disableRotation();
		// map.scrollZoom.disable();
		// map.dragPan.disable();

		let protoLayers = BaseLayer;

		map.on("load", function () {

            map.addSource("protomaps", {
				type: "vector",
				url: "pmtiles://" + PMTILES_URL,
				attribution: attributionString,
				attributionControl: false,
			});

			protoLayers.forEach((e) => {
				map.addLayer(e);
			});

            map.addLayer(CNTower);

			map.addLayer(SkyDome);

			map.addSource("massing", {
				type: "vector",
				url: "pmtiles://" + MASSING_URL,
			});

            map.addSource("parking", {
				type: "vector",
				url: "pmtiles://" + PARKING_URL,
			});

            // map.addLayer({
            //     "id": "parking-layer",
            //     "type": "fill",
            //     "source": "parking",
            //     "source-layer": "parkinglotarea",
            //     "paint": {
            //         "fill-color": "black",
            //     },
            // });


			// map.addLayer({
			// 	"id": "massing-layer",
			// 	"type": "fill-extrusion",
			// 	"source": "massing",
			// 	"source-layer": "3DMassingToronto",
			// 	"paint": {
			// 		"fill-extrusion-color": "#D3D3D3",
			// 		"fill-extrusion-height": ["get", "height"],
			// 	}
			// });

			if (pageHeight > 700 && pageWidth > 800) {
				map.zoomTo(10.5);
			}
		});

	});

    // Step actions
    $: {
    if (step == 0) {
        map.flyTo(Lot[0]);
        setTimeout(() => {
            map.setPaintProperty("parking-layer", "fill-opacity", 0);
        }, 100);
    }
    if (step == 1) {
        map.flyTo(Lot[0]);

        map.addLayer({
            "id": "parking-layer",
            "type": "fill",
            "source": "parking",
            "source-layer": "parkinglotarea",
            "paint": {
                "fill-color": "black",
                "fill-opacity": 0 // Start with 0 opacity
            }
        });

        setTimeout(() => {
            map.setPaintProperty("parking-layer", "fill-opacity", 1);
        }, 100);    
    }
    if (step == 2) {

        setTimeout(() => {
            map.setPaintProperty("parking-layer", "fill-opacity", 0);
        }, 100);

        setTimeout(() => {
        map.flyTo(Lot[2]);
    }, 100); // Adjust the delay duration as needed (e.g., 2000ms = 2 seconds)

        map.removeLayer("massing-layer");
    }
    if (step == 3) {

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
    }
    if (step == 5) {
        map.flyTo(Lot[1]);
    }
    if (step == 6) {
        map.flyTo(Lot[2]);
    }
    if (step == 7) {
        map.flyTo(Lot[0]);
    }
    if (step == 8) {
        map.flyTo(Lot[1]);
    }
    if (step == 9) {
        map.flyTo(Lot[2]);
    }
  }

</script>

<div id="map"/>

<style>
    #map {
        max-width: 100%;
        height: 80vh;
    }
</style>