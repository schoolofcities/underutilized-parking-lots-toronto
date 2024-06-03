import { writable } from 'svelte/store';

export const showHospitals = writable(false);
export const showCooling = writable(false);
export const showPool = writable(false);
export const showAptNoAir = writable(false);