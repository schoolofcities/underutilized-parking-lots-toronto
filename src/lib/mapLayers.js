// IMPORTS  
let PARKING_EMPLOYMENT_URL = "/underutilized-parking-lots-toronto/ParkingLotAreaEmployment.pmtiles";
let PARKING_RESIDENTIAL_URL = "/underutilized-parking-lots-toronto/ParkingLotAreaResidential.pmtiles";

import CityMask from "../data/city-mask.geo.json";
import EmploymentAreas from "../data/employment-areas.geo.json";
import GreenPStats from "../data/green-p-revenue-and-park-area.geo.json";
import CaseStudyStats from "../data/case-studies-revenue-and-park-area.geo.json";

import SubwayLines from "../data/subway-lines.geo.json";
import SubwayStations from "../data/subway-stations.geo.json";
import SubwayStationNames from "../data/subway-station-names.geo.json";

import SubwayBuffer from "../data/subway-1km-buffer.geo.json";
import SubwayBufferAll from "../data/subway-1km-buffer-all.geo.json";
import SubwayBufferMask from "../data/subway-1km-negative-mask.geo.json";

import CaseStudies from "../data/case-studies.geo.json";
import CaseStudiesArea from "../data/case-studies-area.geo.json";
import CaseStudiesBldgs from "../data/case-study-bldgs.geo.json";

// SOURCES
export const sources = {
    parkingLotsEmployment: {
        type: 'vector',
        url: `pmtiles://${PARKING_EMPLOYMENT_URL}`
    },
    parkingLotsResidential: {
        type: 'vector',
        url: `pmtiles://${PARKING_RESIDENTIAL_URL}`
    },
    cityMask: {
        type: 'geojson',
        data: CityMask
    },
    employmentAreas: {
        type: 'geojson',
        data: EmploymentAreas
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
    SubwayStationNames: {
        type: 'geojson',
        data: SubwayStationNames
    },
    SubwayBuffer: {
        type: 'geojson',
        data: SubwayBuffer
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

    parkingLotsLayer: {
        id: 'parking-lots-layer',
        type: 'fill',
        source: 'parkingLots',
        'source-layer': 'parkinglotareaclipped',
        paint: {
            "fill-color": "black"
        }
    },
    parkingLotsEmploymentLayer: {
        id: 'parking-lots-employment-layer',
        type: 'fill',
        source: 'parkingLotsEmployment',
        'source-layer': 'parkinglotsemployment',
        paint: {
            "fill-color": "black",
            "fill-opacity": 1
        }
    },
    parkingLotsResidentialLayer: {
        id: 'parking-lots-residential-layer',
        type: 'fill',
        source: 'parkingLotsResidential',
        'source-layer': 'parkinglotsresidential',
        paint: {
            "fill-color": "black",
            "fill-opacity": 1
        }
    },
    employmentAreasLayer: {
        id: 'employment-areas-layer',
        type: 'line',
        source: 'employmentAreas',
        paint: {
            "line-color": "#DC4633",
            "line-width": 1,
            "line-dasharray": [2, 1],
            "line-opacity": 0,
        }
    },

    revenuePerSpaceLayer: {
        id: 'revenue-per-space-layer',
        type: 'circle',
        source: 'greenPStats',
        paint: {
            "circle-color": "#00A189",
            "circle-opacity": 0, // Semi-transparent fill
            "circle-radius": 
            [
                "interpolate",
                ["linear"],
                ["get", "revenue_per_space_per_day"],
                0, 3,    // Minimum value corresponds to a radius of 3
                50,30  // Maximum value corresponds to a radius of 50
            ]
            ,
            "circle-stroke-color": "white", // Stroke color
            "circle-stroke-width": 1, // Stroke width
            "circle-stroke-opacity": 0 // Semi-transparent stroke
        }
    },

        greenPStatsLayer: {
        id: 'green-p-stats-layer',
        type: 'circle',
        source: 'greenPStats',
        paint: {
            "circle-color": "#00A189", // Fill color
            "circle-opacity": 0, // Lower opacity for the fill
            "circle-radius": 6,
            "circle-stroke-color": "white", // Stroke color
            "circle-stroke-width": 0.5, // Stroke width
            "circle-stroke-opacity": 0, // Stroke opacity

        }
    },

    caseStudyRevenuePerSpaceLayer: {
        id: 'case-study-revenue-per-space-layer',
        type: 'circle',
        source: 'CaseStudyStats',
        paint: {
            "circle-color": "#00A189",
            "circle-opacity": 0, // Semi-transparent fill
            "circle-radius": 
            [
                "interpolate",
                ["linear"],
                ["get", "revenue_per_space_per_day"],
                0, 3,    // Minimum value corresponds to a radius of 3
                50,30  // Maximum value corresponds to a radius of 50
            ]
            ,
            "circle-stroke-color": "white", // Stroke color
            "circle-stroke-width": 1, // Stroke width
            "circle-stroke-opacity": 0 // Semi-transparent stroke
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


    subwayBufferLayer: {
        id: 'subway-buffer-layer',
        type: 'line',
        source: 'SubwayBuffer',
        paint: {
            "line-color": "lightgrey",
            "line-width": 0.5,
            "line-opacity": 0,
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
            "line-width": .5,
            "line-dasharray": [3, 2],
            "line-opacity": 0,
        }
    },
    subwayStationsLayer: {
        id: 'subway-stations-layer',
        type: 'circle',
        source: 'SubwayStations',
        paint: {
            "circle-color": "black", // Fill color
            "circle-opacity": 0, // Lower opacity for the fill
            "circle-radius": 1,
            "circle-stroke-color": "black", // Stroke color
            "circle-stroke-width": 1, // Stroke width
            "circle-stroke-opacity": 0, // Stroke opacity
        }
    },
    subwayStationsTextLayer: {
        id: 'subway-stations-text-layer',
        type: 'symbol',
        source: 'SubwayStations',
        layout: {
            "text-field": ["get", "LOCATION_N"], // Use the "LOCATION_N" property for the text
            "text-size": 9, // Adjust text size as needed
            "text-font": ["TradeGothic LT Regular"], // Font style
            "text-anchor": "center", // Center the text
            "text-offset": [0, 1.5] // Offset the text slightly above the circle
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
            "fill-color": "rgba(255, 255, 255, 0.5)",
            "fill-outline-color": "rgba(0, 0, 0, 1)",
        }
    },
    caseStudiesCircleLayer: {
        id: 'case-studies-circle-layer',
        type: 'circle',
        source: 'CaseStudies',
        paint: {
            "circle-color": "white", // Fill color
            "circle-opacity": 0, // Lower opacity for the fill
            "circle-radius": 8,
            "circle-stroke-color": "#0D534D", // Stroke color
            "circle-stroke-width": 1.5, // Stroke width
            "circle-stroke-opacity": 0, // Stroke opacity
        }
    },
    caseStudiesTextLayer: {
        id: 'case-studies-text-layer',
        type: 'symbol',
        source: 'CaseStudies',
        layout: {
            "text-field": ["get", "order"], // Use the "order" property for the text
            "text-size": 12, // Adjust text size as needed
            "text-font": ["TradeGothic LT Bold"], // Font style
            "text-anchor": "center" // Center the text in the circle
        },
        paint: {
            "text-color": "#0D534D", // Text color
            "text-opacity": 0 // Text opacity
        }
    },
    caseStudiesAreaLayer: {
        id: 'case-studies-area-layer',
        type: 'line',
        source: 'CaseStudiesArea',
        paint: {
            "line-color": "rgba(0, 0, 0, 1)", // Outline color
            "line-width": 1, // Width of the dashed line
            "line-dasharray": [4, 3], // Dash pattern: 4px dash, 2px gap
            "line-opacity": 0, // Opacity of the line
        }
    },
caseStudiesBldgsLayer: {
        id: 'case-studies-bldgs-layer',
        type: 'fill', // Changed to fill
        source: 'CaseStudiesBldgs',
        paint: {
            "fill-color": "black", // Fill color
            "fill-opacity": 0, // Set fill  opacity
            "fill-outline-color": "white", // Outline color
        }
    },
};