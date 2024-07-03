<script>
    import { onMount } from "svelte";
    import * as maplibregl from "maplibre-gl";
    import * as pmtiles from "pmtiles";
    import BaseLayer from "../data/toronto.json";
    import TestMassing from "../data/testMassing.geo.json";
    import "../assets/maplibre-gl.css";
    import { SkyDome, CNTower } from '../data/3dModels.js';
  
    let map;
    let MASSING_URL = "/underutilized-parking-lots-toronto/3DMassingToronto.pmtiles";
    let PMTILES_URL = "/underutilized-parking-lots-toronto/toronto.pmtiles";
    let pageHeight;
  
    let scale = new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });
  
    const maxBounds = [
        [-79.7712, 43.44],
        [-78.914763, 43.93074],
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
            center: [-79.3871, 43.6426],
            zoom: 15,
            pitch: 60,
            maxPitch: 85,
            maxZoom: 20,
            minZoom: 10,
            bearing: -17.1,
            projection: "globe",
            scrollZoom: true,
            maxBounds: maxBounds,
            attributionControl: true,
            antialias: true,
        });
  
        const attributions = [
            '<a href="https://openstreetmap.org">OpenStreetMap</a>',
            '<a href="https://open.toronto.ca/">City of Toronto </a>',
        ];
  
        const attributionString = attributions.join(", ");
  
        map.addControl(scale, "bottom-left");
        map.addControl(new maplibregl.NavigationControl(), 'top-left');
  
        let protoLayers = BaseLayer;
  
        map.on("load", function () {
  
            // Toronto base map tiles 
            map.addSource("protomaps", {
                type: "vector",
                url: "pmtiles://" + PMTILES_URL,
                attribution: attributionString,
                attributionControl: false,
            });
  
            protoLayers.forEach((e) => {
                map.addLayer(e);
            });

            // Test massing of new housing

            map.addSource("TestMassing", {
				"type": "geojson",
				"data": TestMassing,
			});

            map.addLayer({
                "id": "TestMassingBlue",
                "type": "fill-extrusion",
                "source": "TestMassing",
                "paint": {
                    "fill-extrusion-color": "blue",
                    "fill-extrusion-height": ["get", "height"],
                }
            })
          
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
  
        });
    });
  </script>
  
  <div id="map"/>
  
  <style>
    #map {
        position: fixed;
        width: 100%;
        height: 100%;
    }
  </style>
  