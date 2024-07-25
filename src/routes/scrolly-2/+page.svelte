<script>
      import Top from "$lib/TopSofC.svelte";
      import Scrolly from "../../lib/Scrolly.svelte";
      import Map from "../../lib/ScrollyMap.svelte";
      import Lot from "../../data/lots.json";

      let value;
      const spacer = "spacer"

      function LotText(i) {
            return { 
            title: Lot[i].title, 
            content: Lot[i].content 
            };
      }

      // Data for divs
      const step = [
            LotText(0),
            LotText(1),
            LotText(2),
            spacer,
            spacer,
            LotText(3),
            LotText(4),
            LotText(5),
            spacer,
            LotText(6),
            ];
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
  <script src="https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.js" />
</svelte:head>

<Top/>

<section>

<div class="hero">
<h1>Underutilized Parking Lots in Toronto</h1>
<h2>By <a href="link" target="_blank">Author</a></h2>
</div>

<div class="section-container">
      <div class="steps-container">
            <Scrolly bind:value>
                  {#each step as text, i}
                  {#if text === 'spacer'}
                  <div class="spacer"></div>
                  {:else}
                  <div class="step" class:active={value === i}>
                        <div class="step-content">
                        <h3>{text.title}</h3>
                        <p>{text.content}</p>
                        </div>      
                  </div>
                  {/if}
                  {/each}
                  <div class="spacer"></div>
            </Scrolly>
      </div>

      <div class="sticky">
            <Map step={value} />
      </div>

</div>

<div class="spacer"></div>

</section>


<style>

      :global(body) {
		overflow-x: hidden;
	}

      * {
            font-family: sans-serif;
      }

      .hero {
		height: 60vh;
		display: flex;
		place-items: center;
		flex-direction: column;
		justify-content: center;
		text-align: center;
	}

      .hero h2 {
		margin-top: 0;
		font-weight: 200;
	}

      .spacer {
            height: 80vh;
      }

      .sticky {
    position: sticky;
    top: 10%;
		flex: 1 1 60%;
    width: 60%;
  }

      .section-container {
    margin-top: 1em;
    text-align: center;
    transition: background 100ms;
    display: flex;
  }

  .step {
    height: 80vh;
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

  .step.active .step-content {
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

  @media screen and (max-width: 768px) {
    .section-container {
      flex-direction: column-reverse;
    }
    .sticky {
      width: 95%;
			margin: auto;
    }
  }

</style>
