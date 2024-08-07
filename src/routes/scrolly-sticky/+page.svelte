<script>
  import { onMount, onDestroy } from "svelte";
  import maplibregl from "maplibre-gl";
  import "../../assets/maplibre-gl.css";
  import * as pmtiles from "pmtiles";
  import BaseLayer from "../../data/toronto.json";
  import LotData from "../../data/lot-data.geo.json";
  import { SkyDome, CNTower } from "../../data/3dModels.js";
  import Lot from "../../data/lots.json";
  import LotRevenue from "../../data/LotRevenue.geo.json";

  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  const tweenStore = tweened(0, {
    duration: 200,
    easing: cubicOut,
  });

  let sections = [];
  let currentSection = 0;
  let ticking = false;

  let map;
  let popup;

  let MASSING_URL =
    "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
  let PARKING_URL =
    "/underutilized-parking-lots-toronto/ParkingLotArea.pmtiles";
  let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";

  let scale = new maplibregl.ScaleControl({
    maxWidth: 100,
    unit: "metric",
  });

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
        glyphs:
          "https://schoolofcities.github.io/fonts/fonts/{fontstack}/{range}.pbf",
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
      map.addSource("protomaps", {
        type: "vector",
        url: "pmtiles://" + PMTILES_URL,
        attribution: attributionString,
        attributionControl: false,
      });

      protoLayers.forEach((e) => {
        map.addLayer(e);
      });

      map.addSource("massing", {
        type: "vector",
        url: "pmtiles://" + MASSING_URL,
      });

      map.addSource("parking", {
        type: "vector",
        url: "pmtiles://" + PARKING_URL,
      });

      map.addSource("lot-data", {
        type: "geojson",
        data: LotData,
      });

      map.addLayer({
        id: "lot-data-layer",
        type: "line",
        source: "lot-data",
        paint: {
          "line-color": "red",
        },
      });

      map.addSource("lot-revenue", {
        type: "geojson",
        data: LotRevenue,
      });

      map.addLayer({
        id: "lot-revenue-layer",
        type: "circle",
        source: "lot-revenue",
        paint: {
          "circle-color": "rgba(0, 255, 0, 0.1)",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "revenue_per_space_per_day"],
            0,
            2, // Minimum value and corresponding radius
            58,
            20, // Maximum value and corresponding radius
          ],
          "circle-stroke-color": "blue",
          "circle-stroke-width": 0.5,
        },
      });

      // Add popup for hover interaction
      popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.on("mousemove", "lot-revenue-layer", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const revenue = e.features[0].properties.revenue_per_space_per_day;

        popup
          .setLngLat(coordinates)
          .setHTML(`Revenue per space per day: $${revenue}`)
          .addTo(map);
      });

      map.on("mouseleave", "lot-revenue-layer", () => {
        popup.remove();
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
        const scrollY = window.scrollY + window.innerHeight / 2;
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
        map.flyTo(Lot[0]);
        setTimeout(() => {
          map.setPaintProperty("parking-layer", "fill-opacity", 0);
        }, 100);

        break;

      case 1:
        map.flyTo(Lot[0]);
        map.addLayer({
          id: "parking-layer",
          type: "fill",
          source: "parking",
          "source-layer": "parkinglotarea",
          paint: {
            "fill-color": "black",
            "fill-opacity": 0,
          },
        });
        setTimeout(() => {
          map.setPaintProperty("parking-layer", "fill-opacity", 1);
        }, 100);
        map.removeLayer("massing-layer");
        map.removeLayer("lot-revenue-layer");

        break;

      case 2:
        setTimeout(() => {
          map.setPaintProperty("parking-layer", "fill-opacity", 0);
        }, 100);
        setTimeout(() => {
          map.flyTo(Lot[2]);
        }, 600);
        tweenStore.set(0);
        map.removeLayer(CNTower);
        map.removeLayer(SkyDome);
        break;

      case 3:
        map.addLayer(CNTower);
        map.addLayer(SkyDome);
        map.addLayer({
          id: "massing-layer",
          type: "fill-extrusion",
          source: "massing",
          "source-layer": "3DMassingToronto",
          paint: {
            "fill-extrusion-color": "#D3D3D3",
            "fill-extrusion-opacity": 0.8,
            "fill-extrusion-height": ["*", ["get", "height"], 0],
          },
        });
        tweenStore.set(1);
        const unsubscribe = tweenStore.subscribe((value) => {
          map.setPaintProperty("massing-layer", "fill-extrusion-height", [
            "*",
            ["get", "height"],
            value,
          ]);
        });
        break;

      case 4:
        map.flyTo(Lot[3]);
        break;

      case 5:
        map.flyTo(Lot[4]);
        break;
    }
  };
</script>

<div class="indicator">Section: {currentSection + 1}</div>

<div class="main">
  <div id="map" class="map-container"></div>

  <div class="section">
    <div class="child">
      <h3>{Lot[0].title}</h3>
      <p>{Lot[0].content}</p>
    </div>
  </div>

  <div class="section">
    <div class="child">
      <h3>{Lot[1].title}</h3>
      <p>{Lot[1].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="child">
      <h3>{Lot[2].title}</h3>
      <p>{Lot[2].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="child">
      <h3>{Lot[3].title}</h3>
      <p>{Lot[3].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="child">
      <h3>{Lot[4].title}</h3>
      <p>{Lot[4].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="child">
      <h3>{Lot[5].title}</h3>
      <p>{Lot[5].content}</p>
    </div>
  </div>
</div>

<style>
  .map-container {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 0;
  }

  .section {
    z-index: 1;
    top: 0;
    left: 0;
    min-height: 100vh;
    width: 50%;
    pointer-events: none;
  }

  .child {
    position: relative;
    top: 0px;
    background-color: rgba(255, 255, 255, 0.8);
    width: 100%;
    pointer-events: all;
  }

  .indicator {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 0.5rem;
    z-index: 1000;
  }

  .main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
