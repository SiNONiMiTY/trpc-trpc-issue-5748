<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import { sessionDataStore, trpcClientStore } from '$lib/stores'
    import dayjs from 'dayjs'
    import { Modal } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { Readable } from 'svelte/store'
    import type { ZodIssue } from 'zod'
    import type { TRPCError } from '@trpc/server'
    import type { FormEventHandler } from 'svelte/elements'

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const sessionData = sessionDataStore()
    const rowPerPageStore = getContext<
        Readable<
            {
                value: number
                name: string
            }[]
        >
    >('rowPerPageContext')

    // Modal
    let confirmModalRegisterBatch: Modal
    let successModalRegisterBatch: Modal

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
    let fromDate =
        $page.url.searchParams.get('fromDate') ||
        dayjs().toISOString().split('T')[0]
    let toDate =
        $page.url.searchParams.get('toDate') ||
        dayjs().toISOString().split('T')[0]

    $: totalItems = 0
    $: totalPages = 0
    $: fromPage = 0
    $: toPage = 0

    let getCurrent: TRouterOutput['registrationBatch']['getCurrent'] = {
        batchId: '',
        numbersQueued: '',
        dateOpen: '',
    }

    let getHistory: TRouterOutput['registrationBatch']['getHistory'] = {
        paginatedHistory: [],
        totalNumberOfHistory: 0,
    }

    let paginatedHistory = getHistory.paginatedHistory
    let alertMessage = ''
    let disableOpenBtn = false
    let disableCloseBtn = true
    let batchStatus: 'OPEN' | 'CLOSE' = 'OPEN'
    let confirmBatchId = ''
    let disableYesBtn = false

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(async () => {
        confirmModalRegisterBatch = new Modal(
            document.getElementById('confirmModalRegisterBatchElem'),
            {
                placement: 'bottom-right',
                backdrop: 'static',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
            },
        )

        successModalRegisterBatch = new Modal(
            document.getElementById('successModalRegisterBatchElem'),
            {
                placement: 'bottom-right',
                backdrop: 'static',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
            },
        )

        await getCurrentBatch()
        getHistoryListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            fromDate,
            toDate,
        )
    })

    //////////////
    // Handlers //
    //////////////

    const getCurrentBatch = async () => {
        getCurrent = await $trpcClientStore.registrationBatch.getCurrent.query({
            sessionId: $sessionData?.sessionId || '',
        })

        disableOpenBtn = getCurrent.batchId !== ''
        disableCloseBtn = !disableOpenBtn
    }

    const getHistoryListTableData = async (
        pn = pageNumber,
        rpp = rowsPerPage,
        sf = searchFilter,
        fd = fromDate,
        td = toDate,
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

        fd
            ? url.searchParams.set('fromDate', `${fd}`)
            : url.searchParams.delete('fromDate')

        td
            ? url.searchParams.set('toDate', `${td}`)
            : url.searchParams.delete('toDate')

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })

        await getHistoryList()
    }

    const getHistoryList = async () => {
        getHistory = await $trpcClientStore.registrationBatch.getHistory.query({
            sessionId: $sessionData?.sessionId || '',
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            fromDate,
            toDate,
        })

        if (getHistory) {
            paginatedHistory = getHistory.paginatedHistory
            totalItems = getHistory.totalNumberOfHistory
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const checkDisableYesBtn = () => {
        if (batchStatus === 'CLOSE') {
            disableYesBtn = getCurrent.batchId !== confirmBatchId
        }
    }

    const handleRegistrationBatchClick = (status: 'OPEN' | 'CLOSE') => {
        batchStatus = status
        checkDisableYesBtn()
        confirmModalRegisterBatch.show()
    }

    const handleConfirmBatchIdChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        confirmBatchId = event.currentTarget.value
        checkDisableYesBtn()
    }

    const handleConfirmYesBtn = async (status: 'OPEN' | 'CLOSE') => {
        try {
            const response =
                await $trpcClientStore.registrationBatch.getOrSetStatus.mutate({
                    sessionId: $sessionData?.sessionId || '',
                    status,
                })

            if (response) {
                alertMessage = `Batch ${response.batchId} is now ${response.status === 'OPEN' ? 'opened' : 'closed'} `
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            successModalRegisterBatch.show()
        } catch (err) {
            alertMessage = ''
            const issues: ZodIssue[] = JSON.parse((err as TRPCError).message)
            issues.forEach((key) => {
                alertMessage += `${key.message} `
            })
            successModalRegisterBatch.show()
        }
    }

    const handleSuccessContinueBtn = async () => {
        await getCurrentBatch()
        getHistoryListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            fromDate,
            toDate,
        )
        confirmModalRegisterBatch.hide()
        successModalRegisterBatch.hide()
    }
</script>

<div class="p-4">
    <div class="mx-auto mb-4 max-w-screen-md text-center">
        <h2
            class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
        >
            Registration Batch
        </h2>
    </div>
    <div class="flex flex-row items-center justify-center space-x-4 p-4">
        <div>
            <button
                type="button"
                disabled={disableOpenBtn}
                class="{disableOpenBtn
                    ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                    : 'bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700'}  focus:ring-primary-300 dark:focus:ring-primary-800 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-4"
                on:click={() => handleRegistrationBatchClick('OPEN')}
            >
                <svg
                    class="mr-2 h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        clip-rule="evenodd"
                        fill-rule="evenodd"
                        stroke-width="2"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    />
                </svg>
                Open
            </button>
        </div>
        <div>
            <button
                type="button"
                disabled={disableCloseBtn}
                class="{disableCloseBtn
                    ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                    : 'bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700'}  focus:ring-primary-300 dark:focus:ring-primary-800 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-4"
                on:click={() => handleRegistrationBatchClick('CLOSE')}
            >
                <svg
                    class="mr-2 h-3.5 w-3.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18 17.94 6M18 18 6.06 6"
                    />
                </svg>

                Close
            </button>
        </div>
    </div>
    <div class="rounded-lg bg-white shadow dark:bg-neutral-800">
        <div
            class="flex flex-col items-center justify-center space-y-3 p-4 md:flex-row md:space-x-4 md:space-y-0"
        >
            <h2
                class="text-xl font-extrabold text-neutral-900 dark:text-neutral-300"
            >
                CURRENT
            </h2>
        </div>
        <div class="flex flex-col">
            <div class="">
                <div class="inline-block w-full align-middle">
                    <div class="overflow-x-auto">
                        <table
                            class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                        >
                            <thead
                                class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-600 dark:text-neutral-200"
                            >
                                <tr>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center">ID</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        ># of Members Queued</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        >Date Open</th
                                    >
                                    <!-- <th
                                        scope="col"
                                        class="px-4 py-3 text-center">Action</th
                                    > -->
                                </tr>
                            </thead>
                            <tbody
                                class="divide-y divide-neutral-200 font-semibold dark:divide-neutral-600"
                            >
                                <tr>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                >{getCurrent.batchId}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                >{getCurrent.numbersQueued}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                >{getCurrent.dateOpen}</span
                                            >
                                        </div>
                                    </th>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="mt-20 rounded-lg bg-white shadow dark:bg-neutral-800">
        <div
            class="flex flex-col items-center justify-between space-y-3 p-4 md:flex-row md:space-x-4 md:space-y-0"
        >
            <div class="w-full md:w-[337px]">
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
                            placeholder="Search Batch ID"
                            bind:value={searchFilter}
                            on:input={() => {
                                getHistoryListTableData(
                                    pageNumber,
                                    rowsPerPage,
                                    searchFilter,
                                    fromDate,
                                    toDate,
                                )
                            }}
                        />
                    </div>
                </form>
            </div>

            <div>
                <h2
                    class="text-xl font-extrabold text-neutral-900 dark:text-neutral-300"
                >
                    HISTORY
                </h2>
            </div>

            <div
                class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-2 md:space-y-0"
            >
                <div class="items-center sm:mx-auto">
                    <input
                        name="start"
                        type="date"
                        bind:value={fromDate}
                        on:change={() => {
                            getHistoryListTableData(
                                pageNumber,
                                rowsPerPage,
                                searchFilter,
                                fromDate,
                                toDate,
                            )
                        }}
                        class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-100 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:placeholder-neutral-400"
                    />
                </div>
                <span
                    class="mx-4 text-center text-neutral-800 dark:text-neutral-300"
                    >to</span
                >
                <div class="items-center sm:mx-auto">
                    <input
                        name="end"
                        type="date"
                        bind:value={toDate}
                        on:change={() => {
                            getHistoryListTableData(
                                pageNumber,
                                rowsPerPage,
                                searchFilter,
                                fromDate,
                                toDate,
                            )
                        }}
                        class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-100 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:placeholder-neutral-400"
                    />
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
                                class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-600 dark:text-neutral-200"
                            >
                                <tr>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center">ID</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        ># of Members Processed</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        >Date Opened</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        >Date Closed</th
                                    >
                                </tr>
                            </thead>
                            <tbody
                                class="divide-y divide-neutral-200 font-semibold dark:divide-neutral-600"
                            >
                                {#each paginatedHistory as row}
                                    <tr>
                                        <th
                                            scope="row"
                                            class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                        >
                                            <div>
                                                <span
                                                    class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                    >{row.id}</span
                                                >
                                            </div>
                                        </th>
                                        <th
                                            scope="row"
                                            class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                        >
                                            <div>
                                                <span
                                                    class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                    >{row.membersProcessed}</span
                                                >
                                            </div>
                                        </th>
                                        <th
                                            scope="row"
                                            class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                        >
                                            <div>
                                                <span
                                                    class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                    >{row.openedAt}</span
                                                >
                                            </div>
                                        </th>
                                        <th
                                            scope="row"
                                            class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                        >
                                            <div>
                                                <span
                                                    class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                    >{row.closedAt}</span
                                                >
                                            </div>
                                        </th>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div
            class="sticky bottom-0 right-0 items-center border-t border-neutral-200 bg-neutral-100 p-4 sm:flex sm:justify-between dark:border-neutral-500 dark:bg-neutral-600"
        >
            <div class="mb-4 flex items-center sm:mb-0 lg:flex-nowrap">
                <div class="mx-auto flex items-center">
                    <label
                        class="text-xs font-normal lg:text-sm dark:text-white"
                        for="rows">Rows per page</label
                    >
                    <select
                        id="rows"
                        bind:value={rowsPerPage}
                        on:change={() => {
                            getHistoryListTableData(
                                pageNumber,
                                rowsPerPage,
                                searchFilter,
                                fromDate,
                                toDate,
                            )
                        }}
                        class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 ml-2 mr-2 block rounded-lg border border-neutral-300 py-1.5 pl-3.5 pr-6 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                    >
                        {#each $rowPerPageStore as row}
                            <option value={row.value}>{row.name}</option>
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
                            getHistoryListTableData(
                                pageNumber - 1,
                                rowsPerPage,
                                searchFilter,
                                fromDate,
                                toDate,
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
                            getHistoryListTableData(
                                pageNumber + 1,
                                rowsPerPage,
                                searchFilter,
                                fromDate,
                                toDate,
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

<div
    id="confirmModalRegisterBatchElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md p-4">
        <div class="relative rounded-lg bg-white shadow dark:bg-gray-700">
            <div class="p-4 text-center md:p-5">
                <svg
                    class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200"
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
                        d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                </svg>
                <h3
                    class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"
                >
                    Are you sure you want to {batchStatus.toLowerCase()} this registration
                    batch?
                </h3>
                {#if batchStatus === 'CLOSE'}
                    <div class=" mx-2 flex justify-center border-gray-200">
                        <p
                            class="text-xs font-semibold text-gray-500 dark:text-gray-400"
                        >
                            PLEASE ENTER BATCH ID:
                        </p>
                    </div>
                    <div class=" mx-2 mb-4 flex justify-center border-gray-200">
                        <input
                            bind:value={confirmBatchId}
                            on:input={handleConfirmBatchIdChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-48 rounded-lg border-gray-300 bg-gray-50 p-2 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                            type="text"
                            name="confirmbatchid"
                            maxLength={12}
                            required
                        />
                    </div>
                {/if}

                <button
                    type="button"
                    on:click={() => handleConfirmYesBtn(batchStatus)}
                    disabled={disableYesBtn}
                    class="{disableYesBtn
                        ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                        : 'bg-primary-600 hover:bg-primary-800'} focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => {
                        confirmModalRegisterBatch.hide()
                        confirmBatchId = ''
                    }}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="successModalRegisterBatchElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-md p-4 md:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-gray-800"
        >
            <div
                class="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 p-2 dark:bg-green-900"
            >
                <svg
                    aria-hidden="true"
                    class="h-8 w-8 text-green-500 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    ><path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                    ></path></svg
                >
                <span class="sr-only">Success</span>
            </div>
            <p class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {alertMessage}
            </p>
            <button
                type="button"
                on:click={handleSuccessContinueBtn}
                class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:focus:ring-primary-900 rounded-lg px-3 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
            >
                Continue
            </button>
        </div>
    </div>
</div>
