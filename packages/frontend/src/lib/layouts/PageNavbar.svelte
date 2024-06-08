<script lang="ts">
    import { initDropdowns } from 'flowbite'
    import { afterUpdate } from 'svelte'
    export let titleHeader = ''

    // Initialize Flowbite Components
    afterUpdate(() => {
        initDropdowns()
    })

    const hideDropDownList = () => {
        const elemId = document.getElementById('dropdownStatus') as HTMLElement

        if (elemId) {
            elemId.classList.remove('hidden')
        }
    }

    const getMemberStatusList = (status: string) => {
        const elemId = document.getElementById('dropdownStatus') as HTMLElement

        if (elemId) {
            elemId.classList.add('hidden')
        }
    }
</script>

<nav
    class="fixed z-50 w-full bg-white px-4 pb-4 pt-2.5 lg:px-6 dark:bg-gray-800"
>
    <div
        class="{!titleHeader.match('Settings')
            ? 'mb-6'
            : 'mb-0'} relative flex w-full items-center justify-start"
    >
        <button
            on:click={() => history.back()}
            class="absolute me-1 flex h-8 w-6 items-center justify-start rounded-lg text-xs font-medium text-gray-800 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
            <svg
                class="h-6 w-6 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
            >
                <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 5H1m0 0 4 4M1 5l4-4"
                />
            </svg>
        </button>
        <p
            class="inline-flex w-full justify-center text-sm font-medium text-black dark:text-white"
        >
            {titleHeader}
        </p>
    </div>

    {#if !titleHeader.match('Settings')}
        <div class="w-full md:w-1/2">
            <form class="flex items-center">
                <label
                    for="simple-search"
                    class="sr-only">Search</label
                >
                <div class="relative mr-2 w-full">
                    <div
                        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                    >
                        <svg
                            aria-hidden="true"
                            class="h-5 w-5 text-gray-500 dark:text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        id="simple-search"
                        class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder="Search"
                    />
                </div>

                <button
                    id="dropdownStatusButton"
                    data-dropdown-toggle="dropdownStatus"
                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block inline-flex rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    type="button"
                    on:click={hideDropDownList}
                >
                    <svg
                        class="h-5 w-5"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                        >
                        </path>
                    </svg>
                </button>
                <div
                    id="dropdownStatus"
                    class="z-10 hidden w-36 divide-y divide-gray-100 rounded bg-white shadow dark:divide-gray-600 dark:bg-gray-700"
                >
                    <ul
                        class="py-1 text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="dropdownStatusButton"
                    >
                        <li>
                            <button
                                id="pendingbtn"
                                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                role="menuitem"
                                on:click={() => getMemberStatusList('pending')}
                                >Pending</button
                            >
                        </li>
                        <li>
                            <button
                                id="activebtn"
                                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                role="menuitem"
                                on:click={() => getMemberStatusList('active')}
                                >Active</button
                            >
                        </li>
                        <li>
                            <button
                                id="inactivebtn"
                                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                role="menuitem"
                                on:click={() => getMemberStatusList('inactive')}
                                >Inactive</button
                            >
                        </li>
                    </ul>
                </div>
            </form>
        </div>
    {/if}
</nav>
