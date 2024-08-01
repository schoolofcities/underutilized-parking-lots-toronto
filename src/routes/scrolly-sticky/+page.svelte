<script>
    import { onMount, onDestroy } from "svelte";
    import maplibregl from "maplibre-gl";
    import * as pmtiles from "pmtiles";
	  import BaseLayer from "../../data/toronto.json";
	  import "../../assets/maplibre-gl.css";
	  import { SkyDome, CNTower } from '../../data/3dModels.js';
    import Lot from "../../data/lots.json";
   
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import { writable } from 'svelte/store';

    const tweenStore = tweened(0, {
      duration: 500,
      easing: cubicOut,
    });

	  // const tweenStore = writable(0);
	  // tweenedValue.subscribe(value => tweenStore.set(value));
  
    let sections = [];
    let currentSection = 0;
    let ticking = false;

    let map;
    let MASSING_URL = "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
    let PARKING_URL = "/underutilized-parking-lots-toronto/ParkingLotArea.pmtiles";
	  let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";


    let scale = new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: "metric",
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
        // case 1:    
        //   break;
        case 1:
        map.flyTo(Lot[0]);
          map.addLayer({
            "id": "parking-layer",
            "type": "fill",
            "source": "parking",
            "source-layer": "parkinglotarea",
            "paint": {
                "fill-color": "black",
                "fill-opacity": 0,
            },
          });
          setTimeout(() => {
            map.setPaintProperty("parking-layer", "fill-opacity", 1);
        }, 100); 
          break;
        case 2:
        setTimeout(() => {
            map.setPaintProperty("parking-layer", "fill-opacity", 0);
        }, 100);
        setTimeout(() => {
        map.flyTo(Lot[2]);
    }, 600);
    // map.removeLayer("massing-layer");
    tweenStore.set(0);
          break;
        case 3:
          map.addLayer({
            "id": "massing-layer",
            "type": "fill-extrusion",
            "source": "massing",
            "source-layer": "3DMassingToronto",
            "paint": {
              "fill-extrusion-color": "#D3D3D3",
              "fill-extrusion-height": ["*", ["get", "height"], 0],
            },
          });
          tweenStore.set(1);
          const unsubscribe = tweenStore.subscribe(value => {
        map.setPaintProperty("massing-layer", "fill-extrusion-height", ["*", ["get", "height"], value]);
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

    const attributions = [
			'<a href="https://openstreetmap.org">OpenStreetMap</a>',
			// '<a href="https://github.com/Moraine729/Toronto_Heat_Vulnerability">Github</a>',
			'<a href="https://open.toronto.ca/">City of Toronto </a>',
		];

		const attributionString = attributions.join(", ");

		map.addControl(scale, "bottom-left");

    // map.touchZoomRotate.disableRotation();
		// map.dragRotate.disable();
		// map.touchZoomRotate.disableRotation();
		// map.scrollZoom.disable();
		// map.dragPan.disable();

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

        map.addLayer(CNTower);

        map.addLayer(SkyDome);

        map.addSource("massing", {
        type: "vector",
        url: "pmtiles://" + MASSING_URL,
        });

        map.addSource("parking", {
        type: "vector",
        url: "pmtiles://" + PARKING_URL,
        });

        });

      // SCROLL LISTENER
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    });

  </script>
  
  <style>
    .map-container {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: -1;
    }
  
    .section {
      min-height: 100vh;
      /* height: 80vh; */
      padding: 1rem;
      width: 50%;
      justify-content: center;
      align-items: center;
      /* font-size: 2rem; */
      /* border-bottom: 1px solid #ccc; */
    }
  
    .indicator {
      position: fixed;
      top: 1rem;
      left: 1rem;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 0.5rem;
    }

    .sticky {
      position: sticky;
      top: 0vh;
      background-color: rgba(255, 255, 255, 0.8);
      /* min-height: 50vh; */
    }

    .main {
      /* top: 30vh; */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  </style>
  
  <div class="indicator">Section: {currentSection + 1}</div>
  <div id="map" class="map-container"></div>
  <div class="main">
  <div class="section">
    <div class="sticky">
    <h3>{Lot[0].title}</h3>
    <p>{Lot[0].content}</p>
    </div>
  </div>
  <!-- <div class="section"></div> -->
  <div class="section">
    <div class="sticky">
    <h3>{Lot[1].title}</h3>
    <p>{Lot[1].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="sticky">
    <h3>{Lot[2].title}</h3>
    <p>{Lot[2].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="sticky">
    <h3>{Lot[3].title}</h3>
    <p>{Lot[3].content}</p>
    </div>
  </div>
  <div class="section">
    <div class="sticky">
    <h3>{Lot[4].title}</h3>
    <p>{Lot[4].content}</p>
    </div>
  </div> 
  <div class="section">
    <div class="sticky">
    <h3>{Lot[5].title}</h3>
    <p>{Lot[5].content}</p>
    </div>
  </div>
</div>
