<script>
	import { onMount } from 'svelte';
	
	let isFirefox = false;
	let isVisible = true;
	
	onMount(() => {
		isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
	});
	
	function closeMessage() {
		isVisible = false;
	}
</script>

{#if isFirefox && isVisible}
	<div class="firefox-message">
        <div class="message-content">
		    This map isn't working great on Firefox.
            <br>
            Please use a different web browser for the best experience!
	    </div>
        <button class="close-button" on:click={closeMessage} aria-label="Close message">
            ×
        </button>
    </div>
{/if}

<style>
	.firefox-message {
		background-color: red; /* Firefox orange */
		color: white;
		padding: 8px 16px;
		border-radius: 4px;
		font-weight: bold;
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		text-align: center;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.message-content {
		flex: 1;
	}
	
	.close-button {
		background: none;
		border: none;
		color: white;
		font-size: 20px;
		font-weight: bold;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 2px;
		transition: background-color 0.2s ease;
	}
	
	.close-button:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}
	
	.close-button:focus {
		outline: 2px solid white;
		outline-offset: 2px;
	}
</style>