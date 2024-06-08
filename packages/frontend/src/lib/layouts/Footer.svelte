<script lang="ts">
    import { onMount } from 'svelte'

    import { sessionDataStore, trpcClientStore } from '$lib/stores.js'

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const sessionData = sessionDataStore()

    let footer: TRouterOutput['setting']['getFooter'] = {
        link: {},
    }

    const isWeb = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(async () => {
        footer = await $trpcClientStore.setting.getFooter.query({
            sessionId: $sessionData?.sessionId || '',
        })
    })
</script>

<div class="p-4">
    <footer
        class="rounded-lg border border-neutral-200 bg-white p-4 antialiased sm:flex sm:items-center sm:justify-between dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="flex justify-center">
            <p
                class="mb-1 text-center text-sm text-neutral-500 dark:text-neutral-300"
            >
                &copy; {new Date().getFullYear()} tRPC Subscription
            </p>
        </div>
        <div class="flex items-center justify-center space-x-1">
            <a
                href={footer.link?.facebook ? `${footer.link.facebook}` : '#'}
                target="_blank"
                data-tooltip-target="tooltip-facebook"
                class="inline-flex cursor-pointer justify-center rounded-lg p-2 text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-600"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 256 256"
                    {...$$props}
                >
                    <path
                        fill="#1877f2"
                        d="M256 128C256 57.308 198.692 0 128 0C57.308 0 0 57.308 0 128c0 63.888 46.808 116.843 108 126.445V165H75.5v-37H108V99.8c0-32.08 19.11-49.8 48.348-49.8C170.352 50 185 52.5 185 52.5V84h-16.14C152.959 84 148 93.867 148 103.99V128h35.5l-5.675 37H148v89.445c61.192-9.602 108-62.556 108-126.445"
                    />
                    <path
                        fill="#fff"
                        d="m177.825 165l5.675-37H148v-24.01C148 93.866 152.959 84 168.86 84H185V52.5S170.352 50 156.347 50C127.11 50 108 67.72 108 99.8V128H75.5v37H108v89.445A128.959 128.959 0 0 0 128 256a128.9 128.9 0 0 0 20-1.555V165z"
                    />
                </svg>
                <span class="sr-only">Facebook</span>
            </a>
            <div
                id="tooltip-facebook"
                role="tooltip"
                class="tooltip invisible absolute z-10 z-50 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-neutral-300 opacity-0 shadow-sm transition-opacity duration-300 dark:bg-neutral-700"
            >
                Like us on Facebook
                <div
                    class="tooltip-arrow"
                    data-popper-arrow
                ></div>
            </div>
            <!-- <a
                href="#"
                target="_blank"
                data-tooltip-target="tooltip-twitter"
                class="inline-flex cursor-pointer justify-center rounded-lg p-2 text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-600 dark:hover:text-white"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    {...$$props}
                >
                    <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        color="currentColor"
                    >
                        <path
                            d="m7 17l4.194-4.193M17 7l-4.193 4.194m0 0L9.777 7H7l4.194 5.807m1.612-1.614L17 17h-2.778l-3.028-4.193"
                        />
                        <path
                            d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"
                        />
                    </g>
                </svg>
                <span class="sr-only">Twitter</span>
            </a>
            <div
                id="tooltip-twitter"
                role="tooltip"
                class="tooltip invisible absolute z-10 z-50 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-neutral-700"
            >
                Follow us on Twitter
                <div
                    class="tooltip-arrow"
                    data-popper-arrow
                ></div>
            </div> -->
            <a
                href={footer.link?.youtube ? `${footer.link?.youtube}` : '#'}
                target="_blank"
                data-tooltip-target="tooltip-youtube"
                class="inline-flex cursor-pointer justify-center rounded-lg p-2 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-600 dark:hover:bg-neutral-600 dark:hover:text-white"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 20 20"
                    {...$$props}
                >
                    <path
                        fill="#ff0000"
                        d="M11.603 9.833L9.357 8.785C9.161 8.694 9 8.796 9 9.013v1.974c0 .217.161.319.357.228l2.245-1.048c.197-.092.197-.242.001-.334M10 .4C4.698.4.4 4.698.4 10s4.298 9.6 9.6 9.6s9.6-4.298 9.6-9.6S15.302.4 10 .4m0 13.5c-4.914 0-5-.443-5-3.9s.086-3.9 5-3.9s5 .443 5 3.9s-.086 3.9-5 3.9"
                    />
                </svg>
                <span class="sr-only">Youtube</span>
            </a>
            <div
                id="tooltip-youtube"
                role="tooltip"
                class="tooltip invisible absolute z-10 z-50 inline-block rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-neutral-700"
            >
                Subscribe us on Youtube
                <div
                    class="tooltip-arrow"
                    data-popper-arrow
                ></div>
            </div>
            <a
                href={footer.link?.website ? `${footer.link?.website}` : '#'}
                target="_blank"
                data-tooltip-target="tooltip-dribbble"
                class="inline-flex cursor-pointer justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-600 dark:hover:text-white"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 64 64"
                    {...$$props}
                >
                    <path
                        fill="currentColor"
                        d="M32 2C15.432 2 2 15.432 2 32s13.432 30 30 30s30-13.432 30-30S48.568 2 32 2m14.035 44.508h-5.65V26.882c0-.564.008-1.355.02-2.372c.014-1.018.02-1.802.02-2.353l-5.498 24.351h-5.893l-5.459-24.351c0 .551.006 1.335.02 2.353c.014 1.017.02 1.808.02 2.372v19.626h-5.65V17.492h8.824l5.281 22.814l5.242-22.814h8.725v29.016z"
                    />
                </svg>
                <span class="sr-only">tRPC Subscription</span>
            </a>
            <div
                id="tooltip-dribbble"
                role="tooltip"
                class="tooltip invisible absolute z-10 z-50 inline-block rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-neutral-700"
            >
                Visit us on Website
                <div
                    class="tooltip-arrow"
                    data-popper-arrow
                ></div>
            </div>
        </div>
    </footer>
</div>
