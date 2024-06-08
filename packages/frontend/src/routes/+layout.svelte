<script lang="ts">
    import '../app.postcss'
</script>

<div class="flex overflow-hidden bg-white dark:bg-neutral-900">
    <div
        id="main-content"
        class="relative h-full w-full overflow-y-auto bg-white dark:bg-neutral-900"
    >
        <main class="min-h-screen">
            <slot />
        </main>
    </div>
</div>
