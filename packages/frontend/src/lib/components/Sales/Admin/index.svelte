<script lang="ts">
    import type { TRPCError } from '@trpc/server'
    import { initDropdowns, Modal } from 'flowbite'
    import { afterUpdate, onMount } from 'svelte'

    import { goto } from '$app/navigation'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'
    import Profile from '$lib/components/Product/Profile/Admin/index.svelte'

    ////////////////////
    // Initialization //
    ////////////////////

    // Modal
    let productProfileModal: Modal

    let showValidateMessage: Record<string, string> = {}
    const isWeb = true
    let isAdd: boolean

    ////////////////////
    //// Lifecycle ////
    ///////////////////
    afterUpdate(() => {
        initDropdowns()
    })

    onMount(() => {
        productProfileModal = new Modal(
            document.getElementById('productProfileModalElem'),
            {
                placement: 'bottom-right',
                backdrop: 'dynamic',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
            },
        )
    })

    //////////////
    // Handlers //
    //////////////

    const handleIsAddOrEdit = (bool: boolean) => {
        isAdd = bool
        productProfileModal.show()
    }
</script>

{#if isWeb}
    <div class="p-4">
        <div class="mx-auto mb-4 max-w-screen-md text-center">
            <h2
                class="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white"
            >
                Sales
            </h2>
            <!-- <p
                class="mb-5 font-light text-gray-500 sm:text-sm dark:text-gray-400"
            >
                List of products.
            </p> -->
        </div>
        <div class="rounded-lg bg-white shadow dark:bg-gray-700">
            <div
                class="flex flex-col items-center justify-between space-y-3 p-4 md:flex-row md:space-y-0"
            >
                <div class="w-full md:w-1/4">
                    <form class="flex items-center">
                        <label
                            for="simple-search"
                            class="sr-only">Search</label
                        >
                        <div class="relative w-full">
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
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="Search"
                            />
                        </div>
                    </form>
                </div>

                <div
                    class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-3 md:space-y-0"
                >
                    <label
                        class="text-sm font-normal dark:text-white"
                        for="rows">Rows per page</label
                    >
                    <select
                        id="rows"
                        class="border-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 ml-2 mr-2 block rounded-lg py-1.5 pl-3.5 pr-6 text-sm dark:bg-gray-600 dark:text-white"
                    >
                        <option value="10">10</option>
                    </select>
                    <span
                        class="mr-1 text-sm font-normal text-gray-500 dark:text-gray-400"
                        >Showing <span
                            class="font-semibold text-gray-900 dark:text-white"
                            >1-100</span
                        >
                        of
                        <span
                            class="font-semibold text-gray-900 dark:text-white"
                            >100</span
                        >
                    </span>
                    <a
                        href="#"
                        class="inline-flex cursor-pointer justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                        <svg
                            class="h-7 w-7"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                            ></path>
                        </svg>
                    </a>
                    <a
                        href="#"
                        class="inline-flex cursor-pointer justify-end rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                        <svg
                            class="h-7 w-7"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clip-rule="evenodd"
                            ></path>
                        </svg>
                    </a>
                </div>
            </div>

            <div class="flex flex-col">
                <div class="">
                    <div class="inline-block min-w-full align-middle">
                        <div class="">
                            <table
                                class="min-w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400"
                            >
                                <thead
                                    class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                                >
                                    <tr>
                                        <th
                                            scope="col"
                                            class="w-16 py-3 pl-4 text-center"
                                        >
                                            <span class="invisible"></span>
                                        </th>
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Name</th
                                        >

                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Category</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Sales/Day</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Sales/Month</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Sales/Year</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Total Sales</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Revenue</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Last Update</th
                                        >
                                    </tr>
                                </thead>
                                <tbody
                                    class="divide-y divide-gray-200 dark:divide-gray-600"
                                >
                                    <tr
                                        class="hover:bg-gray-100 dark:hover:bg-gray-500"
                                    >
                                        <td class="py-3 pl-4">
                                            <img
                                                class="h-10 w-10"
                                                src="/defaultproduct.png"
                                                alt="Default avatar"
                                            />
                                        </td>
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >Apple iMac 27"</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >PC</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >10</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >100</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >1000</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >10000</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >P1000000</td
                                        >
                                        <td
                                            class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                            >JUST NOW</td
                                        >
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <PageNavbar titleHeader={'All Members'} />
    <div class="p-4">
        <div class="mt-24 rounded-lg bg-white dark:bg-gray-800">
            <div class="mb-1 flex items-center justify-between">
                <h3
                    class="text-base font-semibold text-gray-900 dark:text-white"
                ></h3>
            </div>

            <div
                class="py-1"
                role="button"
                tabindex="-1"
            >
                <div
                    class="mb-1 grid grid-cols-1 rounded-lg bg-gray-50 p-2 dark:bg-gray-700"
                >
                    <div class="grid grid-cols-10">
                        <div
                            class="col-span-7 items-center text-gray-500 dark:text-white"
                        >
                            <div
                                class="w-full text-xs font-normal text-gray-500 sm:text-sm dark:text-gray-400"
                            >
                                <span>Member ID: 1</span>
                            </div>
                            <div
                                class="w-full text-xs font-bold text-gray-500 dark:text-white"
                            >
                                <p class="mb-1 truncate">
                                    Lindjunne Gerard Montenegro
                                </p>
                                <span
                                    class="rounded text-xs font-medium uppercase text-green-500 dark:text-green-400 dark:text-green-400"
                                    >Active</span
                                >
                            </div>
                        </div>
                        <div class="col-span-3 flex items-center justify-end">
                            <div
                                class="col-span-3 w-full items-center text-end text-gray-500 dark:text-white"
                            >
                                <div
                                    class="w-full text-xs font-normal text-gray-500 sm:text-sm dark:text-gray-400"
                                >
                                    <span>Registered at</span>
                                </div>

                                <div
                                    class="w-full items-center text-xs font-bold text-gray-500 dark:text-white"
                                >
                                    <p class="truncate">31 Sep 2024</p>
                                    <span class="invisible">invi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<div
    id="productProfileModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-4xl p-4 sm:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 shadow sm:p-5 dark:bg-gray-800"
        >
            <div
                class="mb-2 flex items-center justify-between rounded-t border-b pb-2 dark:border-gray-600"
            >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {isAdd ? 'Add' : 'Update'} Product
                </h3>
                <button
                    type="button"
                    on:click={() => productProfileModal.hide()}
                    class="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                    <svg
                        aria-hidden="true"
                        class="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        ><path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                        ></path></svg
                    >
                    <span class="sr-only">Close modal</span>
                </button>
            </div>

            <Profile
                {isAdd}
                on:close={() => productProfileModal.hide()}
            />
        </div>
    </div>
</div>
