<script>
  import Top from "$lib/TopSofC.svelte";
  import Map from "../../lib/Map.svelte";

  const scrollyContents = {
    main: {
      title: "Toronto",
      center: [-79.37, 43.715],
      zoom: 10.25,
      pitch: 0,
      bearing: -17.1,
      content:
        "Hello I am some text! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    first: {
      title: "Location 1: University of Toronto - Front Campus",
      x: -79.39501261819757,
      y: 43.66172404148308,
      center: [-79.39501261819757, 43.66172404148308],
      zoom: 14.5,
      pitch: 85,
      bearing: -100,
      content:
      "Hello I am some  text! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    second: {
      title: "Location 2: Fort York",
      center: [-79.40744, 43.63588],
      x: -79.40744,
      y: 43.63588,
      zoom: 15,
      pitch: 50,
      bearing: -540,
      content:
        "Hello I am some more text! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    third: {
      title: "Location 3: Bloor West Village",
      center: [-79.48587, 43.64944],
      x: -79.48587,
      y: 43.64944,
      zoom: 17,
      content:
        "Hello I am some more more text! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    fourth: {
      title: "Location 4: Greektown",
      center: [-79.34503, 43.67764],
      x: -79.34503,
      y: 43.67764,
      zoom: 15,
      content:
        "Hello text I am! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    fifth: {
      title: "Location 5: Pearson Airport (YYZ)",
      center: [-79.63305626708764, 43.6773430191257],
      x: -79.63305626708764,
      y: 43.6773430191257,
      zoom: 13,
      content:
        "Hello text I am! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    sixth: {
      title: "Location 6: Centre Island",
      center: [-79.335039692013595, 43.621808848554913],
      x: -79.335039692013595,
      y: 43.621808848554913,
      zoom: 12.5,
      content:
        "Hello text I am! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    seventh: {
      title: "Location 7: Brickworks Park",
      center: [-79.365696898705082, 43.686067067480138],
      x: -79.365696898705082,
      y: 43.686067067480138,
      zoom: 16,
      content:
        "Hello text I am! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    eighth: {
      title: "Location 8: Dufferin Grove Park",
      center: [-79.432420995345439, 43.656155296043686],
      x: -79.432420995345439, 
      y: 43.656155296043686,
      zoom: 16,
      content:
        "Hello text I am! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  };

</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
  <script src="https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.js" />
</svelte:head>

<Top />

<Map {scrollyContents} />