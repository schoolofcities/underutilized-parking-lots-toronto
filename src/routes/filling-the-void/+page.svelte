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
    import GreenSpace from "../../data/green-space.geo.json";
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
    let PARKING_URL =
        "/underutilized-parking-lots-toronto/ParkingLotArea.pmtiles";
    let SUBWAYTILE_URL =
        "/underutilized-parking-lots-toronto/SubwayBufferParkingLot.pmtiles";
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";

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

    // Import SVGs using `import.meta.glob()`
    const svgs = import.meta.glob("/src/assets/subway-lots/*.svg", {
        eager: true,
        as: "raw",
    });

    let svgFiles = Object.values(svgs);
    let svgContainer;

    //MOUNT
    onMount(async () => {
        const svgElements = svgContainer.querySelectorAll("svg");
        svgElements.forEach((svg) => {
            svg.setAttribute("viewBox", "0 0 2500 2500");
            svg.style.width = "200px";
            svg.style.height = "200px";
        });

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

            // TORONTO OUTLINE LAYER
            // map.addsource("toronto-outline", {
            //     type: "geojson",
            //     data: TorontoOutline,
            // });

            // map.addLayer({
            //     id: "toronto-outline",
            //     type: "line",
            //     source: "toronto-outline",
            //     paint: {
            //         "line-color": "white",
            //         "line-width": 10,
            //     },
            // });

            // PATTERN FILL CODE

            // const image = await map.loadImage('./transparent-pattern.png');

            // map.addImage('pattern', image.data);

            // map.addLayer({
            //     id: "negative-mask-layer",
            //     type: "fill",
            //     source: "negative-mask",
            //     paint: {
            //         "fill-pattern": "pattern",
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

            // GREEN SPACE LAYER
            map.addSource("green-space", {
                type: "geojson",
                data: GreenSpace,
            });
            map.addLayer({
                id: "green-space",
                type: "fill",
                source: "green-space",
                paint: {
                    "fill-color": "green",
                    "fill-opacity": 0,
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
                    "circle-opacity": 0,
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
                map.flyTo({
                    center: [-79.274129, 43.732392],
                    zoom: 10.5,
                    speed: 1.5,
                    easing: (t) => t,
                    essential: true,
                });

                fillLayerOn("parking-fill-layer");
                lineLayerOn("negative-mask-line");

                fillLayerOff("full-mask");
                heatmapLayerOff("heatmap");
                break;

            case 1:
                heatmapLayerOn("heatmap");

                break;

            case 2:
                fillLayerOff("full-mask");
                heatmapLayerOff("heatmap");
                fillLayerOff("parking-fill-layer");

                circleLayerOff("green-p-layer");

                break;

            case 3:
                circleLayerOn("green-p-layer");
                break;

            case 4:
                circleLayerOff("green-p-layer");

                fillLayerOn("parking-fill-layer");

                fillLayerOff("subway-tiles-layer");

                lineLayerOff("subway-buffer-layer");

                fillLayerOff("subway-buffer-mask-layer");
                lineLayerOff("subway-buffer-mask-line");

                break;

            case 5:
                map.flyTo({
                    center: [-79.312848, 43.7344],
                    speed: 0.5,
                    zoom: 10.8,
                    easing: (t) => t,
                    essential: true,
                });

                fillLayerOff("parking-fill-layer");
                fillLayerOn("subway-tiles-layer");

                fillLayerOn("subway-buffer-mask-layer");
                lineLayerOn("subway-buffer-mask-line");
                lineLayerOn("subway-buffer-layer");

                fillLayerOff("wilson-50-layer");

                break;

            case 6:
                fillLayerOff("subway-tiles-layer");

                fillLayerOff("subway-buffer-mask-layer");
                lineLayerOff("subway-buffer-mask-line");
                lineLayerOff("subway-buffer-layer");

                // 50 Wilson Heights Boulevard

                fillLayerOn("wilson-50-layer");
                map.flyTo({
                    center: [-79.4488561, 43.7352016],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });

                break;

            case 7:
                fillLayerOff("wilson-50-layer");
                map.flyTo({
                    center: [-79.360512, 43.712544],
                    speed: 3,
                    zoom: 9.9,
                    easing: (t) => t,
                    essential: true,
                });

                lineLayerOff("amroth-72-layer");
                fillLayerOff("sherbourne-405-layer");

                break;
            case 8:
                // 72 Amroth Avenue
                fillLayerOff("sherbourne-405-layer");
                fillLayerOff("wilson-50-layer");
                lineLayerOn("amroth-72-layer");

                map.flyTo({
                    center: [-79.311815, 43.685194],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });
                break;

            case 9:
                // 405 Sherbourne Street
                map.flyTo({
                    center: [-79.373133, 43.664439],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });

                lineLayerOff("amroth-72-layer");
                fillLayerOn("sherbourne-405-layer");

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
                    The largest clusters are concentrated around heavily-paved
                    core employment areas.
                </p>
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
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 1 -->
        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 2 -->
        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
                <div class="grid">
                    <div class="grid" bind:this={svgContainer}>
                        {#each svgFiles as svg, i}
                            <div class="svg-cell">
                                {@html svg}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <!-- Case 3 -->
        <div class="section">
            <div class="text">
                <h3>The Problem for People:</h3>
                <p>
                    Toronto's dense downtown urban neighbourhoods are punctured
                    with surface parking, creating voids in otherwise dense and
                    lively urban places.
                </p>
            </div>
        </div>

        <!-- Case 4 -->
        <div class="section">
            <div class="text">
                <h3>CreateTO: 405 Sherbourne Street</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 5 -->
        <div class="section">
            <div class="">
                <h3>CreateTO: 72 Amroth Avenue</h3>
                <p>The Missing Middle</p>
                <img src={AmrothIsoLot} alt="" class="" />
                <img src={AmrothIsoBldg} alt="" class="" />
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

        <!-- Case 7 -->
        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 8 -->
        <div class="section">
            <div class="text">
                <h3>Lorem Ipsum</h3>
                <p>Lorem Ipsum</p>
            </div>
        </div>

        <!-- Case 9 -->
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


    .title h1{
        text-align: center;
        color: white;
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
    }
    .title h3{
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

    /* SUBWAY BUFFER GRID */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
    }
    .svg-cell {
        display: flex;
        justify-content: center;
        align-items: center;
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
