<script>
    import Top from "$lib/TopSofC.svelte";
    import { onMount } from "svelte";
    import maplibregl from "maplibre-gl";
    import "../../assets/maplibre-gl.css";
    import "../../assets/styles.css";

    import * as pmtiles from "pmtiles";
    import BaseLayer from "../../data/toronto-filling-the-void.json";

    //GENERAL
    // import LotRevenue from "../../data/LotRevenue.geo.json";
    import TorontoOutline from "../../data/toronto-outline.geo.json";
    import NegativeMask from "../../data/city-mask.geo.json";
    import FullMask from "../../data/full-mask.geo.json";
    import HeatMap from "../../data/heat-map.geo.json";

    //GREEN P
    import GreenPBufferAll from "../../data/green-p-1km-buffer-dissolved.geo.json";
    import GreenPBuffer from "../../data/green-p-1km-buffer.geo.json";
    import GreenPParkArea from "../../data/green-p-park-area-clip.geo.json";
    import GreenPStats from "../../data/green-p-revenue-and-park-area.geo.json";

    //SUBWAY
    import SubwayBufferAll from "../../data/subway-1km-buffer-all.geo.json";
    import SubwayBuffer from "../../data/subway-1km-buffer.geo.json";
    import SubwayLotArea from "../../data/subway-1km-lot-area.geo.json";
    import SubwayStations from "../../data/subway-lot-area.geo.json";
    import SubwayBufferMask from "../../data/subway-1km-negative-mask.geo.json";
    import SubwayTopTen from "../../data/subway-top-ten.geo.json";
    import SubwayTopTenPoints from "../../data/subway-top-ten-points.geo.json";
    // import SubwayTopTenLots from "../../data/subway-top-ten-lots.geo.json";

    //SITES
    import Sherbourne405 from "../../data/405-sherbourne.geo.json";
    import Amroth72 from "../../data/72-amroth.geo.json";
    import Wilson50 from "../../data/50-wilson.geo.json";

    //SVG
    import AmrothIsoLot from "/src/assets/amroth-iso-lot.svg";
    import AmrothIsoBldg from "/src/assets/amroth-iso-bldg.svg";
    import WilsonIsoLot from "/src/assets/wilson-iso-lot.svg";
    import WilsonIsoBldg from "/src/assets/wilson-iso-bldg.svg";

    //TILESETS
    let MASSING_URL =
        "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
    let PARKING_URL =
        "/underutilized-parking-lots-toronto/ParkingLotArea.pmtiles";
    let SUBWAYTILE_URL =
        "/underutilized-parking-lots-toronto/SubwayBufferParkingLot.pmtiles";
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";
    let FAR_URL = "/underutilized-parking-lots-toronto/FARdissolved.pmtiles";

    //MAP INIT
    let map;
    let popup;
    let hoveredStateId = null;
    let protoLayers = BaseLayer;
    let scale = new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });

    //LAYER TOGGLE OPACITY TRANSITIONS
    function fillLayerOn(id) {
        map.setPaintProperty(id, "fill-opacity", 1, { duration: 100 });
    }
    function fillLayerOff(id) {
        map.setPaintProperty(id, "fill-opacity", 0, { duration: 100 });
    }
    function lineLayerOn(id) {
        map.setPaintProperty(id, "line-opacity", 1, { duration: 100 });
    }
    function lineLayerOff(id) {
        map.setPaintProperty(id, "line-opacity", 0, { duration: 100 });
    }
    function heatmapLayerOn(id) {
        map.setPaintProperty(id, "heatmap-opacity", 1, { duration: 100 });
    }
    function heatmapLayerOff(id) {
        map.setPaintProperty(id, "heatmap-opacity", 0, { duration: 100 });
    }
    function circleLayerOn(id) {
        map.setPaintProperty(id, "circle-opacity", 1, { duration: 100 });
    }
    function circleLayerOff(id) {
        map.setPaintProperty(id, "circle-opacity", 0, { duration: 100 });
    }
    function circleStrokeLayerOn(id) {
        map.setPaintProperty(id, "circle-stroke-opacity", 1, { duration: 100 });
    }
    function circleStrokeLayerOff(id) {
        map.setPaintProperty(id, "circle-stroke-opacity", 0, { duration: 100 });
    }

    //SECTION SCROLL
    let sections = [];
    let currentSection = 0;
    let ticking = false;
    let container;

    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY + window.innerHeight / 1;
                let newSection = currentSection;

                sections.forEach((section, index) => {
                    const rect = section.getBoundingClientRect();
                    const top = rect.top + window.scrollY;
                    const bottom = top + rect.height;

                    if (scrollY >= top && scrollY < bottom) {
                        newSection = index;
                    }
                });

                if (newSection !== currentSection) {
                    currentSection = newSection;
                    updateMap(currentSection);
                }

                ticking = false;
            });

            ticking = true;
        }

        console.log("scrollPosition:", scrollPosition);
        console.log("windowHeight:", windowHeight);
        console.log("containerTop:", containerTop);
        console.log("containerHeight:", containerHeight);
        console.log("start:", start);
        console.log("end:", end);
    };

    //MOUNT
    onMount(() => {
        let protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        sections = document.querySelectorAll(".section");
        window.addEventListener("scroll", handleScroll);

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
            center: [-79.274129, 43.732392],
            zoom: 10.5,
            // maxZoom: 16.5,
            // minZoom: 10,
            // maxPitch: 0,
            bearing: -17,
            projection: "globe",
            scrollZoom: true,
            // maxBounds: maxBounds,
            attributionControl: true,
        });

        //MAP INTERACTIONS
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.dragPan.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();
        map.addControl(scale, "bottom-left");

        //MAP ATTRIBUTIONS
        const attributions = [
            '<a href="https://openstreetmap.org">OpenStreetMap</a>',
            // '<a href="https://github.com/Moraine729/Toronto_Heat_Vulnerability">Github</a>',
            '<a href="https://open.toronto.ca/">City of Toronto </a>',
        ];
        const attributionString = attributions.join(", ");

        // MAP LOAD
        map.on("load", async function () {
            // STYLES
            map.addSource("protomaps", {
                type: "vector",
                url: "pmtiles://" + PMTILES_URL,
                attribution: attributionString,
                attributionControl: false,
            });
            protoLayers.forEach((e) => {
                map.addLayer(e);
            });

            // MASSING LAYER
            map.addSource("massing", {
                type: "vector",
                url: "pmtiles://" + MASSING_URL,
            });

            // FULL MASK LAYER
            map.addSource("full-mask", {
                type: "geojson",
                data: FullMask,
            });
            map.addLayer({
                id: "full-mask",
                type: "fill",
                source: "full-mask",
                paint: {
                    "fill-color": "white",
                    "fill-opacity": 0,
                },
            });

            // HEAT MAP LAYER

            map.addSource("heat-map", {
                type: "geojson",
                data: HeatMap,
            });

            map.addLayer({
                id: "heatmap",
                type: "heatmap",
                source: "heat-map",
                paint: {
                    "heatmap-weight": [
                        "interpolate",
                        ["linear"],
                        ["get", "VALUE"],
                        48,
                        0, // Minimum value
                        58,
                        1, // Maximum value
                    ],
                    "heatmap-intensity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        10,
                        1,
                        15,
                        2,
                    ],
                    "heatmap-radius": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        10,
                        25,
                        15,
                        40,
                    ],
                    "heatmap-opacity": 0,
                    "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0,
                        "rgba(33,102,172,0)",
                        0.2,
                        "rgba(103,169,207,100)",
                        0.4,
                        "rgba(209,229,240,100)",
                        0.6,
                        "rgba(253,219,199,100)",
                        0.8,
                        "rgb(239,138,98)",
                        1,
                        "rgb(178,24,43)",
                    ],
                },
            });

            // // FAR LAYER
            // map.addSource("far", {
            //     type: "vector",
            //     url: "pmtiles://" + FAR_URL,
            // });
            // // FAR FILL
            // map.addLayer({
            //     id: "far-fill-layer",
            //     type: "fill",
            //     source: "far",
            //     "source-layer": "property_boundaries_dissolved_by_far_bucket",
            //     paint: {
            //         "fill-color": [
            //             "case",
            //             ["<", ["get", "far"], 0.5],
            //             "#f6eff7", // 0–0.50
            //             ["<", ["get", "far"], 1.0],
            //             "#bdc9e1", // 0.50–1.00
            //             ["<", ["get", "far"], 2.0],
            //             "#67a9cf", // 1.00–2.00
            //             ["<", ["get", "far"], 5.0],
            //             "#1c9099", // 2.00–5.00
            //             "#016c59", // 5.00+
            //         ],
            //         "fill-opacity": 1,
            //     },
            // });

            // ALL PARKING LAYER
            map.addSource("parking", {
                type: "vector",
                url: "pmtiles://" + PARKING_URL,
            });
            // PARKING FILL
            map.addLayer({
                id: "parking-fill-layer",
                type: "fill",
                source: "parking",
                "source-layer": "parkinglotarea",
                paint: {
                    "fill-color": "black",
                    "fill-opacity": 1,
                },
            });
            // PARKING OUTLINE
            // map.addLayer({
            //     id: "parking-line-layer",
            //     type: "line",
            //     source: "parking",
            //     "source-layer": "parkinglotarea",
            //     paint: {
            //         "line-color": "WHITE",
            //         "line-width": 1,
            //         "line-dasharray": [2, 2], // This creates a dotted line
            //     },
            // });

            // TORONTO NEGATIVE OUTLINE LAYER
            map.addSource("negative-mask", {
                type: "geojson",
                data: NegativeMask,
            });

            map.addLayer({
                id: "negative-mask",
                type: "fill",
                source: "negative-mask",
                paint: {
                    "fill-color": "white",
                    "fill-opacity": 0.7,
                },
            });

            map.addLayer({
                id: "negative-mask-line",
                type: "line",
                source: "negative-mask",
                paint: {
                    "line-color": "grey",
                    "line-width": 0.5,
                    "line-opacity": 0,
                },
            });

            //SUBWAY LAYERS

            // SUBWAY BUFFER LOTS
            map.addSource("subway-tiles", {
                type: "vector",
                url: "pmtiles://" + SUBWAYTILE_URL,
            });
            // SUBWAY LOT FILL
            map.addLayer({
                id: "subway-tiles-layer",
                type: "fill",
                source: "subway-tiles",
                "source-layer": "subway1kmlotarea",
                paint: {
                    "fill-color": "#000000",
                    "fill-opacity": 0,
                },
            });

            map.addSource("subway-stations", {
                type: "geojson",
                data: SubwayStations,
            });
            map.addLayer({
                id: "subway-stations-layer",
                type: "circle",
                source: "subway-stations",
                paint: {
                    "circle-color": "white",
                    "circle-stroke-color": "black",
                    "circle-stroke-width": 1,
                    "circle-radius": 2,
                    "circle-opacity": 0,
                    "circle-stroke-opacity": 0,
                },
            });

            map.addSource("subway-buffer-all", {
                type: "geojson",
                data: SubwayBufferAll,
            });
            map.addLayer({
                id: "subway-buffer-all-layer",
                type: "line",
                source: "subway-buffer-all",
                paint: {
                    "line-color": "black",
                    "line-width": 1,
                    "line-opacity": 0,
                },
            });

            map.addSource("subway-buffer", {
                type: "geojson",
                data: SubwayBuffer,
            });
            map.addLayer({
                id: "subway-buffer-layer",
                type: "line",
                source: "subway-buffer",
                paint: {
                    "line-color": "grey",
                    "line-width": 0.4,
                    "line-opacity": 0,
                },
            });

            map.addSource("subway-buffer-mask", {
                type: "geojson",
                data: SubwayBufferMask,
            });

            map.addLayer({
                id: "subway-buffer-mask-layer",
                type: "fill",
                source: "subway-buffer-mask",
                paint: {
                    "fill-color": "rgba(255,255,255,0.6)",
                    "fill-opacity": 0,
                },
            });

            map.addLayer({
                id: "subway-buffer-mask-line",
                type: "line",
                source: "subway-buffer-mask",
                paint: {
                    "line-color": "black",
                    "line-width": 1,
                    "line-opacity": 0,
                },
            });

            map.addSource("subway-top-ten", {
                type: "geojson",
                data: SubwayTopTen,
            });

            map.addLayer({
                id: "subway-top-ten-layer",
                type: "line",
                source: "subway-top-ten",
                paint: {
                    "line-color": "black",
                    "line-width": 1,
                    "line-opacity": 0,
                },
            });

            map.addSource("subwway-top-ten-points", {
                type: "geojson",
                data: SubwayTopTenPoints,
            });

            map.addLayer({
                id: "subway-top-ten-points-layer",
                type: "circle",
                source: "subwway-top-ten-points",
                paint: {
                    "circle-color": "blue",
                    "circle-radius": 3,
                    "circle-opacity": 0,
                },
            });

            map.addSource("subway-top-ten-lots", {
                type: "geojson",
                data: SubwayTopTenLots,
            });

            map.addlayer({
                id: "subway-top-ten-lots-layer",
                type: "fill",
                source: "subway-top-ten-lots",
                paint: {
                    "fill-color": "black",
                    "fill-opacity": 1,
                },
            });

            // SITE LAYERS
            map.addSource("sherbourne-405", {
                type: "geojson",
                data: Sherbourne405,
            });
            map.addLayer({
                id: "sherbourne-405-layer",
                type: "fill",
                source: "sherbourne-405",
                paint: {
                    "fill-color": "black",
                    "fill-opacity": 0,
                },
            });

            map.addSource("amroth-72", {
                type: "geojson",
                data: Amroth72,
            });
            map.addLayer({
                id: "amroth-72-layer",
                type: "line",
                source: "amroth-72",
                paint: {
                    "line-color": "black",
                    "line-width": 1,
                    "line-dasharray": [2, 3],
                    "line-opacity": 0,
                },
            });

            map.addSource("wilson-50", {
                type: "geojson",
                data: Wilson50,
            });
            map.addLayer({
                id: "wilson-50-layer",
                type: "fill",
                source: "wilson-50",
                paint: {
                    "fill-color": "red",
                    "fill-opacity": 0,
                },
            });

            //LOT REVENUE LAYER
            map.addSource("green-p", {
                type: "geojson",
                data: GreenPStats,
            });

            map.addLayer({
                id: "green-p-layer",
                type: "circle",
                source: "green-p",
                paint: {
                    "circle-color": [
                        "interpolate",
                        ["linear"],
                        ["get", "revenue_per_space_per_day"],
                        0,
                        "red", // Minimum value color
                        20,
                        "green", // Maximum value color
                    ],
                    "circle-radius": 5, // Fixed radius for all points
                    "circle-stroke-color": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        "black",
                        "black",
                    ],
                    "circle-stroke-width": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        2,
                        0.5,
                    ],
                    "circle-opacity": 1,
                    "circle-stroke-opacity": 0,
                },
            });

            // POPUP HOVER LOT REVENUE
            popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
            });

            // HOVER LOT REVENUE
            map.on("mousemove", "green-p-layer", (e) => {
                if (e.features.length > 0) {
                    if (hoveredStateId !== null) {
                        map.setFeatureState(
                            { source: "lot-revenue", id: hoveredStateId },
                            { hover: false },
                        );
                    }
                    hoveredStateId = e.features[0].id;
                    map.setFeatureState(
                        { source: "lot-revenue", id: hoveredStateId },
                        { hover: true },
                    );

                    const coordinates =
                        e.features[0].geometry.coordinates.slice();
                    const revenue =
                        e.features[0].properties.revenue_per_space_per_day;

                    popup
                        .setLngLat(coordinates)
                        .setHTML(`Revenue per space per day: $${revenue}`)
                        .addTo(map);
                }
            });

            map.on("mouseleave", "green-p-layer", () => {
                if (hoveredStateId !== null) {
                    map.setFeatureState(
                        { source: "lot-revenue", id: hoveredStateId },
                        { hover: false },
                    );
                }
                popup.remove();
            });
        });

        // MAP POSITION
        map.on("move", () => {
            const center = map.getCenter(); // Returns a LngLat object
            const zoom = map.getZoom();
            const bearing = map.getBearing();
            const pitch = map.getPitch();

            console.log("Map position:", {
                center: {
                    lng: center.lng.toFixed(6),
                    lat: center.lat.toFixed(6),
                },
                zoom: zoom.toFixed(2),
                bearing: bearing.toFixed(2),
                pitch: pitch.toFixed(2),
            });
        });

        // SCROLL LISTENER
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    });

    // MAP UPDATE
    const updateMap = (section) => {
        switch (section) {
            case 0:
                fillLayerOn("parking-fill-layer");
                lineLayerOn("negative-mask-line");
                heatmapLayerOff("heatmap");
                break;

            case 1:
                heatmapLayerOn("heatmap");
                break;

            case 2:
                heatmapLayerOff("heatmap");
                // fillLayerOff("parking-fill-layer");

                fillLayerOff("subway-tiles-layer");

                lineLayerOff("subway-buffer-layer");

                fillLayerOff("subway-buffer-mask-layer");
                lineLayerOff("subway-buffer-mask-line");

                break;

            case 3:
                // map.flyTo({
                //     center: [-79.312848, 43.7344],
                //     speed: 0.5,
                //     zoom: 10.8,
                //     easing: (t) => t,
                //     essential: true,
                // });

                fillLayerOff("parking-fill-layer");
                fillLayerOn("subway-tiles-layer");

                fillLayerOn("subway-buffer-mask-layer");
                lineLayerOn("subway-buffer-mask-line");
                lineLayerOn("subway-buffer-layer");

                fillLayerOff("wilson-50-layer");

                circleLayerOff("subway-top-ten-points-layer");
                lineLayerOff("subway-top-ten-layer");
                fillLayerOff("subway-top-ten-lots-layer");

                break;

            case 4:
                fillLayerOff("subway-tiles-layer");
                lineLayerOff("subway-buffer-mask-line");
                lineLayerOff("subway-buffer-layer");

                circleLayerOn("subway-top-ten-points-layer");

                lineLayerOn("subway-top-ten-layer");
                fillLayerOn("subway-top-ten-lots-layer");
                break;

            case 5:
                circleLayerOff("subway-top-ten-points-layer");
                lineLayerOff("subway-top-ten-layer");
                fillLayerOff("subway-top-ten-lots-layer");

                circleLayerOn("green-p-layer");

                // fillLayerOn("parking-fill-layer");

                lineLayerOff("subway-buffer-layer");

                fillLayerOff("subway-buffer-mask-layer");
                lineLayerOff("subway-buffer-mask-line");
                break;

            case 6:
                fillLayerOff("subway-tiles-layer");

                fillLayerOff("subway-buffer-mask-layer");
                lineLayerOff("subway-buffer-mask-line");
                lineLayerOff("subway-buffer-layer");

                // 50 Wilson Heights Boulevard

                fillLayerOn("wilson-50-layer");
                // map.flyTo({
                //     center: [-79.4488561, 43.7352016],
                //     speed: 2,
                //     zoom: 17,
                //     easing: (t) => t,
                //     essential: true,
                // });

                break;

            case 7:
                fillLayerOff("wilson-50-layer");
                // map.flyTo({
                //     center: [-79.360512, 43.712544],
                //     speed: 3,
                //     zoom: 9.9,
                //     easing: (t) => t,
                //     essential: true,
                // });

                lineLayerOff("amroth-72-layer");
                fillLayerOff("sherbourne-405-layer");

                break;
            case 8:
                // 72 Amroth Avenue
                fillLayerOff("sherbourne-405-layer");
                fillLayerOff("wilson-50-layer");
                lineLayerOn("amroth-72-layer");

                // map.flyTo({
                //     center: [-79.311815, 43.685194],
                //     speed: 2,
                //     zoom: 17,
                //     easing: (t) => t,
                //     essential: true,
                // });
                break;

            case 9:
                // 405 Sherbourne Street
                // map.flyTo({
                //     center: [-79.373133, 43.664439],
                //     speed: 2,
                //     zoom: 17,
                //     easing: (t) => t,
                //     essential: true,
                //     pitch: 0,
                //     bearing: -17,
                // });

                lineLayerOff("amroth-72-layer");
                fillLayerOn("sherbourne-405-layer");

                map.removeLayer("massing-layer");

                break;
        }
    };
</script>

<svelte:head>
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1, minimum-scale=1"
    />
    <script
        src="https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.js"
    ></script>
</svelte:head>

<Top />

<div class="banner">
    <div class="title">
        <h1>From Parking Spaces to Living Spaces</h1>
        <h3>
            Why Toronto Should Turn Surface Parking into Homes and Public Spaces
        </h3>
    </div>
</div>

<!-- <div class="intro-text">
    <h3>Introduction</h3>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p>
    </p>
</div> -->

<div class="map-container" id="map"></div>

<section class="content">
    <div class="right">
        <div class="section">
            <div class="text">
                <h3>Toronto is 9% Surface Parking</h3>
                <p>
                    Across the city, surface parking lots cover more than 9% of
                    Toronto's land area. These underutilized spaces represent a
                    significant portion of the urban landscape, often
                    contributing little to the vitality or livability of the
                    surrounding neighborhoods.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Paved Surfaces Drive Urban Heat</h3>
                <p>
                    This heatmap reveals how paved surfaces, like parking lots,
                    intensify urban heat. Darker reds highlight areas where
                    asphalt absorbs and radiates more heat, raising local
                    temperatures and exacerbating the <strong
                        >urban heat island</strong
                    > effect for neighbourhing communities.
                </p>
                <p>
                    This underscores the need for <strong
                        >parks over pavement.</strong
                    >
                </p>
                <div class="heatmap-scale">
                    <svg width="300" height="50">
                        <!-- Gradient definition -->
                        <defs>
                            <linearGradient
                                id="heatmap-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stop-color="rgba(33,102,172,0)"
                                />
                                <stop
                                    offset="20%"
                                    stop-color="rgba(103,169,207,1)"
                                />
                                <stop
                                    offset="40%"
                                    stop-color="rgba(209,229,240,1)"
                                />
                                <stop
                                    offset="60%"
                                    stop-color="rgba(253,219,199,1)"
                                />
                                <stop
                                    offset="80%"
                                    stop-color="rgb(239,138,98)"
                                />
                                <stop
                                    offset="100%"
                                    stop-color="rgb(178,24,43)"
                                />
                            </linearGradient>
                        </defs>

                        <!-- Rectangle filled with gradient -->
                        <rect
                            x="0"
                            y="10"
                            width="300"
                            height="20"
                            fill="url(#heatmap-gradient)"
                            stroke="grey"
                            stroke-width="1"
                        />

                        <!-- Labels -->
                        <text x="0" y="45" font-size="12" fill="black"
                            >&lt; 48°C</text
                        >
                        <text
                            x="140"
                            y="45"
                            font-size="12"
                            fill="black"
                            text-anchor="middle">53°C</text
                        >
                        <text
                            x="300"
                            y="45"
                            font-size="12"
                            fill="black"
                            text-anchor="end">58°C &lt;</text
                        >
                    </svg>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Surface Parking, Heat, and Low Density Go Hand in Hand</h3>
                <p>
                    Areas with extensive surface parking and higher urban heat
                    often correspond to <strong
                        >low Floor Area Ratios (FAR)</strong
                    > — indicating lower built density. These underutilized zones
                    prioritize above-ground car storage over housing, green space,
                    or community uses.
                </p>
                <p>
                    In addition to the cooling these spaces, they represent a
                    significant <strong
                        >opportunity to introduce much needed housing</strong
                    > across the city.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Unlocking Housing Potential Near Transit</h3>
                <p>
                    Many large surface parking lots sit within walking distance
                    of TTC subway stations, occupying land that could support
                    vibrant, transit-connected communities.
                </p>
                <p>
                    While some of these lots serve as "park and ride"
                    facilities, replacing them with housing and mixed-use
                    development offers greater long-term benefits—reducing car
                    dependency, increasing access to transit-oriented housing,
                    and creating more walkable, sustainable neighborhoods.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>
                    The TTC Stations with the Most Surface Parking Within 1 km
                </h3>
                <p>
                    These are the top 5 TTC subway stations with the largest
                    amount of surface parking within 1 km.
                </p>
                <p>
                    These areas represent some of the greatest opportunities to
                    transform underutilized land into new housing, community
                    spaces, and amenities—right next to high-capacity transit.
                </p>
                <p>
                    By rethinking these spaces, we can build denser, more
                    connected neighborhoods that support a growing Toronto.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Green P Lots: Public Land, Public Opportunity</h3>
                <p>
                    Toronto’s Green P parking lots are publicly owned, giving
                    the city a unique opportunity to lead by example. These
                    sites can act as catalysts for change, transforming
                    underutilized land into affordable housing, community
                    spaces, and market rate housing developments.
                </p>

                <p>
                    By leveraging public land for public benefit, the city can
                    help address housing needs and create more sustainable,
                    people-centered neighborhoods.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Green P Lots: For What its Worth</h3>
                <p>
                    Many Green P parking lots generate only modest
                    revenue—measured by revenue per parking space per day, the
                    return on this land is often low, especially compared to its
                    development potential.
                </p>
                <p>
                    Redeveloping these sites into housing and mixed-use projects
                    would significantly increase their economic productivity
                    through higher property tax revenues, development charges,
                    and community benefits contributions.
                </p>
                <p>
                    Transforming these underperforming assets isn’t just about
                    land use—it’s a smarter financial strategy for the city.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Enter CreateTO</h3>
                <p>
                    CreateTO is the City of Toronto’s real estate agency, tasked
                    with managing and transforming public lands for the public
                    good. Their mandate includes turning underused city-owned
                    sites—like Green P parking lots and surplus lands—into
                    housing, community spaces, and mixed-use developments. As a
                    catalyst for change, CreateTO plays a key role in delivering
                    affordable housing, supporting transit-oriented development,
                    and building a more inclusive and sustainable Toronto.
                </p>
                <p>
                    Here are some projects that CreateTO has undertaken to lead
                    the transformation of parking spaces to living spaces by
                    example.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>CreateTO: 405 Sherbourne Street</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <div class="section">
            <div class="">
                <h3>CreateTO: 72 Amroth Avenue</h3>
                <p>The Missing Middle</p>
                <img src={AmrothIsoLot} alt="" class="" />
                <img src={AmrothIsoBldg} alt="" class="" />
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>
                    Beyond Public Land: Unlocking Private Surface Parking Lots
                </h3>
                <p>
                    In addition to city-owned sites, there are numerous
                    privately owned surface parking lots across Toronto that
                    represent untapped potential. With the right policies,
                    incentives, and partnerships, the city can encourage private
                    landowners to redevelop these underutilized spaces into
                    housing, parks, and vibrant community amenities.
                    Transforming these sites can help address the housing
                    crisis, reduce the urban heat island effect, and create more
                    complete, livable neighborhoods.
                </p>
            </div>
        </div>

        <!-- Case 6 -->
        <div class="section">
            <div class="">
                <h3>CreateTO: 50 Wilson Heights Boulevard</h3>
                <p>Lorem Ipsum</p>
                <div>
                    <div>
                        <img src={WilsonIsoLot} alt="" class="" />
                        <img src={WilsonIsoBldg} alt="" class="" />
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
            </div>
            <div class="sub-section">
                <p>Lorem Ipsum</p>
            </div>
            <div class="sub-section">
                <p>Lorem Ipsum</p>
            </div>
            <div class="sub-section">
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 10 -->
        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 11 -->
        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>
    </div>
</section>

<style>
    .banner {
        height: 100vh;
        /* width:600px; */
        background-image: url("toronto-1978.jpg");
        background-size: cover;
        margin: 0 auto;
    }

    .banner::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0); /* Adjust the opacity as needed */
        z-index: 1;
    }

    .title h1 {
        text-align: center;
        color: white;
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
    }
    .title h3 {
        text-align: center;
        color: white;
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
    }

    .intro-text {
        width: 600px;
        margin: 0 auto;
        text-align: center;
        /* height: 100vh; */
    }

    .map-container {
        position: sticky;
        top: 0;
        height: 100vh;
        width: 100%;
    }

    .content {
        pointer-events: none;
    }

    .section {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        z-index: 1000;
    }

    .center {
        display: flex;
        justify-content: center;
    }

    .right {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
    }

    img {
        height: 500px;
        background-color: rgba(255, 255, 255, 1);
        outline: 1px solid rgba(0, 0, 0, 0.6);
    }

    .text {
        text-align: center;
        background-color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(0, 0, 0, 0.7);
        margin: 30px;
        padding: 0 20px 0;
        width: 30vw;
    }

    @media (max-width: 760px) {
        .map-container {
            height: 50vh;
            width: 100%;
            position: fixed;
            top: 0;
        }

        .content {
            position: static;
            top: 50vh;
            height: 50vh;
            width: 100%;
        }

        .text {
            padding-top: 50vh;
        }

        .section {
            min-height: 50vh;
        }

        .text {
            position: sticky;
            top: 50vh;
        }
    }
</style>
