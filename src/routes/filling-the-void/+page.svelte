<script>
    import Top from "$lib/TopSofC.svelte";

    import { onMount, onDestroy } from "svelte";
    import maplibregl from "maplibre-gl";
    import "../../assets/maplibre-gl.css";
    import * as pmtiles from "pmtiles";
    import BaseLayer from "../../data/toronto-filling-the-void.json";
    import { SkyDome, CNTower } from "../../data/3dModels.js";

    //GEOJSON
    import LotRevenue from "../../data/LotRevenue.geo.json";
    import TorontoOutline from "../../data/toronto-outline.geo.json";
    import NegativeMask from "../../data/city-mask.geo.json";
    import FullMask from "../../data/full-mask.geo.json";
    import GreenSpace from "../../data/green-space.geo.json";
    import Sherbourne405 from "../../data/405-sherbourne.geo.json";
    import Amroth72 from "../../data/72-amroth.geo.json";
    import Dundas1113 from "../../data/1113-1117-dundas.geo.json";

    //FUNCTIONS
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";

    //SVG
    import amrothIsoLot from "/src/assets/amroth-iso-lot.svg";
    import amrothIsoBldg from "/src/assets/amroth-iso-bldg.svg";

    const tweenStore = tweened(0, {
        duration: 200,
        easing: cubicOut,
    });

    let sections = [];
    let currentSection = 0;
    let ticking = false;

    let map;
    let popup;
    let hoveredStateId = null;

    let MASSING_URL =
        "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
    let PARKING_URL =
        "/underutilized-parking-lots-toronto/ParkingLotArea.pmtiles";
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";

    let scale = new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });

    let bearing = 0;
    const rotateAroundPoint = () => {
        bearing += 0.1; // Increment the bearing by a small value
        //   if (bearing >= 360) bearing = 0; // Reset bearing after a full rotation
        map.setBearing(bearing); // Update the map bearing
        requestAnimationFrame(rotateAroundPoint); // Continue the animation
    };

    // MAP
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

        // Disable all map interactions
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.dragPan.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();

        const attributions = [
            '<a href="https://openstreetmap.org">OpenStreetMap</a>',
            // '<a href="https://github.com/Moraine729/Toronto_Heat_Vulnerability">Github</a>',
            '<a href="https://open.toronto.ca/">City of Toronto </a>',
        ];

        const attributionString = attributions.join(", ");

        map.addControl(scale, "bottom-left");

        let protoLayers = BaseLayer;

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

            map.addSource("massing", {
                type: "vector",
                url: "pmtiles://" + MASSING_URL,
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

            map.addSource("dundas-1113", {
                type: "geojson",
                data: Dundas1113,
            });
            map.addLayer({
                id: "dundas-1113-layer",
                type: "fill",
                source: "dundas-1113",
                paint: {
                    "fill-color": "green",
                    "fill-opacity": 0,
                },
            });

            // LOT REVENUE LAYER
            map.addSource("lot-revenue", {
                type: "geojson",
                data: LotRevenue,
            });

            map.addLayer({
                id: "lot-revenue-layer",
                type: "circle",
                source: "lot-revenue",
                paint: {
                    "circle-color": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        "rgba(0, 0, 255, 0)",
                        "rgba(0, 0, 255, 0)",
                    ],
                    "circle-radius": [
                        "interpolate",
                        ["linear"],
                        ["get", "revenue_per_space_per_day"],
                        0,
                        5, // Minimum value and corresponding radius
                        58,
                        30, // Maximum value and corresponding radius
                    ],
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
                },
            });

            // POPUP HOVER LOT REVENUE
            popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
            });

            map.on("mousemove", "lot-revenue-layer", (e) => {
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

            map.on("mouseleave", "lot-revenue-layer", () => {
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

    // SCROLLER
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
    };

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

                map.setPaintProperty("parking-fill-layer", "fill-opacity", 1, {
                    duration: 100,
                });
                map.setPaintProperty("full-mask", "fill-opacity", 1, {
                    duration: 100,
                });
                break;

            case 1:
                map.setPaintProperty("parking-fill-layer", "fill-opacity", 0, {
                    duration: 100,
                });
                map.setPaintProperty("green-space", "fill-opacity", 0, {
                    duration: 100,
                });

                break;

            case 2:
                map.setPaintProperty("negative-mask", "fill-opacity", 1, {
                    duration: 100,
                });

                map.setPaintProperty("full-mask", "fill-opacity", 0, {
                    duration: 100,
                });

                map.removeLayer("massing-layer");
                map.removeLayer(CNTower);
                map.removeLayer(SkyDome);

                map.setPaintProperty("parking-fill-layer", "fill-opacity", 0, {
                    duration: 100,
                });

                // map.setPaintProperty("green-space", "fill-opacity", 1, {
                //         duration: 100,
                //     });
                break;

            case 3:
                // Downtown Toronto
                // map.easeTo({
                //     center: [-79.360512, 43.712544], // Keep the map center unchanged
                //     zoom: 13, // Maintain current zoom level
                //     bearing: map.getBearing() + 360, // Rotate the camera by 360 degrees
                //     pitch: 0, // Optional: Add some pitch for a dramatic effect
                //     duration: 1000, // Animation duration in milliseconds
                //     easing: (t) => t, // Linear easing function
                //     rotate: 360, // Rotate the camera by 360 degrees
                // });

                map.addLayer({
                    id: "massing-layer",
                    type: "fill-extrusion",
                    source: "massing",
                    "source-layer": "3DMassingToronto",
                    paint: {
                        "fill-extrusion-color": "white",
                        "fill-extrusion-opacity": 0.9,
                        "fill-extrusion-height": ["*", ["get", "height"], 1],
                    },
                });
                map.addLayer(CNTower);
                map.addLayer(SkyDome);

                map.setPaintProperty(
                    "sherbourne-405-layer",
                    "fill-opacity",
                    0,
                    {
                        duration: 100,
                        delay: 0,
                    },
                );
                break;

            case 4:
                // 405 Sherbourne Street
                map.removeLayer("massing-layer");
                map.removeLayer(CNTower);
                map.removeLayer(SkyDome);

                map.flyTo({
                    center: [-79.373133, 43.664439],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });
                map.setPaintProperty("amroth-72-layer", "line-opacity", 0, {
                    duration: 100,
                    delay: 0,
                });
                map.setPaintProperty(
                    "sherbourne-405-layer",
                    "fill-opacity",
                    1,
                    {
                        duration: 100,
                        delay: 0,
                    },
                );

                break;
            case 5:
                // 72 Amroth Avenue
                map.setPaintProperty(
                    "sherbourne-405-layer",
                    "fill-opacity",
                    0,
                    {
                        duration: 100,
                        delay: 0,
                    },
                );
                map.setPaintProperty("amroth-72-layer", "line-opacity", 1, {
                    duration: 100,
                    delay: 0,
                });

                map.setPaintProperty("dundas-1113-layer", "fill-opacity", 0, {
                    duration: 100,
                    delay: 0,
                });

                map.flyTo({
                    center: [-79.311815, 43.685194],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });
                break;

            case 6:
                // 1113-1117 Dundas Street West
                map.setPaintProperty("amroth-72-layer", "line-opacity", 0, {
                    duration: 100,
                    delay: 0,
                });
                map.setPaintProperty("dundas-1113-layer", "fill-opacity", 1, {
                    duration: 100,
                    delay: 0,
                });
                map.flyTo({
                    center: [-79.419855, 43.649093],
                    speed: 2,
                    zoom: 17,
                    easing: (t) => t,
                    essential: true,
                });
                break;

            case 7:
                map.setPaintProperty("dundas-1113-layer", "fill-opacity", 0, {
                    duration: 100,
                    delay: 0,
                });
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

<main>
    <div class="container">
        <div class="map">
            <div class="map-container" id="map"></div>
        </div>
        <div class="content">
            <section>
                <div class="text">
                    <div class="section">
                        <div class="sub-section-title">
                            <div class="title">
                                <h1>Filling the Void</h1>
                                <h3>
                                    What can we do with underutilized surface
                                    parking in Toronto?
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="sub-section-title">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <div class="section">
                        <div class="sub-section-title">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <div class="section">
                        <div class="sub-section-title">
                            <h3>The Problem for People:</h3>
                            <p>
                                Toronto's dense downtown urban neighbourhoods
                                are punctured with surface parking, creating
                                voids in otherwise dense and lively urban
                                places.
                            </p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="sub-section-title">
                            <h3>CreateTO: 405 Sherbourne Street</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="sub-section-title">
                            <h3>CreateTO: 72 Amroth Avenue</h3>
                            <p>The Missing Middle</p>
                            <img class="first-img" src={amrothIsoLot} alt="" />
                            <img src={amrothIsoBldg} alt="" />
                        </div>
                    </div>
                    <div class="section">
                        <div class="sub-section-title">
                            <h3>CreateTO: 1113-1117 Dundas Street West</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <div class="section">
                        <div class="sub-section-title">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>

                    <div class="section">
                        <div class="sub-section-title">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="sub-section-title">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
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
                    <div class="section">
                        <div class="sub-section-title">
                            <h3>Lorem Ipsum</h3>
                            <p>Lorem Ipsum</p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="sub-section-title">
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
    .title {
        text-align: center;
        min-height: 100vh;
    }

    .map-container {
        position: fixed;
        /* top: 15vh; */
        bottom: 0;
        left: 0;
        width: 50vw;
        height: 100vh;
        outline: 0.5px solid grey; /* Add this line for the outline */
    }

    .section {
        min-height: 100vh;
    }

    .sub-section-title {
    }

    .content {
        position: static;
        float: right;
        left: calc(50% + 10px);
        width: calc(50% - 40px); /* Adjust width to account for margins */
        height: 100vh;
    }

    main {
        display: fixed;
        padding-top: 20px;
        font-family: Arial, sans-serif;
        /* background-color: rgb(31,31,31); */
    }

    @media (max-width: 760px) {
        .map-container {
            height: 50vh; /* Map takes up the top half */
            width: 100%;
            position: fixed;
            top: 0;
        }

        .content {
            position: static;
            top: 50vh; /* Content starts from the bottom half */
            height: 50vh;
            width: 100%;
        }

        .text {
            padding-top: 50vh;
        }

        .section {
            min-height: 50vh;
        }
    }
</style>
