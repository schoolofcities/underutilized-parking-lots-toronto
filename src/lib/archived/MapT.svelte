<script>
    import Map from "../lib/Map.svelte";
    import { showHospitals, showCooling, showPool, showAptNoAir } from '../routes/stores.js';
    import '../assets/styles.css'; 
    //  import { step } from './stores';
    import { writable } from 'svelte/store';

    
    export let step;

    // // Create a writable store for the index
    // let mapIndex = writable('vulnerability');

    // // Subscribe to changes in the step value
    // $: {
    //     if (step === 0) {
    //         mapIndex.set('vulnerability');
    //     } else if (step === 1) {
    //         mapIndex.set('adaptive');
    //     } else if (step === 2) {
    //         mapIndex.set('sensitivity');
    //     }
    // }

    // let index = mapIndex;
</script>

<!-- <Map {index} {showHospitals} {showCooling} {showPool} {showAptNoAir}/> -->


{#if step === 0}
    <Map index="adaptive" step={step}/>
{:else if step === 1}
    <Map index="adaptivee" step={step}/>
{:else if step === 2}
    <Map index="adaptive2" step={step}/>
{/if}
