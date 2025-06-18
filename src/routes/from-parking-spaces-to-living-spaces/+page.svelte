<script>
    // IMPORT STUFF
    import { onMount } from "svelte";
    import maplibregl from "maplibre-gl";
    import * as pmtiles from "pmtiles";

    import { fade } from "svelte/transition";
    import Top from "$lib/TopSofC.svelte";
    import Histogram from "$lib/Histogram.svelte";

    // IMPORT STYLES
    import "../../assets/maplibre-gl.css";
    import "../../assets/styles.css";

    // IMPORT BASE MAP
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";
    import BaseLayer from "../../data/toronto-filling-the-void.json";
    import { sources, layers } from "$lib/mapLayers.js";
    import data from "../../data/revenue_per_space_per_day_list.json";

    // IMPORT IMAGES
    import AmrothIsoBldg from "/src/assets/amroth-iso-bldg.png";
    import WilsonIsoBldg from "/src/assets/wilson-iso-bldg.png";
    import SherbourneIsoBldg from "/src/assets/sherbourne-iso-bldg.png";
    import RevenueLegend from "/src/assets/revenue-legend.svg";

    // RANGE SLIDER
    import RangeSlider from "svelte-range-slider-pips";
    const min = Math.min(...data);
    const max = Math.max(...data);
    let values = [min, max];

    // INIT
    let map;
    let protoLayers = BaseLayer;
    let scale = new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });
    let activePopups = [];

    // TOGGLE LAYER FUNCTION
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

    // FILTER REVENUE PER SPACE LAYER
    $: if (
        map &&
        map.isStyleLoaded &&
        map.isStyleLoaded() &&
        (currentSection === 4 || currentSection === 5)
    ) {
        map.setFilter("revenue-per-space-layer", [
            "all",
            [">=", ["get", "revenue_per_space_per_day"], values[0]],
            ["<=", ["get", "revenue_per_space_per_day"], values[1]],
        ]);
    }

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
                toggleLayer("parking-lots-all-layer", 1);
                toggleLayer("parking-lots-emp-layer", 0);
                break;

            case 1:
                toggleLayer("parking-lots-emp-layer", 1);
                toggleLayer("parking-lots-all-layer", 0);
                toggleLayer("parking-lots-res-layer", 0);
                break;

            case 2:
                toggleLayer("parking-lots-res-layer", 1);
                toggleLayer("green-p-stats-layer", 0);
                toggleLayer("parking-lots-emp-layer", 0);
                break;

            case 3:
                showLegend = false;

                toggleLayer("green-p-stats-layer", 0.7, 1);
                toggleLayer("parking-lots-res-layer", 0);
                toggleLayer("revenue-per-space-layer", 0);
                break;

            case 4:
                showLegend = true;

                toggleLayer("city-mask-layer", 1);
                toggleLayer("revenue-per-space-layer", 0.7, 1);
                toggleLayer("green-p-stats-layer", 0);
                toggleLayer("subway-lines-layer", 0);
                toggleLayer("subway-stations-layer", 0);
                toggleLayer("subway-buffer-all-layer", 0);
                toggleLayer("subway-buffer-mask-layer", 0);

                map.flyTo({
                    center: currentMapPosition.center,
                    zoom: currentMapPosition.zoom,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });
                break;

            case 5:
                activePopups.forEach((popup) => popup.remove());
                showLegend = true;

                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("subway-buffer-all-layer", 1);
                toggleLayer("subway-buffer-mask-layer", 0.6);
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
                showLegend = false;

                toggleLayer("case-study-revenue-per-space-layer", 1, 1);
                toggleLayer("subway-buffer-all-layer", 1);
                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("case-studies-bldgs-layer", 1);
                toggleLayer("subway-buffer-mask-layer", 0.6);
                toggleLayer("city-mask-layer", 0);
                toggleLayer("case-studies-area-layer", 0);
                toggleLayer("revenue-per-space-layer", 0);

                // Clear existing popups
                activePopups.forEach((popup) => popup.remove());
                activePopups = [];
                const features = map.querySourceFeatures("CaseStudyStats", {
                    sourceLayer: "case-study-revenue-per-space-layer",
                });
                const anchorMap = {
                    "72 Amroth Ave": "top",
                    "405 Sherbourne St": "bottom",
                    "50 Wilson Heights Blvd": "bottom",
                };
                // Iterate through each feature and create a popup
                features.forEach((feature) => {
                    const properties = feature.properties;
                    const spaceCount = properties.space_count;
                    const address = properties.address;
                    const revenue2023 = properties.revenue_2023;
                    const revenuePerSpacePerDay =
                        properties.revenue_per_space_per_day;
                    const popupContent = `<div>
                                <strong>Address:</strong> ${address}<br>
                                <strong>Number of Spaces:</strong> ${spaceCount}<br>
                                <strong>Revenue (2023):</strong> ${revenue2023}<br>
                                <strong>Revenue per Space per Day:</strong> ${revenuePerSpacePerDay}
                            </div>`;
                    const anchor = anchorMap[address] || "bottom";
                    const popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        anchor,
                    })
                        .setLngLat([properties.lon, properties.lat])
                        .setHTML(popupContent)
                        .addTo(map);
                    activePopups.push(popup);
                });

                map.flyTo({
                    center: [-79.410235, 43.71175],
                    zoom: currentMapPosition.zoom * 1.05,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });
                break;

            case 7:
                showLegend = false;

                toggleLayer("case-study-revenue-per-space-layer", 1, 1);
                toggleLayer("subway-buffer-all-layer", 1);
                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("case-studies-bldgs-layer", 1);
                toggleLayer("subway-buffer-mask-layer", 0.6);
                toggleLayer("city-mask-layer", 0);
                toggleLayer("case-studies-area-layer", 0);
                toggleLayer("revenue-per-space-layer", 0);

                map.flyTo({
                    center: [-79.410235, 43.71175],
                    zoom: currentMapPosition.zoom * 1.05,
                    bearing: currentMapPosition.bearing,
                    duration: 1000,
                });
                break;

            case 8:
                // 72 Amroth Avenue
                activePopups.forEach((popup) => popup.remove());

                toggleLayer("case-studies-area-layer", 1);
                toggleLayer("city-mask-layer", 1);
                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("case-study-revenue-per-space-layer", 0);
                toggleLayer("subway-buffer-all-layer", 0);
                toggleLayer("subway-buffer-mask-layer", 0);

                map.flyTo({
                    center: [-79.31183245492291, 43.68529059208628],
                    zoom: 17.75,
                    bearing: -17,
                    duration: 3500,
                });
                break;

            case 9:
                // 405 Sherbourne
                map.flyTo({
                    center: [-79.37313417683629, 43.664663800721115],
                    zoom: 17.75,
                    bearing: -17,
                    duration: 3500,
                });
                break;

            case 10:
                // 50 Wilson Heights Boulevard
                toggleLayer("case-studies-area-layer", 1);
                toggleLayer("subway-lines-layer", 1);
                toggleLayer("subway-stations-layer", 1);
                toggleLayer("case-studies-bldgs-layer", 1);
                toggleLayer("parking-lots-all-layer", 0);

                map.flyTo({
                    center: [-79.449151, 43.735573],
                    zoom: 15.75,
                    bearing: -17,
                    duration: 3500,
                    speed: 0.5,
                });
                break;

            case 11:
                toggleLayer("parking-lots-all-layer", 1);
                toggleLayer("subway-lines-layer", 0);
                toggleLayer("subway-stations-layer", 0);
                toggleLayer("case-studies-bldgs-layer", 0);
                toggleLayer("case-studies-area-layer", 0);

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
            June 2025
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
                    These parking lots represent a significant portion of the
                    urban landscape and are often vacant throughout the day.
                    Consequently, these underutilized spaces contribute little
                    to the vitality or livability of the surrounding
                    neighborhoods.
                </p>

                <p>There is an opportunity cost to this underutilization:</p>
                <p>
                    The City of Toronto is missing out on higher property tax
                    revenues from these lots if they were used for housing
                    people instead of cars.
                </p>
                <p>Surface parking lots, <i>what are they worth?</i></p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Employment Areas</h3>
                <p>
                    The largest clusters of surface parking in Toronto are
                    located in areas with employment related land use. These
                    surface parking lots alone account for nearly 4% of
                    Toronto's total land area.
                </p>
                <p>
                    These areas serve functions like trainyards and industrial
                    zones that are core to the city's employment and economy.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Residential Areas</h3>
                <p>
                    However, our focus is on the underutilization of surface
                    parking that fragments existing residential areas where the
                    space could otherwise be dedicated to people instead of
                    cars.
                </p>
                <p>
                    Accounting for over 4.5% of Toronto's residential land area,
                    theses lots are scattered and puncture voids in otherwise
                    vibrant residential areas.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>City-Owned Parking Lots</h3>
                <p>
                    The City of Toronto owns or manages over 200 of these
                    surface parking lots, branded as Green P.
                </p>
                <p>
                    Since the City has control over what happens to these lots,
                    they represent low-hanging fruit and offer a valuable
                    opportunity to be transformed in ways that better serve the
                    neighbourhoods they occupy.
                </p>

                <p>
                    Let’s look at how much revenue they currently generate as
                    surface parking lots.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>What Do They Bring In?</h3>
                <p>
                    The revenue that these lots bring in varies widely. The
                    higher earning lots are typically located closer to the city
                    center and bring in as much as $48.32 per space, per day.
                </p>
                <p>
                    However, the majority of Green P surface lots generate
                    surprisingly low revenue. With half the lots bringing in
                    less than $5.87 per space, per day.
                </p>
                <p>Hover over the map to find out how much each lot makes.</p>
                <div class="histogram-container">
                    <Histogram
                        {data}
                        highlightRange={values}
                        highlightOpacity={1}
                        dimOpacity={0.3}
                    />

                    <div class="range-slider-container">
                        <div class="range-slider-wrapper">
                            <RangeSlider
                                range
                                draggy
                                spring={true}
                                springValues={{ stiffness: 1, damping: 1 }}
                                bind:values
                                {min}
                                {max}
                            />
                        </div>
                    </div>

                    <div
                        style="margin: 10px; text-align: center; font-size: 14px; font-weight: bold;"
                    >
                        Revenue Per Space Per Day
                    </div>

                    <div
                        style="margin: 10px; text-align: center; font-size: 14px;"
                    >
                        ${values[0].toFixed(2)}
                        &ndash; ${values[1].toFixed(2)}
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Do We Need All This parking?</h3>
                <p>
                    Meanwhile, many of these low earning lots are within 1
                    kilometre of a TTC subway station. That's about a 15-minute
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
                    Luckily, we have working examples to help us envision an
                    alternative where underutilized surface parking lots are
                    repurposed to house people instead of cars.
                </p>
                <p>
                    <a
                        href="https://createto.ca/projects/housing"
                        target="_blank">CreateTO</a
                    > is the City of Toronto's real estate agency, managing the portfolio
                    of city-owned properties. They have several projects that already
                    aim to do what we are proposing here:
                </p>
                <p><i>Repurpose surface parking lots for housing.</i></p>

                <p>
                    Here are the different CreateTO projects we examined that
                    operate at different urban scales and contexts:
                </p>
                <ul>
                    <li>
                        <strong>72 Amroth Avenue:</strong> Missing Middle
                    </li>
                    <li>
                        <strong>405 Sherbourne Street:</strong> Mixed Use High-Rise
                    </li>
                    <li>
                        <strong>50 Wilson Heights Boulevard:</strong> Mixed Use Urban
                        Renewal
                    </li>
                </ul>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Methodology</h3>

                <p>
                    To understand the relative value of urban space in its use
                    as surface parking compared to housing, we estimated the new
                    property value assessments of the buildings proposed by
                    CreateTO to the property value assessments of their sites
                    currently used as surface parking.
                </p>
                <p>
                    To do this, we collected the most recent 2025 property value
                    assessments of the surface parking lots from the Toronto
                    Archives.
                </p>
                <p>
                    We also collected and averaged property assessments of
                    similar new-build units within developments nearby each case
                    study. These figures were then multiplied by the number of
                    proposed units for each case study.
                </p>
                <p>
                    Finally, we compared the projected property value estimates
                    to the amount they are currently reporting as surface
                    parking lots.
                </p>
                <p>
                    What becomes clear is that repurposing underutilized surface
                    parking for housing not only addresses housing needs but can
                    also contribute positively to the City’s revenue streams in
                    the form of higher property taxes on better uses of urban
                    space.
                </p>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <div class="case-study-container">
                    <div class="case-study-text">
                        <h3>72 Amroth Avenue</h3>
                        <p>Missing Middle</p>
                        <p>
                            A 6-storey low-rise apartment building and two
                            3-storey townhouses comprising 34 new residential
                            units. Located in the Danforth neighbourhood near
                            Main Street subway station.
                        </p>
                    </div>

                    <div class="image-crop-container">
                        <img src={AmrothIsoBldg} alt="" class="" />
                    </div>

                    <div class="stat-container">
                        <div class="stat-line">
                            <strong
                                >Current Parking Lot Property Value Assessment
                                (2025):</strong
                            > $2,333,000
                        </div>
                        <div class="stat-line">
                            <strong
                                >Projected Total Housing Property Value
                                Assessment:</strong
                            > $13,307,852
                        </div>
                        <div class="stat-line">
                            <strong>Difference in Value:</strong> ⬆ $10,974,852
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <div class="case-study-container">
                    <div class="case-study-text">
                        <h3>405 Sherbourne</h3>
                        <p>Mixed Use High-Rise</p>
                        <p>
                            A 26-storey high-rise with 266 residential units and
                            mixed use spaces at street level. Located in the
                            Cabbagetown neighbourhood near Sherbourne subway
                            station.
                        </p>
                    </div>

                    <div class="image-crop-container">
                        <img src={SherbourneIsoBldg} alt="" class="" />
                    </div>

                    <div class="stat-container">
                        <div class="stat-line">
                            <strong
                                >Current Parking Lot Property Value Assessment
                                (2025):</strong
                            > $9,812,000
                        </div>
                        <div class="stat-line">
                            <strong
                                >Projected Total Housing Property Value
                                Assessment:</strong
                            > $110,676,444
                        </div>
                        <div class="stat-line">
                            <strong>Difference in Value:</strong> ⬆ $100,864,444
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <div class="case-study-container">
                    <div class="case-study-text">
                        <h3>50 Wilson Heights Boulevard</h3>
                        <p>Mixed Use Urban Renewal</p>
                        <p>
                            A multi-building mixed use urban development up to
                            16 storeys with a total of 1,484 residential units.
                            Located near Downsview at the Wilson subway station.
                        </p>
                    </div>

                    <div class="image-crop-container">
                        <img src={WilsonIsoBldg} alt="" class="" />
                    </div>

                    <div class="stat-container">
                        <div class="stat-line">
                            <strong
                                >Current Parking Lot Property Value Assessment
                                (2025):</strong
                            > $9,739,000
                        </div>
                        <div class="stat-line">
                            <strong
                                >Projected Total Housing Property Value
                                Assessment:</strong
                            > $490,599,407
                        </div>
                        <div class="stat-line">
                            <strong>Difference in Value:</strong> ⬆ $480,860,407
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="text">
                <h3>Not Only City-Owned Parking Lots</h3>
                <p>
                    Toronto’s surface parking lots represent one of the city’s
                    most underleveraged assets. Many are situated in desirable
                    residential areas near transit stations yet contribute very
                    little in terms of revenue posing a significant opportunity
                    costs in a city grappling with an acute shortage of
                    affordable housing.
                </p>
                <p>
                    The contrast is clear: replacing underutilized surface
                    parking lots with well-designed housing can dramatically
                    increase the city's revenue in the form of property taxes,
                    deliver much-needed homes, and contribute to the development
                    of more complete and vibrant communities.
                </p>
                <p>
                    However, city-owned lots represent only a small fraction of
                    the surface parking that dot Toronto's neighbourhoods. This
                    means that for more widespread change, privately-owned lots
                    must also be studied for housing.
                </p>
                <p>
                    Stronger urban policy, such as a commercial parking levy, an
                    idle land tax, or a highest and best use property tax,
                    should be considered to incentivize housing development on
                    privately-owned lots.
                </p>
                <p>
                    By expanding these efforts beyond city-owned lots and
                    adopting policies that encourage private landowners to
                    follow suit, Toronto can take meaningful steps toward
                    creating a more equitable, efficient, and human-centred
                    urban environment.
                </p>
            </div>
        </div>

        <div class="section spacer">
            <div class="text"></div>
        </div>
    </section>
</div>
