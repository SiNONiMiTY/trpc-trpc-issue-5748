<script lang="ts">
    import type { Drawer } from 'flowbite'
    import { onMount } from 'svelte'

    import { myPts, sessionDataStore, trpcClientStore } from '$lib/stores.js'

    ////////////////////
    // Initialization //
    ////////////////////

    // Properties
    export let drawerElement: Drawer

    // Custom Stores
    const sessionData = sessionDataStore()

    // Generic
    const isWeb = true
    let forApprovalCount = 0
    let cashOutCount = 0

    ///////////////
    // Lifecycle //
    ///////////////

    onMount(() => {
        $trpcClientStore.ws.signUpApproval.subscribe(
            { sessionId: $sessionData?.sessionId || '' },
            {
                onData: (value) => {
                    forApprovalCount = (value as Record<string, number>).count
                },
            },
        )

        $trpcClientStore.ws.cashOutApproval.subscribe(
            { sessionId: $sessionData?.sessionId || '' },
            {
                onData: (value) => {
                    cashOutCount = (value as Record<string, number>).count
                },
            },
        )
    })
</script>

<aside
    id="logo-sidebar"
    class="{$sessionData?.isVerified
        ? 'pt-16'
        : 'pt-28'} fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-neutral-300 bg-white transition-transform lg:translate-x-0 dark:border-neutral-600 dark:bg-neutral-800"
    aria-label="Sidebar"
>
    <div class="h-full overflow-y-auto bg-white px-3 py-4 dark:bg-neutral-800">
        <ul class="space-y-2 font-medium">
            <li>
                <a
                    href="/app/dashboard"
                    class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                    on:click={() => drawerElement.hide()}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        viewBox="0 0 16 16"
                    >
                        <path
                            d="M7.5 1.018a7 7 0 0 0-4.79 11.566L7.5 7.793zm1 0V7.5h6.482A7 7 0 0 0 8.5 1.018M14.982 8.5H8.207l-4.79 4.79A7 7 0 0 0 14.982 8.5M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"
                        />
                    </svg>

                    <span class="ms-3">Dashboard</span>
                </a>
            </li>

            {#if $sessionData?.isVerified}
                {#if $sessionData.rbacFlag & 1}
                    <li>
                        <a
                            href="/app/registration-batch"
                            on:click={() => drawerElement.hide()}
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1zm3.63-4.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"
                                />
                            </svg>

                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >Registration Batch</span
                            >
                        </a>
                    </li>
                {/if}
                {#if $sessionData?.rbacFlag === 8}
                    <li>
                        <a
                            href="/app/user-page"
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            on:click={() => drawerElement.hide()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m4-2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5M9 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 9 8m1 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5"
                                />
                                <path
                                    d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8.96q.04-.245.04-.5C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1 1 0 0 1 1 12z"
                                />
                            </svg>
                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >My Page</span
                            >
                        </a>
                    </li>
                {/if}
                {#if $myPts}
                    <li data-sveltekit-reload>
                        <a
                            href="/app/cashout"
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            on:click={() => drawerElement.hide()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
                                <path
                                    d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z"
                                />
                            </svg>
                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >Cash Out</span
                            >

                            <span
                                id="cashout"
                                class="ms-3 inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 p-3 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                >{cashOutCount}</span
                            >
                        </a>
                    </li>
                {:else}
                    <li>
                        <a
                            href="/app/cashout"
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            on:click={() => drawerElement.hide()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
                                <path
                                    d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z"
                                />
                            </svg>
                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >Cash Out</span
                            >

                            <span
                                id="cashout"
                                class="ms-3 inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 p-3 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                >{cashOutCount}</span
                            >
                        </a>
                    </li>
                {/if}

                {#if $sessionData?.rbacFlag & 3}
                    {#if $sessionData.rbacFlag & 1}
                        <li>
                            <a
                                href="/app/distribution"
                                class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                on:click={() => drawerElement.hide()}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                    viewBox="0 0 16 16"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M1 1.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 0-1h-13a.5.5 0 0 0-.5.5m0 13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 0-1h-13a.5.5 0 0 0-.5.5"
                                    />
                                    <path
                                        d="M2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"
                                    />
                                </svg>
                                <span class="ms-3 flex-1 whitespace-nowrap"
                                    >Distribution</span
                                >
                            </a>
                        </li>
                    {/if}

                    <li>
                        <a
                            href={isWeb ? '/app/member-approval' : ''}
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            on:click={() => drawerElement.hide()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
                                />
                                <path
                                    d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"
                                />
                            </svg>
                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >For Approval</span
                            >

                            <span
                                id="forApprovalCount"
                                class="ms-3 inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 p-3 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                >{forApprovalCount}</span
                            >
                        </a>
                    </li>
                    <li>
                        <a
                            href={isWeb ? '/app/member-list' : '/app/user-list'}
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            on:click={() => drawerElement.hide()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"
                                />
                            </svg>
                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >Members</span
                            >
                        </a>
                    </li>
                    <li>
                        <a
                            href={isWeb ? '/app/ranking/web' : ''}
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935M3.504 1q.01.775.056 1.469c.13 2.028.457 3.546.87 4.667C5.294 9.48 6.484 10 7 10a.5.5 0 0 1 .5.5v2.61a1 1 0 0 1-.757.97l-1.426.356a.5.5 0 0 0-.179.085L4.5 15h7l-.638-.479a.5.5 0 0 0-.18-.085l-1.425-.356a1 1 0 0 1-.757-.97V10.5A.5.5 0 0 1 9 10c.516 0 1.706-.52 2.57-2.864.413-1.12.74-2.64.87-4.667q.045-.694.056-1.469z"
                                />
                            </svg>

                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >Ranking</span
                            >
                        </a>
                    </li>
                    <li>
                        <a
                            href={isWeb ? '/app/wallet/web' : ''}
                            class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z"
                                />
                            </svg>

                            <span class="ms-3 flex-1 whitespace-nowrap"
                                >Wallet</span
                            >
                        </a>
                    </li>
                {/if}
                <!-- <li>
                    <a
                        href={isWeb ? '/app/product/web' : ''}
                        class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-300 group"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            class="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
                            viewBox="0 0 16 16"
                        >
                            <path
                                d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0M1.5 8.5A.5.5 0 0 1 2 9v6h1v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h6V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5M4 15h3v-5H4zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm3 0h-2v3h2z"
                            />
                        </svg>
                        <span class="ms-3 flex-1 whitespace-nowrap"
                            >Products</span
                        >
                    </a>
                </li> -->

                <!-- <li>
                    <a
                        href={isWeb ? '/app/sales/web' : ''}
                        class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-300 group"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            class="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
                            viewBox="0 0 16 16"
                        >
                            <path
                                d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27m.217 1.338L2 2.118v11.764l.137.274.51-.51a.5.5 0 0 1 .707 0l.646.647.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 0 0 1-.707 0L12 1.707l-.646.647a.5.5 0 0 1-.708 0L10 1.707l-.646.647a.5.5 0 0 1-.708 0L8 1.707l-.646.647a.5.5 0 0 1-.708 0L6 1.707l-.646.647a.5.5 0 0 1-.708 0L4 1.707l-.646.647a.5.5 0 0 1-.708 0z"
                            />
                            <path
                                d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m8-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5"
                            />
                        </svg>
                        <span class="ms-3 flex-1 whitespace-nowrap">Sales</span>
                    </a>
                </li> -->
            {/if}
            <li>
                <a
                    href={isWeb ? '/app/transactions/web' : ''}
                    class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        viewBox="0 0 16 16"
                    >
                        <path
                            d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"
                        />
                        <path
                            d="M5 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 5 8m0-2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-1-5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0M4 8a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m0 2.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"
                        />
                    </svg>

                    <span class="ms-3 flex-1 whitespace-nowrap"
                        >Transactions</span
                    >
                </a>
            </li>
            {#if Number($sessionData?.rbacFlag) & 3}
                <li>
                    <a
                        href={isWeb
                            ? '/app/admin-settings/web'
                            : '/app/admin-settings/mobile'}
                        on:click={() => drawerElement.hide()}
                        class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                    >
                        <svg
                            class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z"
                            ></path>
                        </svg>
                        <span class="ms-3 flex-1 whitespace-nowrap"
                            >Settings</span
                        >
                    </a>
                </li>
            {:else}
                <li>
                    <a
                        href="/app/donation"
                        on:click={() => drawerElement.hide()}
                        class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            {...$$props}
                        >
                            <path
                                fill="currentColor"
                                d="M16 12c2.76 0 5-2.24 5-5s-2.24-5-5-5s-5 2.24-5 5s2.24 5 5 5m5.45 5.6c-.39-.4-.88-.6-1.45-.6h-7l-2.08-.73l.33-.94L13 16h2.8c.35 0 .63-.14.86-.37s.34-.51.34-.82c0-.54-.26-.91-.78-1.12L8.95 11H7v9l7 2l8.03-3c.01-.53-.19-1-.58-1.4M5 11H.984v11H5z"
                            />
                        </svg>
                        <span class="ms-3 flex-1 whitespace-nowrap"
                            >Donation</span
                        >
                    </a>
                </li>
                <li>
                    <a
                        href="/app/user-settings"
                        on:click={() => drawerElement.hide()}
                        class="group flex items-center rounded-lg p-2 text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                    >
                        <svg
                            class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z"
                            ></path>
                        </svg>
                        <span class="ms-3 flex-1 whitespace-nowrap"
                            >Settings</span
                        >
                    </a>
                </li>
            {/if}
        </ul>
        <ul
            class="mt-4 space-y-2 border-t border-neutral-300 pt-4 font-medium dark:border-neutral-600"
        >
            <li>
                <a
                    href="#"
                    class="group flex items-center rounded-lg p-2 text-neutral-900 transition duration-75 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                >
                    <svg
                        class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M9 2.2V7H4.2l.4-.5 3.9-4 .5-.3Zm2-.2v5a2 2 0 0 1-2 2H4v11c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7ZM8 16c0-.6.4-1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1-5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="ms-3">Terms and Condition</span>
                </a>
            </li>
            <li>
                <a
                    href="#"
                    class="group flex items-center rounded-lg p-2 text-neutral-900 transition duration-75 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-500"
                >
                    <svg
                        class="h-6 w-6 flex-shrink-0 text-neutral-900 transition duration-75 hover:bg-gray-100 group-hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="ms-3">Help</span>
                </a>
            </li>
        </ul>
    </div>
</aside>
