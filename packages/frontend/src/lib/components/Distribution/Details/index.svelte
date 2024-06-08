<script lang="ts">
    import {
        distributionDetailsInputSchema,
        distributionMemberDetailsInputSchema,
    } from '@trpc-subscription/validator/trpc/v1/user'
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { Modal } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { Readable } from 'svelte/store'
    import { type ZodIssue } from 'zod'

    import { goto } from '$app/navigation'

    import {
        sessionDataStore,
        trpcClientStore,
        trpcClientStoreLegacy,
    } from '$lib/stores.js'
    import { page } from '$app/stores'

    ////////////////////
    // Initialization //
    ////////////////////

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
    let distributionId = $page.url.searchParams.get('id') || ''

    $: totalItems = 0
    $: totalPages = 0
    $: fromPage = 0
    $: toPage = 0

    let distributionDtl: TRouterOutput['distribution']['getDistributionDetails'] =
        {
            totalExecPartner: 0,
            totalDirector: 0,
            totalManager: 0,
            totalTeamLeader: 0,
            totalDealer: 0,

            distribution: {
                positionDate: '',
                sales: 0,
                percentage: '',
                totalAmount: '',
                dealerAllowance: '',
                teamLeaderAllowance: '',
                managerAllowance: '',
                directorAllowance: '',
                executivePartnerAllowance: '',
                corporateAllowance: '',
            },
        }
    let distributionMemberDtl: TRouterOutput['distribution']['getDistributionMemberDetails'] =
        {
            paginatedDistributionDtl: [],
            totalNumberOfDistributionDtl: 0,
        }

    let paginatedDistributionDtl =
        distributionMemberDtl.paginatedDistributionDtl

    let ranks: TRouterOutput['user']['getRanks'] = []

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    let rankId = ''

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(async () => {
        ranks = await $trpcClientStore.user.getRanks.query({
            rankId: 0,
        })

        await getDistributionDetails()

        if (distributionId) {
            getDistributionDtlListTableData(
                pageNumber,
                rowsPerPage,
                searchFilter,
                distributionId,
            )
        }
    })

    //////////////
    // Handlers //
    //////////////
    const getDistributionDetails = async () => {
        const validator = await distributionDetailsInputSchema.safeParseAsync({
            sessionId: $sessionData?.sessionId,
            distributionId,
        })

        if (validator.success) {
            distributionDtl =
                await $trpcClientStore.distribution.getDistributionDetails.query(
                    validator.data,
                )
        }
    }

    const getDistributionDtlListTableData = async (
        pn = pageNumber,
        rpp = rowsPerPage,
        sf = searchFilter,
        dId = distributionId,
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

        dId
            ? url.searchParams.set('id', `${dId}`)
            : url.searchParams.delete('id')

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })

        await getDistributionDtlList()
    }

    const getDistributionDtlList = async () => {
        const validator =
            await distributionMemberDetailsInputSchema.safeParseAsync({
                sessionId: $sessionData?.sessionId,
                limit: rowsPerPage,
                offset: rowsPerPage * (pageNumber - 1),
                searchFilter,
                distributionId,
                rankId,
            })

        if (validator.success) {
            distributionMemberDtl =
                await $trpcClientStore.distribution.getDistributionMemberDetails.query(
                    validator.data,
                )

            if (distributionMemberDtl) {
                paginatedDistributionDtl =
                    distributionMemberDtl.paginatedDistributionDtl
                totalItems = distributionMemberDtl.totalNumberOfDistributionDtl
                totalPages = Math.ceil(totalItems / rowsPerPage)
                fromPage =
                    totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
                toPage =
                    totalItems < fromPage + (rowsPerPage - 1)
                        ? totalItems
                        : fromPage + (rowsPerPage - 1)
            }
        }
    }

    const capitalizeFirstLetter = (value: string) => {
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    const onChangeRank = () => {
        pageNumber = 1
        getDistributionDtlListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            distributionId,
        )
    }
</script>

<div class="p-4">
    <nav
        class="flex"
        aria-label="Breadcrumb"
    >
        <ol
            class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse"
        >
            <li>
                <div class="flex items-center">
                    <svg
                        class="mx-1 h-3 w-3 text-gray-400 rtl:rotate-180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 6 10"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m1 9 4-4-4-4"
                        />
                    </svg>
                    <a
                        href="/app/distribution"
                        class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                        >Distribution</a
                    >
                </div>
            </li>
            <li aria-current="page">
                <div class="flex items-center">
                    <svg
                        class="mx-1 h-3 w-3 text-gray-400 rtl:rotate-180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 6 10"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m1 9 4-4-4-4"
                        />
                    </svg>
                    <span
                        class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400"
                        >Details</span
                    >
                </div>
            </li>
        </ol>
    </nav>
    <div
        class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md sm:p-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="">
            <div class="inline-block w-full align-middle">
                <div class="overflow-x-auto">
                    <!-- <div
                        class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                    >
                        <p class=" px-2 py-3 text-center">Allowance</p>
                    </div> -->
                    <table
                        class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                    >
                        <thead
                            class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                        >
                            <tr>
                                <th
                                    scope="col"
                                    class=" px-2 py-3 text-center"
                                    >Number of Dealers</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Number of Team Leader</th
                                >

                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Number of Manager</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Number of Director</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Number of Executive Partner</th
                                >
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-neutral-200 dark:divide-neutral-600"
                        >
                            <tr class="">
                                <th
                                    scope="row"
                                    class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                >
                                    <div>
                                        <span
                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                            >{distributionDtl.totalDealer}</span
                                        >
                                    </div>
                                </th>
                                <th
                                    scope="row"
                                    class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                >
                                    <div>
                                        <span
                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                            >{distributionDtl.totalTeamLeader}</span
                                        >
                                    </div>
                                </th>
                                <th
                                    scope="row"
                                    class="whitespace-nowrap p-2 text-center text-black dark:text-neutral-300"
                                >
                                    <div>
                                        <span
                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                            >{distributionDtl.totalManager}</span
                                        >
                                    </div>
                                </th>
                                <th
                                    scope="row"
                                    class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                >
                                    <div>
                                        <span
                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                            >{distributionDtl.totalDirector}</span
                                        >
                                    </div>
                                </th>
                                <th
                                    scope="row"
                                    class=" whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                >
                                    <div>
                                        <span
                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                            >{distributionDtl.totalExecPartner}</span
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

    <div
        class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md sm:p-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class=" flex flex-col">
            <div class="lg:mx-auto">
                <div
                    class=" inline-block w-full items-center align-middle lg:w-auto"
                >
                    <div
                        class="overflow-x-auto rounded-lg border border-neutral-300 p-2 dark:border-neutral-600"
                    >
                        <table
                            class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                        >
                            <thead
                                class=" bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                            >
                                <tr>
                                    <th
                                        scope="col"
                                        class=" px-2 py-3 text-center"
                                        >Position base date</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center">Sales</th
                                    >

                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        >Percentage</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                    ></th>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        >Total amount</th
                                    >
                                </tr>
                            </thead>
                            <tbody
                                class="divide-y divide-neutral-200 dark:divide-neutral-600"
                            >
                                <tr class="">
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{distributionDtl.distribution
                                                    .positionDate}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    distributionDtl.distribution
                                                        .sales,
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{Math.trunc(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .percentage,
                                                    ),
                                                )} %
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                            >
                                                =
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .totalAmount,
                                                    ),
                                                )}</span
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
        <div class="mt-4 flex flex-col">
            <div class="">
                <div class="inline-block w-full align-middle">
                    <div class="overflow-x-auto">
                        <table
                            class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                        >
                            <thead
                                class=" bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                            >
                                <tr>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                        >Dealer allowance</th
                                    >
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                    >
                                        Team Leader allowance
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                    >
                                        Manager allowance
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                    >
                                        Director allowance
                                    </th>

                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                    >
                                        Executive Partner allowance
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-center"
                                    >
                                        Miracle Group allowance
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="">
                                <tr class="">
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .dealerAllowance,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .teamLeaderAllowance,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .managerAllowance,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .directorAllowance,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .executivePartnerAllowance,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        distributionDtl
                                                            .distribution
                                                            .corporateAllowance,
                                                    ),
                                                )}</span
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

    <div
        class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md sm:p-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="">
            <div class="inline-block w-full align-middle">
                <div class="overflow-x-auto">
                    <div
                        class="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0"
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
                                            getDistributionDtlListTableData(
                                                pageNumber,
                                                rowsPerPage,
                                                searchFilter,
                                                distributionId,
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
                                    bind:value={rankId}
                                    on:change={onChangeRank}
                                    class="peer mr-4 block w-full appearance-none border-0 border-b border-neutral-300 bg-white px-0 py-2.5 text-sm text-neutral-600 focus:border-neutral-200 focus:outline-none focus:ring-0 lg:w-[201px] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                                >
                                    <option
                                        value=""
                                        disabled
                                        selected>Rank</option
                                    >
                                    {#each ranks as row}
                                        <option value={row.rankId}
                                            >{row.rankName}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                        </div>
                    </div>
                    <table
                        class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                    >
                        <thead
                            class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                        >
                            <tr>
                                <th
                                    scope="col"
                                    class=" px-4 py-3 text-center">Member Id</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Name</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Rank</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Percentage</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Amount</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Created date</th
                                >
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-neutral-200 dark:divide-neutral-600"
                        >
                            {#each paginatedDistributionDtl as row}
                                <tr class="">
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                >{row.user.memberId}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{capitalizeFirstLetter(
                                                    row.user.firstName,
                                                )}&nbsp;{capitalizeFirstLetter(
                                                    row.user.middleName ?? '',
                                                )}&nbsp
                                                {capitalizeFirstLetter(
                                                    row.user.lastName,
                                                )}&nbsp;{capitalizeFirstLetter(
                                                    row.user.suffix ?? '',
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap p-2 text-center text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{row.rank.name}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{Math.trunc(
                                                    Number(
                                                        row.distribution_dtl
                                                            .percentage,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class=" whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{numberFormatter.format(
                                                    Number(
                                                        row.distribution_dtl
                                                            .amount,
                                                    ),
                                                )}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class=" whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="text-xs text-neutral-800 dark:text-neutral-300"
                                                >{new Date(
                                                    row.distribution_dtl.createdAt,
                                                ).toLocaleString()}</span
                                            >
                                        </div>
                                    </th>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div
                    class="sticky bottom-0 right-0 items-center border-t border-neutral-300 bg-neutral-100 p-4 sm:flex sm:justify-between dark:border-neutral-600 dark:bg-neutral-700"
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
                                    getDistributionDtlListTableData(
                                        pageNumber,
                                        rowsPerPage,
                                        searchFilter,
                                        distributionId,
                                    )
                                }}
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 ml-2 mr-2 block rounded-lg border border-neutral-300 py-1.5 pl-3.5 pr-6 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                            >
                                {#each $rowPerPageStore as row}
                                    <option value={row.value}>{row.name}</option
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
                                    getDistributionDtlListTableData(
                                        pageNumber - 1,
                                        rowsPerPage,
                                        searchFilter,
                                        distributionId,
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
                                    getDistributionDtlListTableData(
                                        pageNumber + 1,
                                        rowsPerPage,
                                        searchFilter,
                                        distributionId,
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
