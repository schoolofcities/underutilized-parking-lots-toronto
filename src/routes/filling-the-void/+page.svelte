<script>
    import Top from "$lib/TopSofC.svelte";
    import { onMount } from "svelte";
    import maplibregl from "maplibre-gl";
    import "../../assets/maplibre-gl.css";
    // import "../../assets/styles.css";
    import * as pmtiles from "pmtiles";
    import BaseLayer from "../../data/toronto-filling-the-void.json";

    //GENERAL
    // import LotRevenue from "../../data/LotRevenue.geo.json";
    import TorontoOutline from "../../data/toronto-outline.geo.json";
    import NegativeMask from "../../data/city-mask.geo.json";
    import FullMask from "../../data/full-mask.geo.json";
    import GreenSpace from "../../data/green-space.geo.json";

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

    //SITES
    import Sherbourne405 from "../../data/405-sherbourne.geo.json";
    import Amroth72 from "../../data/72-amroth.geo.json";
    import Wilson50 from "../../data/50-wilson.geo.json";

    //SVG
    import AmrothIsoLot from "/src/assets/amroth-iso-lot.svg";
    import AmrothIsoBldg from "/src/assets/amroth-iso-bldg.svg";

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

        //CLIP-PATH
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const containerTop =
            container.getBoundingClientRect().top + scrollPosition;
        const containerHeight = container.offsetHeight;
        const start = containerTop - windowHeight;
        const end = containerTop + containerHeight;

        if (scrollPosition >= start && scrollPosition <= end) {
            const progress = (scrollPosition - start) / (end - start);
            console.log("progress:", progress);

            const clipValue = Math.min(100, Math.max(0, progress * 100));
            console.log("clipValue:", clipValue);

            container.querySelector(".clip-image:nth-child(2)").style.clipPath =
                `polygon(0 ${100 - clipValue}%, 100% ${100 - clipValue}%, 100% 100%, 0 100%)`;
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
            center: [-79.360512, 43.712544],
            zoom: 9.9,
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
        map.on("load", function () {
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
                    "fill-opacity": 1,
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
                    "fill-color": "rgba(36,36,36, 1)",
                    "fill-opacity": 1,
                },
            });
            map.addLayer({
                id: "negative-mask-line",
                type: "line",
                source: "negative-mask",
                paint: {
                    "line-color": "black",
                    "line-width": 1,
                },
            });

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
                    "fill-color": "rgba(36,36,36, 1)",
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
                    "fill-opacity": 1,
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
                    "fill-color": "green",
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
                        58,
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
            // map.on("mousemove", "green-p-layer", (e) => {
            //     if (e.features.length > 0) {
            //         if (hoveredStateId !== null) {
            //             map.setFeatureState(
            //                 { source: "lot-revenue", id: hoveredStateId },
            //                 { hover: false },
            //             );
            //         }
            //         hoveredStateId = e.features[0].id;
            //         map.setFeatureState(
            //             { source: "lot-revenue", id: hoveredStateId },
            //             { hover: true },
            //         );

            //         const coordinates =
            //             e.features[0].geometry.coordinates.slice();
            //         const revenue =
            //             e.features[0].properties.revenue_per_space_per_day;

            //         popup
            //             .setLngLat(coordinates)
            //             .setHTML(`Revenue per space per day: $${revenue}`)
            //             .addTo(map);
            //     }
            // });

            // map.on("mouseleave", "green-p-layer", () => {
            //     if (hoveredStateId !== null) {
            //         map.setFeatureState(
            //             { source: "lot-revenue", id: hoveredStateId },
            //             { hover: false },
            //         );
            //     }
            //     popup.remove();
            // });
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
                    center: [-79.360512, 43.712544],
                    speed: 3,
                    zoom: 9.9,
                    easing: (t) => t,
                    essential: true,
                });

                fillLayerOn("parking-fill-layer");
                fillLayerOn("full-mask");

                circleLayerOff("subway-stations-layer");

                break;

            case 1:

                fillLayerOn("parking-fill-layer");

                fillLayerOff("green-space");
                fillLayerOn("negative-mask");
                fillLayerOff("full-mask");
                fillLayerOff("subway-tiles-layer");

                circleLayerOn("subway-stations-layer");
                circleStrokeLayerOn("subway-stations-layer");
                lineLayerOff("subway-buffer-layer");
                lineLayerOff("subway-buffer-all-layer");

                break;

            case 2:
            map.flyTo({
                    center: [-79.360512, 43.712544],
                    // speed: 3,
                    zoom: 10.4,

                    easing: (t) => t,
                    essential: true,
                });


                fillLayerOff("parking-fill-layer");

                fillLayerOn("subway-tiles-layer");

                lineLayerOn("subway-buffer-all-layer");
                lineLayerOn("subway-buffer-layer");

                break;

            case 3:
                fillLayerOff("sherbourne-405-layer");
                break;

            case 4:
                // 50 Wilson Heights Boulevard
                lineLayerOff("amroth-72-layer");
                fillLayerOn("wilson-50-layer");
                map.flyTo({
                    center: [-79.4488561, 43.7352016],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });

                break;
            case 5:
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

            case 6:
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

            case 7:
                fillLayerOff("wilson-50-layer");

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

<!-- <Top /> -->

<main>
    <div class="container">
        <div class="map">
            <div class="map-container" id="map"></div>
        </div>
        <div class="content">
            <section>
                <div class="text">
                    <!-- Case 0 -->
                    <div class="section">
                        <div class="sticky">
                            <div class="title">
                                <h1>Filling the Void</h1>
                                <h3>
                                    What can we do with underutilized surface
                                    parking in Toronto?
                                </h3>
                                <p>Scroll to find out!</p>
                            </div>
                        </div>
                    </div>

                    <!-- Case 1 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <!-- Case 2 -->
                    <div class="section">
                        <div class="sticky">
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
                        <div class="sticky">
                            <h3>The Problem for People:</h3>
                            <p>
                                Toronto's dense downtown urban neighbourhoods
                                are punctured with surface parking, creating
                                voids in otherwise dense and lively urban
                                places.
                            </p>
                        </div>
                    </div>

                    <!-- Case 4 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>CreateTO: 405 Sherbourne Street</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <!-- Case 5 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>CreateTO: 72 Amroth Avenue</h3>
                            <p>The Missing Middle</p>
                            <div>
                                <div
                                    bind:this={container}
                                    class="clip-container"
                                >
                                    <img
                                        src={AmrothIsoLot}
                                        alt=""
                                        class="clip-image"
                                    />
                                    <img
                                        src={AmrothIsoBldg}
                                        alt=""
                                        class="clip-image"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Case 6 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>CreateTO: 50 Wilson Heights Boulevard</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <!-- Case 7 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <!-- Case 8 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <!-- Case 9 -->
                    <div class="section">
                        <div class="sticky">
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
                        <div class="sticky">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <!-- Case 11 -->
                    <div class="section">
                        <div class="sticky">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</main>

<style>
    .sticky {
        position: sticky;
        /* top: 60px; */
        height: auto;
    }

    .clip-container {
        /* position: relative;
        overflow: hidden;
        height: 100vw;
        top:10px; */
    }

    .clip-image {
        position: absolute;
        top: 100px;
        max-width: 600px;
        object-fit: cover;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }

    .clip-image:nth-child(2) {
        clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
    }

    .title {
        text-align: center;
        min-height: 100vh;
    }

    .map-container {
        position: fixed;
        /* top: 50px; */
        bottom: 0;
        left: 0;
        width: 50vw;
        height: 100vh;
        outline: 0.5px solid grey;
        z-index: 1000;
    }

    .section {
        height: 100vh;
        position: sticky;
    }

    .content {
        position: static;
        float: right;
        left: calc(50% + 10px);
        width: calc(50% - 40px);
        height: 100vh;
    }

    main {
        display: relative;
        font-family: Arial, sans-serif;
        /* background-color: rgb(31,31,31); */
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
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

        .sticky {
            position: sticky;
            top: 50vh;
        }
    }
</style>
