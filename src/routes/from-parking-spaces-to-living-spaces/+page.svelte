<script>
    import Top from "$lib/TopSofC.svelte";
    import { onMount } from "svelte";
    import maplibregl from "maplibre-gl";

    import "../../assets/maplibre-gl.css";
    import "../../assets/styles.css";

    import * as pmtiles from "pmtiles";
    import BaseLayer from "../../data/toronto-filling-the-void.json";
    import { sources, layers } from "$lib/mapLayers.js";

    //PNG
    import AmrothIsoBldg from "/src/assets/amroth-iso-bldg.png";
    import WilsonIsoBldg from "/src/assets/wilson-iso-bldg.png";
    import SherbourneIsoBldg from "/src/assets/sherbourne-iso-bldg.png";

    import RevenueLegend from "/src/assets/revenue-legend.svg";

    // BASE MAP TILES
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";

    //MAP INIT
    let map;
    let protoLayers = BaseLayer;
    let scale = new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });
    let activePopups = [];

    //LAYER TOGGLE OPACITY TRANSITIONS
    function toggleLayer(id, opacity, strokeOpacity = opacity) {
        const propertyMap = {
            fill: "fill-opacity",
            line: "line-opacity",
            heatmap: "heatmap-opacity",
            circle: "circle-opacity",
            "circle-stroke": "circle-stroke-opacity",
        };

        for (const [layerType, property] of Object.entries(propertyMap)) {
            try {
                if (property === "circle-stroke-opacity") {
                    map.setPaintProperty(id, property, strokeOpacity, {
                        duration: 100,
                    });
                } else {
                    map.setPaintProperty(id, property, opacity, {
                        duration: 100,
                    });
                }
            } catch (error) {
                console.error(
                    `Error setting opacity for layer ${id} (${property}):`,
                    error,
                );
            }
        }
    }

    //SECTION SCROLL
    let sections = [];
    let currentSection = 0;
    let ticking = false;

    let scrollPlacement = window.innerWidth < 1050 ? 0.6 : 0.5;

    const handleResize = () => {
        scrollPlacement = window.innerWidth < 1050 ? 0.6 : 0.5;
    };

    window.addEventListener("resize", handleResize);

    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                let newSection = currentSection;
                sections.forEach((section, index) => {
                    const rect = section.getBoundingClientRect();
                    if (
                        rect.top <= window.innerHeight * scrollPlacement &&
                        rect.bottom > window.innerHeight * scrollPlacement
                    ) {
                        newSection = index;
                    }
                });

                if (newSection !== currentSection) {
                    if (sections[currentSection]) {
                        sections[currentSection].style.opacity = "0.25";
                    }
                    if (sections[newSection]) {
                        sections[newSection].style.opacity = "1";
                    }
                    currentSection = newSection;
                    updateMap(currentSection);
                }

                ticking = false;
            });
            ticking = true;
        }

        // CONSOLE LOG SCROLL POSITION
        console.log("scrollPosition:", scrollPosition);
        console.log("windowHeight:", windowHeight);
        console.log("containerTop:", containerTop);
        console.log("containerHeight:", containerHeight);
        console.log("start:", start);
        console.log("end:", end);
    };

    let currentMapPosition = {
        center: [-79.361825, 43.718709],
        zoom: 10.7,
        bearing: -17,
        pitch: 0,
    };

    // MAP VIEW BASED ON SCREEN SIZE
    const updateMapView = () => {
        const screenWidth = window.innerWidth;

        const minScreenWidth = 320;
        const maxScreenWidth = 1920;

        let minZoom, maxZoom;

        if (screenWidth > 950) {
            minZoom = 8.9; // Adjusted minZoom for >950
            maxZoom = 10.7; // Adjusted maxZoom for >950
        } else {
            minZoom = 8.8; // Adjusted minZoom for <=950
            maxZoom = 12.1; // Adjusted maxZoom for <=950
        }

        // const minZoom = 8.9;
        // const maxZoom = 10.7;

        const zoom = Math.min(
            maxZoom,
            Math.max(
                minZoom,
                minZoom +
                    ((screenWidth - minScreenWidth) /
                        (maxScreenWidth - minScreenWidth)) *
                        (maxZoom - minZoom),
            ),
        );

        const center = [-79.361825, 43.718709];
        const bearing = -17;

        currentMapPosition = { center, zoom, bearing };

        if (![7, 8, 9].includes(currentSection)) {
            map.flyTo({
                center: center,
                zoom: zoom,
                bearing: bearing,
                duration: 0,
            });
        }
    };

    //MOUNT
    onMount(() => {
        let protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        sections = document.querySelectorAll(".section");
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", updateMapView);

        if (sections[0]) {
            sections[0].style.opacity = "1";
        }
        updateMap(0);

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
            bearing: -17,
            maxPitch: 0,
            projection: "globe",
            scrollZoom: true,
            attributionControl: true,
            maxBounds: [
                [-80.0, 43.5],
                [-78.5, 44.0],
            ],
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
            '<a href="https://open.toronto.ca/">City of Toronto </a>',
        ];
        const attributionString = attributions.join(", ");
        // MAP LOAD
        map.on("load", async function () {
            map.getCanvas().style.cursor = "crosshair";

            updateMapView();

            // BASE MAP STYLES
            map.addSource("protomaps", {
                type: "vector",
                url: "pmtiles://" + PMTILES_URL,
                attribution: attributionString,
                attributionControl: false,
            });
            protoLayers.forEach((e) => {
                map.addLayer(e);
            });

            // ADD DATA SOURCES AND LAYERS
            for (const [key, source] of Object.entries(sources)) {
                console.log(`Adding source: ${key}`, source);
                map.addSource(key, source);
            }

            for (const layer of Object.values(layers)) {
                console.log(`Adding layer: ${layer.id}`, layer);
                map.addLayer(layer);
            }

            // Add hover popup for revenue-per-space-layer
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
            });

            map.on("mousemove", "revenue-per-space-layer", (e) => {
                if (currentSection >= 4) {
                    // Only show popup in case 4
                    const features = e.features;
                    if (features && features.length > 0) {
                        const feature = features[0];
                        const address = feature.properties.address;
                        const revenuePerDay =
                            feature.properties.revenue_per_space_per_day;

                        popup
                            .setLngLat(e.lngLat)
                            .setHTML(
                                `
                                <strong>Address:</strong> ${address}<br>
                                <strong>Revenue per Space per Day:</strong> $${revenuePerDay}
                            `,
                            )
                            .addTo(map);
                    }
                }
            });

            map.on("mouseleave", "revenue-per-space-layer", () => {
                popup.remove();
            });

            //CONSOLE LOG MAP POSITION
            map.on("move", () => {
                const center = map.getCenter();
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
        });

        // REMOVE SCROLL LISTENER
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", updateMapView);
        };
    });

    // MAP UPDATE
    const updateMap = (section) => {
        switch (section) {
            case 0:
                toggleLayer("employment-areas-layer", 0);
                toggleLayer("parking-lots-employment-layer", 1);
                toggleLayer("parking-lots-residential-layer", 1);
                toggleLayer("heat-map-layer", 0);

                break;

            case 1:
                toggleLayer("employment-areas-layer", 0);
                toggleLayer("parking-lots-employment-layer", 1);
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("parking-lots-layer", 0);

                // setTimeout(() => {
                //     toggleLayer("heat-map-layer", 0);
                // }, 500);

                break;

            case 2:
                toggleLayer("employment-areas-layer", 0);
                toggleLayer("green-p-stats-layer", 0);
                toggleLayer("parking-lots-employment-layer", 0);
                toggleLayer("parking-lots-residential-layer", 1);
                toggleLayer("heat-map-layer", 0);

                break;

            case 3:
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("parking-lots-employment-layer", 0);

                toggleLayer("green-p-stats-layer", 0.7, 1);
                toggleLayer("revenue-per-space-layer", 0);
                break;

            case 4:
                toggleLayer("green-p-stats-layer", 0);
                toggleLayer("revenue-per-space-layer", 0.7, 1);
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("parking-lots-employment-layer", 0);
                toggleLayer("subway-lines-layer", 0);
                toggleLayer("subway-stations-layer", 0);
                toggleLayer("subway-buffer-all-layer", 0);
                toggleLayer("subway-buffer-mask-layer", 0);
                toggleLayer("city-mask-layer", 1);
                map.flyTo({
                    center: currentMapPosition.center,
                    zoom: currentMapPosition.zoom,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });
                break;

            case 5:
                activePopups.forEach((popup) => popup.remove());

                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("subway-buffer-all-layer", 1);
                toggleLayer("subway-buffer-mask-layer", 0.6);
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("parking-lots-employment-layer", 0);
                toggleLayer("revenue-per-space-layer", 0.5, 1);
                toggleLayer("case-study-revenue-per-space-layer", 0);
                toggleLayer("city-mask-layer", 0);
                toggleLayer("case-studies-bldgs-layer", 0);

                map.flyTo({
                    center: [-79.410235, 43.71175],
                    zoom: 10.95,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });

                break;

            case 6:
                // Clear existing popups
                activePopups.forEach((popup) => popup.remove());
                activePopups = [];

                // Get all features from the source of the layer
                const features = map.querySourceFeatures("CaseStudyStats", {
                    sourceLayer: "case-study-revenue-per-space-layer",
                });

                // Iterate through each feature and create a popup
                features.forEach((feature) => {
                    const properties = feature.properties;
                    const address = properties.address;
                    const revenue2023 = properties.revenue_2023;
                    const revenuePerSpace = properties.revenue_per_space;
                    const revenuePerSpacePerDay =
                        properties.revenue_per_space_per_day;

                    // Create the popup content
                    const popupContent = `
            <div>
                <strong>Address:</strong> ${address}<br>
                <strong>Revenue (2023):</strong> ${revenue2023}<br>
                <strong>Revenue per Space:</strong> ${revenuePerSpace}<br>
                <strong>Revenue per Space per Day:</strong> ${revenuePerSpacePerDay}
            </div>
        `;

                    // Create and display the popup
                    const popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                    })
                        .setLngLat([properties.lon, properties.lat]) // Use the feature's coordinates
                        .setHTML(popupContent) // Set the popup content
                        .addTo(map); // Add the popup to the map

                    // Add the popup to the activePopups array
                    activePopups.push(popup);
                });

                toggleLayer("revenue-per-space-layer", 0);
                toggleLayer("case-study-revenue-per-space-layer", 1, 1);
                toggleLayer("case-studies-area-layer", 0);

                toggleLayer("subway-buffer-all-layer", 1);
                toggleLayer("subway-buffer-mask-layer", 0.6);
                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);

                toggleLayer("case-studies-bldgs-layer", 1);

                map.flyTo({
                    center: [-79.410235, 43.71175],
                    zoom: 10.95,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });
                break;

            case 7:
                // 72 Amroth Avenue
                activePopups.forEach((popup) => popup.remove());
                toggleLayer("case-study-revenue-per-space-layer", 0);

                toggleLayer("case-studies-area-layer", 1);

                map.flyTo({
                    center: [-79.31183245492291, 43.68529059208628],
                    zoom: 18,
                    bearing: -17,
                    duration: 3500,
                });

                toggleLayer("city-mask-layer", 1);
                toggleLayer("subway-buffer-all-layer", 0);
                toggleLayer("subway-buffer-mask-layer", 0);
                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                break;

            case 8:
                // 405 Sherbourne
                map.flyTo({
                    center: [-79.37313417683629, 43.664663800721115],
                    zoom: 18,
                    bearing: -17,
                    duration: 3500,
                });
                break;

            case 9:
                // 50 Wilson Heights Boulevard
                toggleLayer("parking-lots-employment-layer", 0);
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("case-studies-area-layer", 1);

                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("case-studies-bldgs-layer", 1);

                map.flyTo({
                    center: [-79.449151, 43.735573],
                    zoom: 17,
                    bearing: -17,
                    duration: 3500,
                    speed: 0.5,
                });
                break;

            case 10:
                toggleLayer("subway-lines-layer", 0);
                toggleLayer("subway-stations-layer", 0);

                toggleLayer("case-studies-bldgs-layer", 0);

                toggleLayer("case-studies-area-layer", 0);
                toggleLayer("parking-lots-employment-layer", 1);
                toggleLayer("parking-lots-residential-layer", 1);

                map.flyTo({
                    center: currentMapPosition.center,
                    zoom: currentMapPosition.zoom,
                    bearing: currentMapPosition.bearing,
                    duration: 2000,
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

<Top />

<div class="banner">
    <div class="gradient-overlay"></div>
    <div class="title">
        <h1>FROM PARKING SPACES TO LIVING SPACES</h1>
        <h3>
            Why turning underutilized surface parking into homes makes financial
            sense.
        </h3>
        <h3>Toronto, Canada</h3>
        <p class="author">
            <a
                href="https://www.linkedin.com/in/scott-christian-mccallum/"
                target="_blank">Scott McCallum</a
            >,
            <a href="https://jamaps.github.io/" target="_blank">Jeff Allen</a> |
            May 2025
        </p>
    </div>
</div>

<div class="main-container">
    <div class="map-container" id="map"></div>

    <section class="content">
        <!-- <div class="section">
            <h2>FROM PARKING SPACE TO LIVING SPACE</h2>
            <p>Why turning underutilized surface parking into homes makes financial
            sense.</p>
            <p>Toronto, Canada</p>
                    <p>
            <a
                href="https://www.linkedin.com/in/scott-christian-mccallum/"
                target="_blank">Scott McCallum</a
            >,
            <a href="https://jamaps.github.io/" target="_blank">Jeff Allen</a> |
            May 2025
        </p>
        </div> -->

        <div class="section">
            <div class="text">
                <h3>Toronto is 9% Surface Parking</h3>
                <p>
                    Across the city, surface parking lots cover more than 9% of
                    Toronto's land area. (add total area of surface parking lots
                    in Toronto)
                </p>

                <p>
                    These underutilized spaces represent a significant portion
                    of the urban landscape, often contributing little to the
                    vitality or livability of the surrounding neighborhoods.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Employment Areas</h3>
                <p>
                    The largest clusters of surface parking in Toronto are
                    located in areas with employment related land use,
                    accounting for nearly 6% of Toronto's land area. These
                    spaces serve functions like trainyards and industrial areas
                    that are core to the city's employment and economy.
                </p>

                <!-- <p>
                A well-known downside to these large paved areas is that they
                raise local temperatures to surrounding neighbourhoods with an
                absence of green space.
            </p> -->
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Residential Areas</h3>
                <p>
                    However, our focus is on the underutilization of surface
                    parking that fragments existing residential areas where the
                    space could be allocated to people in place of cars.
                </p>
                <p>
                    Accounting for nearly 3% of Toronto's land area, theses lots
                    are scattered in nature and puncture voids in otherwise
                    vibrant residential areas.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Green P Lots</h3>
                <p>
                    Fortunately, The City of Toronto owns or manages many of
                    these lots, branded as Green P.
                </p>
                <p>
                    Since the City controls what happens to these lots, they
                    present a rich opportunity to be transformed into uses that
                    better serve the neighbourhoods that they find themselves
                    in.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>What Do They Bring In?</h3>
                <p>
                    The revenue that these lots bring in varies. The higher
                    earning lots are located more in the city center, bringing
                    in at most $48.32 per space, per day.
                </p>
                <p>
                    At the same time, the majority of lots bring in suprisingly
                    low revenue. Wih the bottom half bringing in less than $6.00
                    per space, per day.
                </p>
                <div class="legend">
                    <img src={RevenueLegend} alt="" class="revenue-legend" />
                </div>
                <p class="legend-title">Revenue per space per day</p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Already Near Transit</h3>
                <p>
                    Meanwhile, many of these low earning lots are within 1
                    kilometre of a TTC subway station. Seeing that these spaces
                    are already well connected by transit, it begs the question:
                </p>
                <p><i>Do we need all this parking?</i></p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Case Studies</h3>
                <p>
                    Luckily, we have some examples to imagine the alternative
                    where underutilized surface parking is used for housing
                    people, not cars.
                </p>
                <p>
                    CreateTO is the City of Toronto's real estate agency,
                    managing the portfolio of city-owned properties. They have a
                    number of projects that plan to convert surface parking into
                    housing.
                </p>
                <p>
                    To compare the potential additional earnings to the city, we
                    will use these projects as points of departure to see some
                    options for different housing infill typologies, and compare
                    nearby property tax revenues to get an idea of the gains.
                </p>
                <p>Here is the range of projects we will look at:</p>
                <ul>
                    <li><strong>72 Amroth Avenue:</strong> Missing Middle</li>
                    <li>
                        <strong>405 Sherbourne Street:</strong> Affordable Rental
                    </li>
                    <li>
                        <strong>50 Wilson Heights Boulevard:</strong> Mixed Use Renewal
                    </li>
                </ul>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>72 Amroth Avenue</h3>
                <div class="case-study-container">
                    <div class="image-crop-container">
                        <img
                            src={AmrothIsoBldg}
                            alt=""
                            class="cropped amroth"
                        />
                    </div>
                    <div class="stat-container">
                        <p>Typology: Missing Middle, Market Rate Housing</p>
                        <p>Number of Units:</p>
                        <p>Number of Residents</p>
                        <p>Current parking lot revenue:</p>
                        <p>Estimated property tax revenue:</p>
                        <p>Gain:</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>405 Sherbourne</h3>
                <div class="case-study-container">
                    <div class="image-crop-container">
                        <img
                            src={SherbourneIsoBldg}
                            alt=""
                            class="cropped sherbourne"
                        />
                    </div>
                    <div class="stat-container">
                        <p>Typology: Missing Middle, Market Rate Housing</p>
                        <p>Number of Units:</p>
                        <p>Number of Residents</p>
                        <p>Current parking lot revenue:</p>
                        <p>Estimated property tax revenue:</p>
                        <p>Gain:</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>50 Wilson Heights Boulevard</h3>
                <div class="case-study-container">
                    <div class="image-crop-container">
                        <img
                            src={WilsonIsoBldg}
                            alt=""
                            class="cropped wilson"
                        />
                    </div>
                    <div class="stat-container">
                        <p>Typology: Missing Middle, Market Rate Housing</p>
                        <p>Number of Units:</p>
                        <p>Number of Residents</p>
                        <p>Current parking lot revenue:</p>
                        <p>Estimated property tax revenue:</p>
                        <p>Gain:</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Policy Recommendations</h3>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit
                    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                    occaecat cupidatat non proident, sunt in culpa qui officia
                    deserunt mollit anim id est laborum.
                </p>
            </div>
        </div>

        <div class="section spacer">
            <div class="text"></div>
        </div>
    </section>
</div>

<style>
    .banner {
        position: relative;
        height: 100dvh;
        top: 0px;
        background-image: url("toronto-1978.jpg");
        background-size: cover;
        background-position: center;
        display: flex;
        /* flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center; */
        color: white;
    }

    .gradient-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0.6)
        );
        z-index: 1;
    }

    .title {
        margin: 10px;
        z-index: 1000;
        position: relative;
    }

    .title h1 {
        position: relative;
        text-align: center;
        color: white;
    }
    .title h3 {
        color: white;
        font-family: sans-serif;
        /* font-size: 1.5em; */
    }

    .author {
        position: relative;
        z-index: 1000;
        color: white;
        font-size: 1.2em;
        font-family: sans-serif;
        margin: 0 0 0 0;
    }

    .main-container {
        display: flex;
        flex-direction: row;
    }

    .map-container {
        position: sticky;
        top: 50px;
        height: calc(100vh - 50px);
        width: 65vw;
    }

    .section {
        top: 0;
        position: static;
        display: flex;
        flex-direction: column;
        /* min-height: 125vh;
        z-index: 1000; */
        align-items: flex-start;
        width: 35vw;
        margin-left: auto;
        opacity: 0.25;
    }

    .spacer {
        height: 30vh;
    }

    .case-study-container {
        display: flex;
        flex-direction: column;
    }

    .image-crop-container {
        max-height: 40vh;
        width: 30vw;
        overflow: hidden;
        position: relative;
    }

    .cropped {
        width: 100%;
        height: auto;
        margin: 0 auto;
        object-fit: cover;
        object-position: center top;
    }

    .cropped.amroth {
        transform: scale(1.4);
        transform-origin: 50% 70%;
    }

    .cropped.sherbourne {
        transform: scale(1.1);
        transform-origin: 50% 200%;
    }

    .cropped.wilson {
        transform: scale(1.1);
        transform-origin: 50% 200%;
    }

    .revenue-legend {
        max-width: 100%; /* Set a fixed width */
        height: 100px; /* Maintain aspect ratio */
    }

    .text {
        text-align: center;
        background-color: rgba(255, 255, 255, 1);
        border-bottom: 1px solid rgba(189, 189, 189, 0.7);
        border-top: 1px solid rgba(189, 189, 189, 0.7);

        margin: 0px;

        padding: 0 20px 0;
        overflow: hidden;
        box-sizing: border-box;

        width: 100%;
    }

    @media (max-width: 950px) {
        .main-container {
            display: flex;
            flex-direction: column;
        }

        .map-container {
            width: 100vw;
            height: 50vh;
            /* position: relative; */
            top: 50px;
            z-index: 1;
        }

        .section {
            width: 100vw;
            margin-left: 0;
            opacity: 1;
            /* min-height: 100vh; */
        }

        .case-study-container {
            flex-direction: row;
        }

        .image-crop-container {
            height: 400px;
            min-width: 450px;
            overflow: hidden;
            position: relative;
        }
        .cropped.amroth {
            transform: scale(1.4);
            transform-origin: 50% 100%;
        }

        /* .cropped {
            min-height: 0;
            max-height: 300px;
            max-width: 450px;
            width: 100%;
            object-fit: cover;
            object-position: center;
        } */

        .section {
            align-items: center;
            width: 100vw;
        }
        .text {
            width: 100vw;
        }
    }

    @media (max-width: 750px) {
        .case-study-container {
            flex-direction: column;
        }
    }

    @media (max-width: 450px) {
        .title h1 {
            font-size: 3.2em;
            text-align: left;
        }
        .image-crop-container {
            height: 250px;
            min-width: 100%;
            overflow: hidden;
            position: relative;
        }
        .cropped.amroth {
            transform-origin: 50% 80%;
        }
        .cropped.wilson {
            transform: scale(1.1);
            transform-origin: 50% 220%;
        }
    }
</style>
