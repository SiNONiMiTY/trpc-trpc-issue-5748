<script lang="ts">
    import { trpcClientStore } from '$lib/stores'
    import { onMount } from 'svelte'

    let number = 0

    onMount(() => {
        $trpcClientStore.ws.randomNumber.subscribe(undefined, {
            onData: ({ randomNumber }) => {
                number = randomNumber
            },
        })
    })
</script>

<span>The number is {number}</span>
