<script>

import Top from "$lib/TopSofC.svelte";
import "../assets/styles.css";

import Scrolly from "../lib/Scrolly.svelte";
import Map from "../lib/MapLots.svelte";

let textWidth;

// let scrollyContent = [
// 	{
// 		"x": -79.40896,
// 		"y": 43.66485,
// 		"zoom": 16,
// 		"text": "Hello I am some text!",
// 	},
// 	{
// 		"x": -79.40744,
// 		"y": 43.63588,
// 		"zoom": 15,
// 		"text": "Hello I am some more text!",
// 	},
// 	{
// 		"x": -79.48587,
// 		"y": 43.64944,
// 		"zoom": 17,
// 		"text": "Hello I am some more more text!",
// 	},
// 	{
// 		"x": -79.34503,
// 		"y": 43.67764,
// 		"zoom": 15,
// 		"text": "Hello text I am!",
// 	}
// ]


var parkingPercent = 0.18;
var greenPercent = 0.24;

let value;
const step = [
	"This is a Green P Parking lot at Y and Z",
	"woof",
	"moo"
];

$: console.log(value);


</script>




<Top/>




<div class='intro'>

	<video src='./air-pollution-and-premature-mortality/skylineVideo.mp4' poster='./air-pollution-and-premature-mortality/skylineVideoPoster.png' muted preload autoplay loop playsinline></video>
	<div class='intro-overlay'>
		<h1>Title Yes Here</h1>
	</div>

</div>


<div class="text">

	<p>
		Some introductory text on surface parking lots, why they are bad, etc. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		More introductory text on surface parking lots, why they are bad, etc. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>

	<div class="map-legend" bind:offsetWidth={textWidth}>
		<svg width={textWidth} height=90>
			<text
				x="{textWidth / 2}" 
				y="18" 
				font-size="16"
				font-family="TradeGothicBold"
				text-anchor="middle"
			>
				City of Toronto = 630km2
			</text>

			<line
				x1=1
				x2={textWidth / 2 - 90}
				y1=13
				y2=13
				stroke-width=0.5
				stroke="#4d4d4d"
			/>
			<line
				x1={textWidth / 2 + 90}
				x2={textWidth - 1}
				y1=13
				y2=13
				stroke-width=0.5
				stroke="#4d4d4d"
			/>

			<rect 
				x="1" 
				y="30" 
				width={textWidth - 2} 
				height="15"
				style="fill:#fff;stroke:#D0D1C9;stroke-width:1;"
			/>
			<rect 
				x="1" 
				y="30" 
				width={parkingPercent * (textWidth - 2)} 
				height="15"
				style="fill:#000;stroke:#D0D1C9;stroke-width:1;"
			/>
			<rect 
				x="{1 + parkingPercent * (textWidth - 2)}" 
				y="30" 
				width={0.25 * (textWidth - 2)} 
				height="15"
				style="fill:#ccf4c9;stroke:#D0D1C9;stroke-width:1;"
			/>
			<text
				x="{parkingPercent * textWidth / 2}" 
				y="60" 
				font-size="14"
				font-family="TradeGothicBold"
				text-anchor="middle"
			>
				Surface Parking
			</text>
			<text
				x="{parkingPercent * textWidth / 2}" 
				y="80" 
				font-size="18"
				font-family="TradeGothicBold"
				text-anchor="middle"
			>
				{parkingPercent * 100}%
			</text>
			<text
				x="{parkingPercent * textWidth+ greenPercent * textWidth / 2}" 
				y="60" 
				font-size="14"
				font-family="TradeGothicBold"
				text-anchor="middle"
			>
				Green Space
			</text>
			<text
				x="{parkingPercent * textWidth + greenPercent * textWidth / 2}" 
				y="80" 
				font-size="18"
				font-family="TradeGothicBold"
				text-anchor="middle"
			>
				{greenPercent * 100}%
			</text>

		</svg>
	</div>

</div>



<div class="img-midsize">
	<img src='./images/map-all-parking-lots.png'/>
</div>

<div class="text">
	<p>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		Toronto Parking, via it's Green P banner, operated .  How little parking spaces make in terms of revenue. Below is a map of their approximate locations. 
	</p>
</div>

<div class="img-smallsize">
	<img src='./images/map-green-p.png'/>
</div>

<div class="text">
	<p>
		Overall, the more central lots make more revenue per space, unsurprisingly. These lots are typically smaller, in terms of total number of spaces. The average parking space has a revenue of $4.32 per day. Over 75% of parking spaces make less than 5$ per day.
	</p>
	<br>
	<br>
</div>


<div class="section-container">
	<div class="steps-container">
		<Scrolly bind:value>
			{#each step as text, i}
				<div class="step" class:active={value === i}>
					<div class="step-content">
						<p>{text}</p>
					</div>
				</div>      
			{/each}
		</Scrolly>
	</div>

	<div class="sticky">
		<Map step={value} />
	</div>

</div>


<div class="text">
	<p>
		Hello
	</p>
	<p>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		More text on surface parking lots, why they are bad, etc. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		More text on surface parking lots, why they are bad, etc. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
	<p>
		More text on surface parking lots, why they are bad, etc. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
	</p>
</div>

<style>

:global(body) {
	overflow-x: hidden;
}

.sticky {
    position: sticky;
    top: 10%;
	flex: 1 1 60%;
    width: 60%;
	background-color: blue;
  }

.section-container {
    margin-top: 1em;
    text-align: center;
    transition: background 100ms;
    display: flex;
  }

.step {
    height: 120vh;
    display: flex;
    place-items: center;
    justify-content: center;
}

  .step-content {
    font-size: 1rem;
    background: whitesmoke;
    color: #ccc;
    border-radius: 5px;
    padding: .5rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 500ms ease;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, .2);
    text-align: left;
		width: 75%;
		margin: auto;
		max-width: 500px;
  }

  .step.active {
		background: rgba(255, 255, 255, 0);
		color: black;
	}
  
  .step-content {
		background: white;
		color: black;
	}


  .sticky {
    height: 100%;
  }

  .steps-container {
    flex: 1 1 40%;
    z-index: 10;
  }

  @media screen and (max-width: 100vw) {
    .section-container {
      flex-direction: column-reverse;
    }
    .sticky {
      width: 100%;
			margin: auto;
    }
  }
</style>