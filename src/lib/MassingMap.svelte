<script>
	import { onMount } from "svelte";
	import maplibregl from "maplibre-gl";
	import * as pmtiles from "pmtiles";
	import BaseLayer from "../data/toronto.json";
	import "../assets/maplibre-gl.css";

	let map;
	let MASSING_URL = "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
	let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";

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
			center: [-79.37, 43.715],
			zoom: 10.5,
			maxZoom: 16.5,
			minZoom: 10,
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

		// Convert the array into a single string
		const attributionString = attributions.join(", ");

		map.addControl(scale, "bottom-left");
		map.addControl(new maplibregl.NavigationControl(), 'top-left');

		// map.touchZoomRotate.disableRotation();
		// map.dragRotate.disable();
		// map.touchZoomRotate.disableRotation();
		// map.scrollZoom.disable();

		// window.addEventListener('scroll', onScroll);

		let protoLayers = BaseLayer;

		map.on("load", function () {

			// toronto base map tiles 

			map.addSource("protomaps", {
				type: "vector",
				url: "pmtiles://" + PMTILES_URL,
				attribution: attributionString,
				attributionControl: false,
			});

			protoLayers.forEach((e) => {
				map.addLayer(e);
			});

			// 3D massing tiles

			map.addSource("massing", {
				type: "vector",
				url: "pmtiles://" + MASSING_URL,
			});

			map.addLayer({
				"id": "massing-layer",
				"type": "fill-extrusion",
				"source": "massing",
				"source-layer": "modified_3DMassingTorontoEPSG4326",
				"paint": {
					"fill-extrusion-color": "grey",
					"fill-extrusion-height": ["get", "avg_height"],
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