<script>
	import { onMount } from "svelte";
	import maplibregl from "maplibre-gl";
	import * as pmtiles from "pmtiles";
	import Wards from "../data/wards.geo.json";
	import WardPts from "../data/wards-pts.geo.json";
	import BaseLayer from "../data/toronto.json";
	import "../assets/maplibre-gl.css";
	import Locations from "../data/locations.geo.json";
	import { SkyDome, CNTower } from '../data/3dModels.js';



	let map;
	let MASSING_URL = "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
	let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";
    
	let activeContentName = 'main';
	export let scrollyContents;

	let pageHeight;
	let pageWidth;

	let mapHeight = 600;
	$: if (pageHeight < 800) {
		mapHeight = pageHeight * 0.7;
	} else {
		mapHeight = 600;
	}

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

		// Convert the array into a single string
		const attributionString = attributions.join(", ");

		map.addControl(scale, "bottom-left");
		map.addControl(new maplibregl.NavigationControl(), 'top-left');

		map.touchZoomRotate.disableRotation();
		map.dragRotate.disable();
		map.touchZoomRotate.disableRotation();
		map.scrollZoom.disable();
		map.dragPan.disable();

		window.addEventListener('scroll', onScroll);

		let protoLayers = BaseLayer;

		map.on("load", function () {
			// Add the source with the concatenated attribution string
			map.addSource("protomaps", {
				type: "vector",
				url: "pmtiles://" + PMTILES_URL,
				attribution: attributionString,
				attributionControl: false,
			});

			protoLayers.forEach((e) => {
				map.addLayer(e);
			});

			map.addSource("Wards", {
				type: "geojson",
				data: Wards,
			});

			map.addSource("WardPts", {
				type: "geojson",
				data: WardPts,
			});

			map.addSource("Locations", {
				type: "geojson",
				data: Locations,
			});

			map.addLayer({
				id: "WardsWhite",
				type: "line",
				source: "Wards",
				layout: {},
				paint: {
					"line-color": "#fff",
					"line-width": 4,
					"line-opacity": 0.4,
				},
			});

			map.addLayer({
				id: "WardsLabel",
				type: "symbol",
				source: "WardPts",
				layout: {
					"text-field": ["get", "name"],
					"text-font": ["TradeGothic LT Bold"],
					"text-size": 11,
					"text-transform": "uppercase",
					"text-justify": "center",
					"text-allow-overlap": true,
				},
				paint: {
					"text-halo-width": 1,
					"text-halo-color": "#fff",
					"text-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						10.1,
						0,
						10.5,
						0.6,
						11.1,
						0.75,
					],
				},
			});

			map.addLayer({
				id: "WardsBlack",
				type: "line",
				source: "Wards",
				layout: {},
				paint: {
					"line-color": "#4d4d4d",
					"line-width": 1,
					"line-opacity": 1,
				},
			});

			map.addLayer({
				id: "Location_pnts",
				type: "circle",
				source: "Locations",
				layout: {},
				paint: {
					'circle-color': '#e1271f',
					'circle-radius': [
						'interpolate',
						['linear'],
						['zoom'],
						5, 1,
						10, 5,
						10.1, 8,
						12, 10
					],
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 2,
				},
			});

			            // CN Tower 3D model
						map.addLayer(CNTower);

// Sky Dome 3D model
map.addLayer(SkyDome);

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

			if (pageHeight > 700 && pageWidth > 800) {
				map.zoomTo(10.5);
			}
		});

	});

	function zoomIn() {
		map.zoomIn();
	}

	function zoomOut() {
		map.zoomOut();
	}

	// On every scroll event, check which element is on screen
	function onScroll() {
        const contentNames = Object.keys(scrollyContents);
        let foundActive = false;
        for (let i = 0; i < contentNames.length; i++) {
            const contentName = contentNames[i];
            if (isElementOnScreen(contentName)) {
                setActiveContent(contentName);
                foundActive = true;
                break;
            }
        }
        if (!foundActive) {
            setActiveContent(null); // Deactivate all sections
        }
    }

    function setActiveContent(contentName) {
        if (contentName === activeContentName) return;

        if (activeContentName !== null) {
            document.getElementById(activeContentName).classList.remove('active');
        }

        if (contentName !== null) {
            document.getElementById(contentName).classList.add('active');
            map.flyTo(scrollyContents[contentName]);
            activeContentName = contentName;
        } else {
            activeContentName = null;
        }
    }

    function isElementOnScreen(id) {
        const element = document.getElementById(id);
        if (!element) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.top < window.innerHeight && bounds.bottom > 0;
    }

	// function isElementOnScreen(id) {
    //     const element = document.getElementById(id);
    //     if (!element) return false;
    //     const bounds = element.getBoundingClientRect();
    //     const fixedHeight = 50; //height of the TopSofC header
    //     return bounds.top < fixedHeight && bounds.bottom > 0;
    // }

</script>


<div id="map"/>
<div id="features">
    {#each Object.keys(scrollyContents) as scrollyContent (scrollyContent)}
        <section id={scrollyContent} class:active={activeContentName === scrollyContent}>
            <h3>{scrollyContents[scrollyContent].title}</h3>
            <p>{@html scrollyContents[scrollyContent].content}</p>
        </section>
    {/each}
</div>

<style>
    #map {
        position: fixed;
        width: 65%;
        height: 90%;
    }

	#features {
		margin-top: 60px;
        width: 35%;
        margin-left: 66%;
        font-family: sans-serif;
        overflow-y: scroll;
        background-color: #fafafa;
    }

    section {
        padding: 25px 50px;
        line-height: 25px;
        border-bottom: 1px solid #ddd;
        opacity: 0.25;
        font-size: 13px;
    }
	
    section.active {
        opacity: 1;
    }
	
    section:last-child {
        border-bottom: none;
        margin-bottom: 500px;
    }

</style>