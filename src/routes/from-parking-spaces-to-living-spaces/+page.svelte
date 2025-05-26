<script>
    import { onMount } from "svelte";
    import maplibregl from "maplibre-gl";
    import { fade } from "svelte/transition";

    import Top from "$lib/TopSofC.svelte";
    import Histogram from "$lib/Histogram.svelte";

    import "../../assets/maplibre-gl.css";
    import "../../assets/styles.css";

    import * as pmtiles from "pmtiles";
    import BaseLayer from "../../data/toronto-filling-the-void.json";
    import { sources, layers } from "$lib/mapLayers.js";

    //PNG
    import AmrothIsoBldg from "/src/assets/amroth-iso-bldg.png";
    import WilsonIsoBldg from "/src/assets/wilson-iso-bldg.png";
    import SherbourneIsoBldg from "/src/assets/sherbourne-iso-bldg.png";

    //SVG
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
    let showLegend = false;

    let scrollPlacement = window.innerWidth < 1050 ? 0.8 : 0.4;

    const handleResize = () => {
        scrollPlacement = window.innerWidth < 1050 ? 0.8 : 0.4;
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
            minZoom = 8.9;
            maxZoom = 10.7;
        } else {
            minZoom = 8.8;
            maxZoom = 12.1;
        }

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

        if (currentSection === 5 || currentSection === 6) {
            map.flyTo({
                center: [-79.410235, 43.71175],
                zoom: currentMapPosition.zoom * 1.05,
                bearing: currentMapPosition.bearing,
                duration: 0,
            });
        } else if (![7, 8, 9].includes(currentSection)) {
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
                if (currentSection === 4 || currentSection === 5) {
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

                break;

            case 1:
                toggleLayer("employment-areas-layer", 0);
                toggleLayer("parking-lots-employment-layer", 1);
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("parking-lots-layer", 0);
                break;

            case 2:
                toggleLayer("employment-areas-layer", 0);
                toggleLayer("green-p-stats-layer", 0);
                toggleLayer("parking-lots-employment-layer", 0);
                toggleLayer("parking-lots-residential-layer", 1);
                break;

            case 3:
                toggleLayer("parking-lots-residential-layer", 0);
                toggleLayer("parking-lots-employment-layer", 0);

                toggleLayer("green-p-stats-layer", 0.7, 1);
                toggleLayer("revenue-per-space-layer", 0);
                showLegend = false;

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
                showLegend = true;

                break;

            case 5:
                activePopups.forEach((popup) => popup.remove());

                showLegend = true;

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
                    zoom: currentMapPosition.zoom * 1.05,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });

                break;

            case 6:
                // Clear existing popups
                activePopups.forEach((popup) => popup.remove());
                activePopups = [];
                showLegend = false;

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
                    const popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                    })
                        .setLngLat([properties.lon, properties.lat])
                        .setHTML(popupContent)
                        .addTo(map);

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

                toggleLayer("city-mask-layer", 0);

                map.flyTo({
                    center: [-79.410235, 43.71175],
                    zoom: currentMapPosition.zoom * 1.05,
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
                    zoom: 17.75,
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
                    zoom: 17.75,
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
                    zoom: 15.75,
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
    <div class="map-container" id="map">
        {#if showLegend}
            <div
                class="map-legend-bottom-right"
                transition:fade={{ duration: 250 }}
            >
                <img
                    src={RevenueLegend}
                    alt="Revenue Legend"
                    class="revenue-legend"
                />
            </div>
        {/if}
    </div>

    <section class="content">
        <div class="section">
            <div class="text">
                <h3>Toronto is 9% Surface Parking</h3>
                <p>
                    Across the city, surface parking lots cover more than 9% of
                    Toronto's land area for a total of 56,943,600 square meters.
                </p>

                <p>That's 390 Trinity Bellwoods Parks.</p>

                <p>
                    These underutilized spaces represent a significant portion
                    of the urban landscape, often contributing little to the
                    vitality or livability of the surrounding neighborhoods.
                </p>

                <p>There is a financial cost to this underutilization.</p>
                <p>
                    The City of Toronto is missing out on higher property tax
                    revenues from these spaces if they were used for housing
                    people instead of cars.
                </p>
                <p>Parking lots, <i>what exactly are they worth?</i></p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Employment Areas</h3>
                <p>
                    The largest clusters of surface parking in Toronto are
                    located in areas with employment related land use,
                    accounting for nearly 6% of Toronto's land area.
                </p>
                <p>
                    These spaces serve functions like trainyards and industrial
                    areas that are core to the city's employment and economy.
                </p>
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
                    are scattered and puncture voids in otherwise vibrant
                    residential areas.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>City-Owned Parking Lots</h3>
                <p>
                    Fortunately, The City of Toronto owns or manages many of
                    these lots, branded as Green P parking lots.
                </p>
                <p>
                    Since the City has control over what happens to these lots,
                    they present a rich opportunity to be transformed into uses
                    that better serve the neighbourhoods that they find
                    themselves in.
                </p>

                <p>
                    Lets look at how much revenue they currently generate as
                    parking lots.
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
                    However, the majority of Green P lots bring in suprisingly
                    low revenue. Wih the bottom half bringing in less than $5.87
                    per space, per day.
                </p>
                <p>Hover over the map to explore.</p>
                <div class="histogram-container">
                    <Histogram />
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Do they need to be there?</h3>
                <p>
                    Meanwhile, many of these low earning lots are within 1
                    kilometre of a TTC subway station. That's about a 15 minute
                    walk.
                </p>
                <p>
                    Seeing that these spaces are already well connected by
                    transit, it begs the question:
                </p>
                <p><i>Do we need all this parking?</i></p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Case Studies: CreateTO</h3>
                <p>
                    Luckily, we have some working examples to imagine an
                    alternative where underutilized surface parking is used for
                    housing people, not cars.
                </p>
                <p>
                    <a href="https://createto.ca/projects/housing" target="_blank">CreateTO</a> is the City of Toronto's real estate agency,
                    managing the portfolio of city-owned properties. They have a
                    number of projects that plan to do what we are proposing
                    here:
                </p>
                <p><i>Convert surface parking into housing.</i></p>
                <p>
                    To compare the potential additional earnings that the city
                    would make in residential property tax revenue, we will use
                    the following CreateTO projects as points of departure,
                    illustrating different housing strategies in the urban
                    toolkit.
                </p>
                <p>
                    We averaged nearby property assessments of similar projects,
                    collected from the Toronto archives, and estimated what an
                    average unit generates in property taxes for the city per
                    year.
                </p>
                <p>
                    Then, we multiplied this number by the number of units each
                    case study proposes, along with estimates for affordable and
                    market-rate rental income that these properties would
                    generate, calculated from the <a
                        href="https://www.toronto.ca/city-government/planning-development/official-plan-guidelines/housing/"
                        target="_blank">City of Toronto's housing guidelines.</a
                    >
                </p>
                <p>
                    Finally, we compared the total estimates that the case
                    studies are currently generating as underutilized surface
                    parking, compared to our total estimates for each housing
                    case study.
                </p>
                <p>
                    Spoiler alert: Turning parking lots into housing benefits
                    not only people, but the City's levies.
                </p>
                <p>Here is the variety of CreateTO projects we looked at:</p>
                <ul>
                    <li>
                        <strong>72 Amroth Avenue:</strong> Missing Middle / Gentle
                        Density
                    </li>
                    <li>
                        <strong>405 Sherbourne Street:</strong>
                        Mid Density Tower
                    </li>
                    <li>
                        <strong>50 Wilson Heights Boulevard:</strong> Large Mixed
                        Use Urban Renewal
                    </li>
                </ul>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>72 Amroth Avenue</h3>
                <p>Missing Middle / Gentle Density</p>
                <div class="case-study-container">
                    <div class="image-crop-container">
                        <img
                            src={AmrothIsoBldg}
                            alt=""
                            class="cropped amroth"
                        />
                    </div>
                    <div class="stat-container">
                        <div class="stat-title">
                            <h4>Current Parking Lot Revenue</h4>
                        </div>
                        <div class="stat-line">
                            <strong>Number of Parking Spots:</strong> 50
                        </div>
                        <div class="stat-line">
                            <strong>Parking Lot Revenue (2023):</strong> $100,714
                        </div>
                        <div class="stat-line">
                            <strong>Revenue per Space per Day (2023):</strong> $5.52
                        </div>
                        <div class="stat-line">
                            <strong>Property Tax Paid (2023):</strong> $52,955
                        </div>
                        <div class="stat-line">
                            <strong>Total Annual Revenue:</strong> $153,669
                        </div>

                        <div class="stat-title">
                            <h4>Potential Housing Revenue</h4>
                        </div>
                        <div class="stat-line">
                            <strong>Typology:</strong> Missing Middle / Gentle Density
                        </div>
                        <div class="stat-line">
                            <strong>Ownership Structure:</strong> 100% Affordable
                            Rental
                        </div>
                        <div class="stat-line">
                            <strong>Number of Units:</strong> 34
                        </div>
                        <div class="stat-line">
                            <strong>Number of Residents:</strong> 83
                        </div>
                        <div class="stat-line">
                            <strong>Total Property Tax Estimate:</strong> $100,353
                        </div>

                        <div class="stat-line">
                            <strong>Total Annual Rental Income Estimate:</strong
                            > $749,076
                        </div>

                        <div class="stat-line">
                            <strong>Total Annual Revenue:</strong> $849,429
                        </div>
                        <div class="stat-gain">
                            <strong>Gain for the City:</strong> $659,760
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>405 Sherbourne</h3>
                <p>Mid Density Tower</p>
                <div class="case-study-container">
                    <div class="image-crop-container">
                        <img
                            src={SherbourneIsoBldg}
                            alt=""
                            class="cropped sherbourne"
                        />
                    </div>
                    <div class="stat-container">
                        <div class="stat-title">
                            <h4>Current Parking Lot Revenue</h4>
                        </div>
                        <div class="stat-line">
                            <strong>Number of Parking Spots:</strong> 91
                        </div>
                        <div class="stat-line">
                            <strong>Parking Lot Revenue (2023):</strong> $361,279
                        </div>
                        <div class="stat-line">
                            <strong>Revenue per Space per Day (2023):</strong> $10.88
                        </div>
                        <div class="stat-line">
                            <strong>Property Tax Paid (2023):</strong> $222,714
                        </div>
                        <div class="stat-line">
                            <strong>Total Annual Revenue:</strong> $583,993
                        </div>

                        <div class="stat-title">
                            <h4>Potential Housing Revenue</h4>
                        </div>
                        <div class="stat-line">
                            <strong>Typology:</strong> Mid Density Tower
                        </div>
                        <div class="stat-line">
                            <strong>Ownership Structure:</strong> 50% Affordable
                            Rental, 50% Market Rate Rental
                        </div>
                        <div class="stat-line">
                            <strong>Number of Units:</strong> 267
                        </div>
                        <div class="stat-line">
                            <strong>Number of Residents:</strong> 670
                        </div>
                        <div class="stat-line">
                            <strong>Total Property Tax Estimate:</strong> $834,597
                        </div>

                        <div class="stat-line">
                            <strong>Total Annual Rental Income Estimate:</strong
                            > $7,325,796
                        </div>

                        <div class="stat-line">
                            <strong>Total Annual Revenue:</strong> $8,160,393
                        </div>
                        <div class="stat-gain">
                            <strong>Gain for the City:</strong> $7,576,400
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>50 Wilson Heights Boulevard</h3>
                <p>Large Mixed Use Urban Renewal</p>
                <div class="case-study-container">
                    <div class="image-crop-container">
                        <img
                            src={WilsonIsoBldg}
                            alt=""
                            class="cropped wilson"
                        />
                    </div>
                    <div class="stat-container">
                        <div class="stat-title">
                            <h4>Current Parking Lot Revenue</h4>
                        </div>
                        <div class="stat-line">
                            <strong>Number of Parking Spots:</strong> 885
                        </div>
                        <div class="stat-line">
                            <strong>Parking Lot Revenue (2023):</strong> $535,255
                        </div>
                        <div class="stat-line">
                            <strong>Revenue per Space per Day (2023):</strong> $1.66
                        </div>
                        <div class="stat-line">
                            <strong>Property Tax Paid (2023):</strong> $134,924
                        </div>
                        <div class="stat-line">
                            <strong>Total Annual Revenue:</strong> $670,179
                        </div>

                        <div class="stat-title">
                            <h4>Potential Housing Revenue</h4>
                        </div>
                        <div class="stat-line">
                            <strong>Typology:</strong> Large Mixed Use Urban Renewal
                        </div>
                        <div class="stat-line">
                            <strong>Ownership Structure:</strong> 35% Affordable
                            Rental, 35% Market Rate Rental, 30% Condominium
                        </div>
                        <div class="stat-line">
                            <strong>Number of Units:</strong> 1484
                        </div>
                        <div class="stat-line">
                            <strong>Number of Residents:</strong> 3710
                        </div>
                        <div class="stat-line">
                            <strong>Total Property Tax Estimate:</strong> $3,699,546
                        </div>

                        <div class="stat-line">
                            <strong
                                >Total Annual Rental Income Estimate (excluding
                                private condo purchases):</strong
                            > $28,056,344
                        </div>

                        <div class="stat-line">
                            <strong>Total Annual Revenue:</strong> $31,755,890
                        </div>
                        <div class="stat-gain">
                            <strong>Gain for the City:</strong> $31,085,712
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Not Only City-Owned Parking Lots</h3>
                <p>
                    Toronto’s underutilized surface parking lots present one of
                    the city’s most underleveraged assets. Many occupy valuable
                    space in residential areas, adjacent to transit, and
                    contribute little in terms of revenue, vibrancy, or housing
                    supply.
                </p>
                <p>
                    The comparison is clear: replacing low-performing,
                    underutilized surface parking with well-designed housing can
                    dramatically increase the city's revenue, deliver
                    much-needed homes, and foster more complete communities.
                </p>
                <p>
                    However, city-owned lots are only a small fraction of the
                    surface parking that puncture Toronto's neighbourhoods. This
                    means that for more widespread change, privately-owned lots
                    need to be examined for housing as well.
                </p>
                <p>
                    Stronger urban policy should be considered to incentivize
                    building housing on privately-owned lots such as a
                    commercial parking levy, or land value tax.
                </p>
                <p>
                    By expanding these efforts beyond city-owned lots and
                    introducing thoughtful policies that encourage private
                    landowners to follow suit, Toronto can take meaningful steps
                    toward a more equitable, efficient, and people-focused urban
                    landscape.
                </p>
            </div>
        </div>

        <div class="section spacer">
            <div class="text"></div>
        </div>
    </section>
</div>
