<script lang="ts">
    import { initDropdowns } from 'flowbite'
    import { afterUpdate, getContext, onMount } from 'svelte'
    import type { Readable } from 'svelte/store'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const sessionData = sessionDataStore()
    const trpcClient = trpcClientStoreLegacy()
    const rowPerPageStore = getContext<
        Readable<
            {
                value: number
                name: string
            }[]
        >
    >('rowPerPageContext')

    // Pagination & Search
    let rowsPerPage =
        Number($page.url.searchParams.get('rowsPerPage')) < 10
            ? 10
            : Number($page.url.searchParams.get('rowsPerPage'))
    let pageNumber =
        Number($page.url.searchParams.get('pageNumber')) < 1
            ? 1
            : Number($page.url.searchParams.get('pageNumber'))
    let searchFilter = $page.url.searchParams.get('searchFilter') || ''
    let category = $page.url.searchParams.get('category') || ''
    let timeLine = $page.url.searchParams.get('timeline') || ''

    $: totalItems = 0
    $: totalPages = 0
    $: fromPage = 0
    $: toPage = 0

    let ranking: TRouterOutput['transaction']['getRanking'] = {
        paginatedRank: [],
        totalNumberOfRank: 0,
    }

    let paginatedRank = ranking.paginatedRank

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    const isWeb = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    afterUpdate(() => {
        initDropdowns()
    })

    onMount(() => {
        if (category) {
            getRankingListTableData(
                pageNumber,
                rowsPerPage,
                searchFilter,
                category,
                timeLine,
            )
        }
    })

    //////////////
    // Handlers //
    //////////////

    const getRankingListTableData = async (
        pn = pageNumber,
        rpp = rowsPerPage,
        sf = searchFilter,
        ct = category,
        tl = timeLine,
    ) => {
        let url = new URL($page.url)

        if (pn > 0 && pn <= totalPages) {
            pageNumber = pn
        }

        if (rpp) url.searchParams.set('rowsPerPage', `${rpp}`)
        if (pn) url.searchParams.set('pageNumber', `${pageNumber}`)

        sf
            ? url.searchParams.set('searchFilter', `${sf}`)
            : url.searchParams.delete('searchFilter')

        ct
            ? url.searchParams.set('category', `${ct}`)
            : url.searchParams.delete('category')

        tl
            ? url.searchParams.set('timeline', `${tl}`)
            : url.searchParams.delete('timeline')

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })

        await getRankingList()
    }

    const getRankingList = async () => {
        ranking = await $trpcClient.transaction.getRanking.query({
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
            category,
            timeLine,
        })

        if (ranking) {
            paginatedRank = ranking.paginatedRank
            totalItems = ranking.totalNumberOfRank
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const onChangeCategory = () => {
        pageNumber = 1
        getRankingListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            category,
            timeLine,
        )
    }

    const onChangeTimeLine = () => {
        pageNumber = 1
        getRankingListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            category,
            timeLine,
        )
    }
</script>

{#if isWeb}
    <div class="p-4">
        <div class="mx-auto mb-4 max-w-screen-md text-center">
            <h2
                class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
            >
                Ranking
            </h2>
        </div>
        <div class="shadow-lg">
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
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-100 p-2 pl-10 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:placeholder-neutral-400"
                                placeholder="Search Name"
                                bind:value={searchFilter}
                                on:input={() => {
                                    getRankingListTableData(
                                        pageNumber,
                                        rowsPerPage,
                                        searchFilter,
                                        category,
                                        timeLine,
                                    )
                                }}
                            />
                        </div>
                    </form>
                </div>

                <div
                    class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-3 md:space-y-0"
                >
                    <div
                        class="flex w-full flex-wrap items-center space-y-2 lg:flex-nowrap lg:space-y-0"
                    >
                        <label
                            for="category"
                            class="sr-only">Underline select</label
                        >
                        <select
                            id="category"
                            bind:value={category}
                            on:change={onChangeCategory}
                            class="peer mr-4 block w-full appearance-none border-0 border-b border-neutral-300 bg-white px-0 py-2.5 text-sm text-neutral-600 focus:border-neutral-200 focus:outline-none focus:ring-0 lg:w-[201px] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                        >
                            <option
                                value=""
                                disabled
                                selected>Category</option
                            >
                            <option value="Product">Product</option>
                            <option value="Recruiter">Recruiter</option>
                            <option value="Donator">Donator</option>
                        </select>
                        <label
                            for="timeline"
                            class="sr-only">Underline select</label
                        >
                        <select
                            id="timeline"
                            bind:value={timeLine}
                            on:change={onChangeTimeLine}
                            class="peer mr-4 block w-full appearance-none border-0 border-b border-neutral-300 bg-white px-0 py-2.5 text-sm text-neutral-600 focus:border-neutral-200 focus:outline-none focus:ring-0 lg:w-[201px] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                        >
                            <option
                                value=""
                                disabled
                                selected>Timeline</option
                            >
                            <option value="Today">Today</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="flex flex-col">
                <div class="">
                    <div class="inline-block w-full align-middle">
                        <div class="overflow-x-auto">
                            <table
                                class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                            >
                                <thead
                                    class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                                >
                                    <tr>
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center">ID</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Name</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Total</th
                                        >
                                    </tr>
                                </thead>
                                <tbody
                                    class="divide-y divide-neutral-200 font-semibold dark:divide-neutral-600"
                                >
                                    {#each paginatedRank as row}
                                        <tr
                                            class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                        >
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.id}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.name}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{numberFormatter.format(
                                                            Number(row.total),
                                                        )}</span
                                                    >
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                        <div
                            class="sticky bottom-0 right-0 items-center border-t border-neutral-200 bg-neutral-100 p-4 sm:flex sm:justify-between dark:border-neutral-500 dark:bg-neutral-600"
                        >
                            <div
                                class="mb-4 flex items-center sm:mb-0 lg:flex-nowrap"
                            >
                                <div class="mx-auto flex items-center">
                                    <label
                                        class="text-xs font-normal lg:text-sm dark:text-white"
                                        for="rows">Rows per page</label
                                    >
                                    <select
                                        id="rows"
                                        bind:value={rowsPerPage}
                                        on:change={() => {
                                            getRankingListTableData(
                                                pageNumber,
                                                rowsPerPage,
                                                searchFilter,
                                                category,
                                                timeLine,
                                            )
                                        }}
                                        class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 ml-2 mr-2 block rounded-lg border border-neutral-300 py-1.5 pl-3.5 pr-6 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                                    >
                                        {#each $rowPerPageStore as row}
                                            <option value={row.value}
                                                >{row.name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                                <div class="mx-auto flex items-center">
                                    <span
                                        class="text-xs font-normal text-gray-500 lg:text-sm dark:text-gray-400"
                                        >Showing <span
                                            class="font-semibold text-gray-900 dark:text-white"
                                            >{fromPage}-{toPage}</span
                                        >
                                        of
                                        <span
                                            class="font-semibold text-gray-900 dark:text-white"
                                            >{totalItems}</span
                                        >
                                    </span>
                                    <a
                                        href="#"
                                        on:click={() =>
                                            getRankingListTableData(
                                                pageNumber - 1,
                                                rowsPerPage,
                                                searchFilter,
                                                category,
                                                timeLine,
                                            )}
                                        class="inline-flex cursor-pointer justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
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
                                        on:click={() =>
                                            getRankingListTableData(
                                                pageNumber + 1,
                                                rowsPerPage,
                                                searchFilter,
                                                category,
                                                timeLine,
                                            )}
                                        class="mr-2 inline-flex cursor-pointer justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
