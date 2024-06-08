<script lang="ts">
    import dayjs from 'dayjs'
    import { Modal } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { Readable } from 'svelte/store'
    import { z } from 'zod'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import Profile from '$lib/components/Product/Profile/Admin/index.svelte'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'
    import { getImageDataURL } from '$lib/utilities.js'

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
    let fromDate =
        $page.url.searchParams.get('fromDate') ||
        dayjs().toISOString().split('T')[0]
    let toDate =
        $page.url.searchParams.get('toDate') ||
        dayjs().toISOString().split('T')[0]
    let transType = z
        .enum([
            'ALL',
            'CASHOUT',
            'COMMISSION',
            'DEPOSIT',
            'DISTRIBUTION',
            'DONATION',
            'POINT_TRANSFER',
            'SALES_INCOME',
        ])
        .parse($page.url.searchParams.get('transType') || 'ALL')

    $: totalItems = 0
    $: totalPages = 0
    $: fromPage = 0
    $: toPage = 0

    let transaction: TRouterOutput['transaction']['getTransaction'] = {
        paginatedTransaction: [],
        totalNumberOfTransaction: 0,
    }

    let paginatedTransaction = transaction.paginatedTransaction

    // Modal
    let receiptModalCashOut: Modal
    let productProfileModal: Modal

    let imageData: Record<
        string,
        { data: string | null; type: string; name: string }
    > = {
        proofOfPayment: {
            data: null,
            type: '',
            name: '',
        },
    }

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    let showValidateMessage: Record<string, string> = {}
    const isWeb = true
    let isAdd: boolean

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(() => {
        receiptModalCashOut = new Modal(
            document.getElementById('receiptModalCashOutElem'),
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

        getTransactionListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            fromDate,
            toDate,
            transType,
        )
    })

    //////////////
    // Handlers //
    //////////////

    const getTransactionListTableData = async (
        pn = pageNumber,
        rpp = rowsPerPage,
        sf = searchFilter,
        fd = fromDate,
        td = toDate,
        tt = transType,
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

        tt
            ? url.searchParams.set('transType', `${tt}`)
            : url.searchParams.delete('transType')

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })

        await getTransactionList()
    }

    const getTransactionList = async () => {
        transaction = await $trpcClient.transaction.getTransaction.query({
            fromDate,
            toDate,
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
            transType,
        })

        if (transaction) {
            paginatedTransaction = transaction.paginatedTransaction
            totalItems = transaction.totalNumberOfTransaction
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const onChangeTransactionType = () => {
        pageNumber = 1
        getTransactionListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            fromDate,
            toDate,
            transType,
        )
    }

    const handleViewBtn = async (receiptId: string, userId: string) => {
        imageData['proofOfPayment'].name = receiptId

        imageData = await getImageDataURL(
            imageData,
            userId,
            `${$sessionData?.sharedAccessSignature}`,
        )

        receiptModalCashOut.show()
    }

    const handleDownloadImage = () => {
        const downloadLink = document.createElement('a')
        downloadLink.href = imageData['proofOfPayment'].data!
        downloadLink.download = imageData['proofOfPayment'].name
        downloadLink.click()
    }

    const handleIsAddOrEdit = (bool: boolean) => {
        isAdd = bool
        productProfileModal.show()
    }
</script>

{#if isWeb}
    <div class="p-4">
        <div class="mx-auto mb-4 max-w-screen-md text-center">
            <h2
                class="text-xl font-extrabold tracking-[0.4rem] text-neutral-800 dark:text-neutral-300"
            >
                Transactions
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
                                placeholder="Search"
                                bind:value={searchFilter}
                                on:input={() => {
                                    getTransactionListTableData(
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

                <div
                    class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-3 md:w-auto md:flex-row md:items-center md:space-x-3 md:space-y-0"
                >
                    <label
                        for="category"
                        class="sr-only">Underline select</label
                    >
                    <select
                        id="category"
                        bind:value={transType}
                        on:change={onChangeTransactionType}
                        class="peer mx-auto block flex w-full appearance-none justify-center border-0 border-b border-neutral-300 bg-white px-0 py-2.5 text-sm text-neutral-600 focus:border-neutral-200 focus:outline-none focus:ring-0 lg:w-[201px] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option
                            value=""
                            disabled
                            selected>Type</option
                        >
                        <option value="ALL">ALL</option>
                        {#if Number($sessionData?.rbacFlag) & 3}
                            <option value="CASHOUT">CASHOUT</option>
                            <option value="COMMISSION">COMMISSION</option>
                            <option value="DEPOSIT">DEPOSIT</option>
                            <option value="DISTRIBUTION">DISTRIBUTION</option>
                            <option value="DONATION">DONATION</option>
                            <option value="POINT_TRANSFER"
                                >POINT TRANSFER</option
                            >
                            <option value="SALES_INCOME">SALES INCOME</option>
                        {:else}
                            <option value="CASHOUT">CASHOUT</option>
                            <option value="COMMISSION">COMMISSION</option>
                            <option value="DONATION">DONATION</option>
                        {/if}
                    </select>
                    <div class="items-center sm:mx-auto">
                        <input
                            name="start"
                            type="date"
                            bind:value={fromDate}
                            on:change={() => {
                                getTransactionListTableData(
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
                                getTransactionListTableData(
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
                <div class="overflow-x-auto">
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
                                            class="p-4 text-center"
                                            >Transaction Number</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Name</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Details</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Date</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >One Marketing Amount</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Commission Amount</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Previous Amount</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Current Amount</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Status</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Receipt</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Settled By</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Settled At</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Action</th
                                        >
                                    </tr>
                                </thead>
                                <tbody
                                    class="divide-y divide-neutral-200 font-semibold dark:divide-neutral-600"
                                >
                                    {#each paginatedTransaction as row}
                                        <tr
                                            class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                        >
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.txnId}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.memberName}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {row.transactionType ===
                                                        'SALES_INCOME'
                                                            ? 'SALES INCOME'
                                                            : row.transactionType}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {new Date(
                                                            row.createdAt,
                                                        ).toLocaleString()}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {numberFormatter.format(
                                                            Number(
                                                                row.oneMarketingAmount,
                                                            ),
                                                        )}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {numberFormatter.format(
                                                            Number(
                                                                row.commissionAmount,
                                                            ),
                                                        )}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {numberFormatter.format(
                                                            Number(
                                                                row.prevBalance,
                                                            ),
                                                        )}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {numberFormatter.format(
                                                            Number(
                                                                row.currentBalance,
                                                            ),
                                                        )}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                                >{#if row.transactionStatus === '00_VOID'}
                                                    <span
                                                        class="rounded-md border border-red-100 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:border-red-500 dark:bg-[#ebebed] dark:text-red-600"
                                                        >CANCELLED</span
                                                    >
                                                {:else if row.transactionStatus === '01_PENDING'}
                                                    <span
                                                        class=" rounded-md border border-yellow-100 bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:border-yellow-500 dark:bg-[#ebebed] dark:text-yellow-600"
                                                        >PENDING</span
                                                    >
                                                {:else if row.transactionStatus === '02_APPROVED'}
                                                    <span
                                                        class=" rounded-md border border-purple-100 bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:border-purple-500 dark:bg-[#ebebed] dark:text-purple-600"
                                                        >APPROVED</span
                                                    >
                                                {:else}
                                                    <span
                                                        class=" rounded-md border border-green-100 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:border-green-500 dark:bg-[#ebebed] dark:text-green-600"
                                                        >COMPLETED</span
                                                    >
                                                {/if}
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div
                                                    class="flex items-center justify-center space-x-2"
                                                >
                                                    {#if ['CASHOUT'].includes(`${row.transactionType}`) && row.transactionStatus === '03_COMPLETED'}
                                                        <button
                                                            type="button"
                                                            on:click={() =>
                                                                handleViewBtn(
                                                                    `${row.receipt}`,
                                                                    row.userId,
                                                                )}
                                                            class="inline-flex items-center rounded-lg bg-green-600 px-2 py-2 text-center text-sm font-bold tracking-[.12rem] text-white hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke-width="1.5"
                                                                stroke="currentColor"
                                                                class=" mr-2 h-6 w-6"
                                                            >
                                                                <path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                                                />
                                                            </svg>
                                                            <span id="btntext"
                                                                >View</span
                                                            >
                                                        </button>
                                                    {/if}
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {row.settledByName}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {new Date(
                                                            row.settledAt,
                                                        ).toLocaleString()}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div
                                                    class="flex items-center justify-center space-x-2"
                                                >
                                                    <!-- <button
                                                type="button"
                                                class="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                            >
                                                View Details
                                                <svg
                                                    class="ms-2 h-3.5 w-3.5 rtl:rotate-180"
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
                                                        d="M1 5h12m0 0L9 1m4 4L9 9"
                                                    />
                                                </svg>
                                            </button> -->
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
                                            getTransactionListTableData(
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
                                            getTransactionListTableData(
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
                                            getTransactionListTableData(
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

<div
    id="receiptModalCashOutElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-md p-4 md:h-auto">
        <div
            class="relative justify-between rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-[#666666]"
        >
            <div class="flex items-center justify-between">
                <button
                    type="button"
                    class="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                    on:click={() => receiptModalCashOut.hide()}
                >
                    <svg
                        class="h-3 w-3 text-gray-700"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 14"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                        />
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <div>
                <div class="flex items-center justify-center">
                    <div
                        class="border-0.5 relative h-64 w-auto rounded-lg bg-neutral-100"
                    >
                        <img
                            class="h-full w-full rounded-lg"
                            src={imageData['proofOfPayment'].data}
                            alt="image description"
                        />
                    </div>
                </div>
                <div class="mt-2">
                    <button
                        on:click={handleDownloadImage}
                        class="ml-1 text-blue-700 hover:underline dark:text-blue-700"
                    >
                        Download Image
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
