// IMPORTS  
let PARKING_URL = "/underutilized-parking-lots-toronto/parking-lots.pmtiles";
let ZONING_EMP = "/underutilized-parking-lots-toronto/zoning-emp.pmtiles";
let ZONING_RES = "/underutilized-parking-lots-toronto/zoning-res.pmtiles";

import CityMask from "../data/city-mask.geo.json";
import GreenPStats from "../data/green-p-revenue-and-park-area.geo.json";
import CaseStudyStats from "../data/case-studies-revenue-and-park-area.geo.json";

import SubwayLines from "../data/subway-lines.geo.json";
import SubwayStations from "../data/subway-stations.geo.json";

import SubwayBufferAll from "../data/subway-1km-buffer-all.geo.json";
import SubwayBufferMask from "../data/subway-1km-negative-mask.geo.json";

import CaseStudies from "../data/case-studies.geo.json";
import CaseStudiesArea from "../data/case-studies-area.geo.json";
import CaseStudiesBldgs from "../data/case-study-bldgs.geo.json";

// SOURCES
export const sources = {
    parkingLots: {
        type: 'vector',
        url: `pmtiles://${PARKING_URL}`
    },
    zoningEmployment: {
        type: 'vector',
        url: `pmtiles://${ZONING_EMP}`
    },
    zoningResidential: {
        type: 'vector',
        url: `pmtiles://${ZONING_RES}`
    },
    cityMask: {
        type: 'geojson',
        data: CityMask
    },
    greenPStats: {
        type: 'geojson',
        data: GreenPStats
    },

    SubwayLines: {
        type: 'geojson',
        data: SubwayLines
    },
    SubwayStations: {
        type: 'geojson',
        data: SubwayStations
    },
    SubwayBufferAll: {
        type: 'geojson',
        data: SubwayBufferAll
    },
    SubwayBufferMask: {
        type: 'geojson',
        data: SubwayBufferMask
    },
    CaseStudies: {
        type: 'geojson',
        data: CaseStudies
    },
    CaseStudiesArea: {
        type: 'geojson',
        data: CaseStudiesArea
    },
    CaseStudyStats: {
        type: 'geojson',
        data: CaseStudyStats
    },
    CaseStudiesBldgs: {
        type: 'geojson',
        data: CaseStudiesBldgs
    },
};

// LAYERS
export const layers = {

    parkingLotsAllLayer: {
        id: 'parking-lots-all-layer',
        type: 'fill',
        source: 'parkingLots',
        'source-layer': 'parkinglotsclass',
        paint: {
            "fill-color": "black",
            "fill-opacity": 1
        }
    },
    parkingLotsResLayer: {
        id: 'parking-lots-res-layer',
        type: 'fill',
        source: 'parkingLots',
        'source-layer': 'parkinglotsclass',
        filter: ['==', ['get', 'type'], 'res'],
        paint: {
            "fill-color": "black",
            "fill-opacity": 0
        }
    },
    parkingLotsEmpLayer: {
        id: 'parking-lots-emp-layer',
        type: 'fill',
        source: 'parkingLots',
        'source-layer': 'parkinglotsclass',
        filter: ['==', ['get', 'type'], 'emp'],
        paint: {
            "fill-color": "black",
            "fill-opacity": 0
        }
    },
    revenuePerSpaceLayer: {
        id: 'revenue-per-space-layer',
        type: 'circle',
        source: 'greenPStats',
        paint: {
            "circle-color": "#00A189",
            "circle-opacity": 0,
            "circle-radius":
                [
                    "interpolate",
                    ["linear"],
                    ["get", "revenue_per_space_per_day"],
                    0, 3,
                    50, 25
                ]
            ,
            "circle-stroke-color": "white",
            "circle-stroke-width": 0.5,
            "circle-stroke-opacity": 0
        }
    },

    greenPStatsLayer: {
        id: 'green-p-stats-layer',
        type: 'circle',
        source: 'greenPStats',
        paint: {
            "circle-color": "#00A189",
            "circle-opacity": 0,
            "circle-radius": 6,
            "circle-stroke-color": "white",
            "circle-stroke-width": 0.5,
            "circle-stroke-opacity": 0,

        }
    },

    caseStudyRevenuePerSpaceLayer: {
        id: 'case-study-revenue-per-space-layer',
        type: 'circle',
        source: 'CaseStudyStats',
        paint: {
            "circle-color": "#00A189",
            "circle-opacity": 0,
            "circle-radius":
                [
                    "interpolate",
                    ["linear"],
                    ["get", "revenue_per_space_per_day"],
                    0, 3,
                    50, 30
                ]
            ,
            "circle-stroke-color": "white",
            "circle-stroke-width": 0.5,
            "circle-stroke-opacity": 0
        }
    },

    subwayBufferMaskLayer: {
        id: 'subway-buffer-mask-layer',
        type: 'fill',
        source: 'SubwayBufferMask',
        paint: {
            "fill-color": "white",
            "fill-opacity": 0,
        }
    },
    subwayBufferAllLayer: {
        id: 'subway-buffer-all-layer',
        type: 'line',
        source: 'SubwayBufferAll',
        paint: {
            "line-color": "black",
            "line-width": 1,
            "line-opacity": 0,
        }
    },
    subwayLinesLayer: {
        id: 'subway-lines-layer',
        type: 'line',
        source: 'SubwayLines',
        paint: {
            "line-color": "black",
            "line-width": 0.8,
            "line-dasharray": [3, 2],
            "line-opacity": 0,
        }
    },
    subwayStationsLayer: {
        id: 'subway-stations-layer',
        type: 'circle',
        source: 'SubwayStations',
        paint: {
            "circle-color": "black",
            "circle-opacity": 0,
            "circle-radius": 1,
            "circle-stroke-color": "black",
            "circle-stroke-width": 1,
            "circle-stroke-opacity": 0,
        }
    },
    subwayStationsTextLayer: {
        id: 'subway-stations-text-layer',
        type: 'symbol',
        source: 'SubwayStations',
        layout: {
            "text-field": ["get", "LOCATION_N"],
            "text-size": 9,
            "text-font": ["TradeGothic LT Regular"],
            "text-anchor": "center",
            "text-offset": [0, 1.5]
        },
        paint: {
            "text-color": "black",
            "text-opacity": 0,
            "text-halo-color": "white",
        }
    },
    cityMaskLayer: {
        id: 'city-mask-layer',
        type: 'fill',
        source: 'cityMask',
        paint: {
            "fill-color": "rgba(255, 255, 255, 0.6)",
            "fill-outline-color": "rgba(0, 0, 0, 1)",
        }
    },
    caseStudiesCircleLayer: {
        id: 'case-studies-circle-layer',
        type: 'circle',
        source: 'CaseStudies',
        paint: {
            "circle-color": "white",
            "circle-opacity": 0,
            "circle-radius": 8,
            "circle-stroke-color": "#0D534D",
            "circle-stroke-width": 1.5,
            "circle-stroke-opacity": 0,
        }
    },
    caseStudiesTextLayer: {
        id: 'case-studies-text-layer',
        type: 'symbol',
        source: 'CaseStudies',
        layout: {
            "text-field": ["get", "order"],
            "text-size": 12,
            "text-font": ["TradeGothic LT Bold"],
            "text-anchor": "center"
        },
        paint: {
            "text-color": "#0D534D",
            "text-opacity": 0
        }
    },
    caseStudiesAreaLayer: {
        id: 'case-studies-area-layer',
        type: 'line',
        source: 'CaseStudiesArea',
        paint: {
            "line-color": "rgba(0, 0, 0, 1)",
            "line-width": 1,
            "line-dasharray": [4, 3],
            "line-opacity": 0,
        }
    },
    caseStudiesBldgsLayer: {
        id: 'case-studies-bldgs-layer',
        type: 'fill',
        source: 'CaseStudiesBldgs',
        paint: {
            "fill-color": "black",
            "fill-opacity": 0,
            "fill-outline-color": "white",
        }
    },
};