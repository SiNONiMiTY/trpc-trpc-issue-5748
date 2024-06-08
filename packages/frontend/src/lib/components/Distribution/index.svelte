<script lang="ts">
    import {
        distributePaginationInputSchema,
        distributionInputSchema,
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

    // Modal
    let confirmModalDistribution: Modal
    let successModalDistribution: Modal

    // Form Data
    const formData = {
        positionDate: '',
        sales: '',
        percentage: '',
        totalAmount: '',
        dealerAllowance: '',
        teamLeaderAllowance: '',
        managerAllowance: '',
        directorAllowance: '',
        executivePartnerAllowance: '',
        corporateAllowance: '',
    }

    let numbersFormData = {
        totalExecPartner: 0,
        totalDirector: 0,
        totalManager: 0,
        totalTeamLeader: 0,
        totalDealer: 0,
    }

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

    let distributionHdr: TRouterOutput['distribution']['getDistributionHdr'] = {
        paginatedDistributionHdr: [],
        totalNumberOfDistributionHdr: 0,
    }

    let paginatedDistributionHdr = distributionHdr.paginatedDistributionHdr

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    let validatedFormData: TRouterInput['distribution']['processDistribution']
    let multiplier: TRouterOutput['distribution']['getMultiplier']
    let totalSales: TRouterOutput['distribution']['getTotalSales']
    let showValidateMessage: Record<string, string> = {}
    let alertMessage = ''
    let disableCalculateBtn = true
    let disableSaveBtn = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(async () => {
        confirmModalDistribution = new Modal(
            document.getElementById('confirmModalDistributionElem'),
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

        successModalDistribution = new Modal(
            document.getElementById('successModalDistributionElem'),
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

        await getNumbersPerRank()
        await getMultiplier()
        await getTotalSales()
        getDistributionHdrListTableData(
            pageNumber,
            rowsPerPage,
            fromDate,
            toDate,
        )
    })

    //////////////
    // Handlers //
    //////////////

    const getNumbersPerRank = async () => {
        const perRank =
            await $trpcClient.distribution.getTotalMemberPerRank.query()
        numbersFormData = { ...perRank }
    }

    const getMultiplier = async () => {
        multiplier = await $trpcClient.distribution.getMultiplier.query()
        formData.percentage = `${multiplier.value?.totalSalesMultiplier}`
    }

    const getTotalSales = async () => {
        totalSales = await $trpcClientStore.distribution.getTotalSales.query({
            sessionId: $sessionData?.sessionId || '',
        })
    }

    const handleCalculateBtn = () => {
        const netSales =
            Number(formData.sales) *
            (Number(multiplier.value?.totalSalesMultiplier) / 100)

        const dealer =
            netSales * (Number(multiplier.value?.dealerOMDMultiplier) / 100)

        const teamLeader =
            netSales * (Number(multiplier.value?.teamLeaderOMDMultiplier) / 100)

        const manager =
            netSales * (Number(multiplier.value?.managerOMDMultiplier) / 100)

        const director =
            netSales * (Number(multiplier.value?.directorOMDMultiplier) / 100)

        const execPartner =
            netSales * (Number(multiplier.value?.execPartnerMultiplier) / 100)

        const corporate =
            netSales * (Number(multiplier.value?.corporateMultiplier) / 100)

        formData.totalAmount = numberFormatter.format(
            isNaN(netSales) ? 0 : netSales,
        )
        formData.dealerAllowance = numberFormatter.format(
            isNaN(dealer) || dealer === Infinity ? 0 : dealer,
        )
        formData.teamLeaderAllowance = numberFormatter.format(
            isNaN(teamLeader) || teamLeader === Infinity ? 0 : teamLeader,
        )
        formData.managerAllowance = numberFormatter.format(
            isNaN(manager) || manager === Infinity ? 0 : manager,
        )
        formData.directorAllowance = numberFormatter.format(
            isNaN(director) || director === Infinity ? 0 : director,
        )
        formData.executivePartnerAllowance = numberFormatter.format(
            isNaN(execPartner) || execPartner === Infinity ? 0 : execPartner,
        )
        formData.corporateAllowance = numberFormatter.format(
            isNaN(corporate) ? 0 : corporate,
        )

        disableSaveBtn = false
    }

    const checkDisableCalculateBtn = () => {
        disableCalculateBtn =
            !formData.positionDate ||
            !formData.sales ||
            !formData.percentage ||
            Number(formData.sales) > totalSales

        if (formData.totalAmount) {
            formData.totalAmount = ''
            formData.dealerAllowance = ''
            formData.teamLeaderAllowance = ''
            formData.managerAllowance = ''
            formData.directorAllowance = ''
            formData.executivePartnerAllowance = ''
            formData.corporateAllowance = ''
            disableSaveBtn = true
        }
    }

    const handlePositionDate: FormEventHandler<HTMLInputElement> = (event) => {
        // formData.positionDate = event.currentTarget.value.replace(
        //     /[^0-9-]/g,
        //     '',
        // )
        checkDisableCalculateBtn()
    }

    const handleSales: FormEventHandler<HTMLInputElement> = (event) => {
        formData.sales = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        checkDisableCalculateBtn()
    }

    const handlepercentage: FormEventHandler<HTMLInputElement> = (event) => {
        formData.percentage = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        checkDisableCalculateBtn()
    }

    const handleDealerAllowance: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.dealerAllowance = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.dealerAllowance) {
            const elemId = document.getElementById(
                'dealerAllowance',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.dealerAllowance = ''
        }
    }

    const handleTeamLeaderAllowance: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.teamLeaderAllowance = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''
        if (formData.teamLeaderAllowance) {
            const elemId = document.getElementById(
                'teamLeaderAllowance',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.teamLeaderAllowance = ''
        }
    }

    const handleManagerAllowance: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.managerAllowance = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.managerAllowance) {
            const elemId = document.getElementById(
                'managerAllowance',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.managerAllowance = ''
        }
    }

    const handleDirectorAllowance: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.directorAllowance = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.directorAllowance) {
            const elemId = document.getElementById(
                'directorAllowance',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.directorAllowance = ''
        }
    }

    const handleexecutivePartnerAllowance: FormEventHandler<
        HTMLInputElement
    > = (event) => {
        formData.executivePartnerAllowance = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.executivePartnerAllowance) {
            const elemId = document.getElementById(
                'executivePartnerAllowance',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.executivePartnerAllowance = ''
        }
    }

    const handleCorporateAllowance: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.corporateAllowance = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.corporateAllowance) {
            const elemId = document.getElementById(
                'corporateAllowance',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.corporateAllowance = ''
        }
    }

    const getDistributionHdrListTableData = async (
        pn = pageNumber,
        rpp = rowsPerPage,
        fd = fromDate,
        td = toDate,
    ) => {
        let url = new URL($page.url)

        if (pn > 0 && pn <= totalPages) {
            pageNumber = pn
        }

        if (rpp) url.searchParams.set('rowsPerPage', `${rpp}`)
        if (pn) url.searchParams.set('pageNumber', `${pageNumber}`)

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

        await getDistributionHdrList()
    }

    const getDistributionHdrList = async () => {
        const validator = await distributePaginationInputSchema.safeParseAsync({
            sessionId: $sessionData?.sessionId,
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            fromDate,
            toDate,
        })

        if (validator.success) {
            distributionHdr =
                await $trpcClientStore.distribution.getDistributionHdr.query(
                    validator.data,
                )

            if (distributionHdr) {
                paginatedDistributionHdr =
                    distributionHdr.paginatedDistributionHdr
                totalItems = distributionHdr.totalNumberOfDistributionHdr
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

    const handleSaveBtn = async () => {
        const validator = await distributionInputSchema.safeParseAsync({
            sessionId: $sessionData?.sessionId,
            totalSales: totalSales,
            ...numbersFormData,
            positionDate: formData.positionDate,
            sales: Number(formData.sales.replace(/,/g, '')),
            percentage: formData.percentage,
            totalAmount: Number(formData.totalAmount.replace(/,/g, '')),
            dealerAllowance: Number(formData.dealerAllowance.replace(/,/g, '')),
            teamLeaderAllowance: Number(
                formData.teamLeaderAllowance.replace(/,/g, ''),
            ),
            managerAllowance: Number(
                formData.managerAllowance.replace(/,/g, ''),
            ),
            directorAllowance: Number(
                formData.directorAllowance.replace(/,/g, ''),
            ),
            executivePartnerAllowance: Number(
                formData.executivePartnerAllowance.replace(/,/g, ''),
            ),
            corporateAllowance: Number(
                formData.corporateAllowance.replace(/,/g, ''),
            ),
        })

        if (validator.success) {
            validatedFormData = validator.data
            confirmModalDistribution.show()
        } else {
            showValidateMessage = {}
            validator.error.issues.forEach((key, index) => {
                key.path.forEach((elem) => {
                    const elemId = document.getElementById(
                        `${String(elem)}`,
                    ) as HTMLInputElement

                    if (elemId) {
                        if (index === 0) {
                            elemId.focus()
                        }

                        elemId.classList.add(
                            'border-red-700',
                            'dark:border-red-700',
                            'border-2',
                        )
                    }

                    showValidateMessage[elem] = key.message
                })
            })
        }
    }

    const handleConfirmYesBtn = async () => {
        try {
            const response =
                await $trpcClientStore.distribution.processDistribution.mutate(
                    validatedFormData,
                )

            if (response) {
                alertMessage = `Distribution successful.`
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            successModalDistribution.show()
        } catch (err) {
            const issues: ZodIssue[] = JSON.parse((err as TRPCError).message)
            issues.forEach((key, index) => {
                key.path.forEach((elem) => {
                    const elemId = document.getElementById(
                        `${String(elem)}`,
                    ) as HTMLInputElement

                    if (elemId) {
                        if (index === 0) {
                            elemId.focus()
                        }

                        elemId.classList.add(
                            'border-red-700',
                            'dark:border-red-700',
                            'border-2',
                        )
                        showValidateMessage[elem] = key.message
                    }
                })
            })
        }
    }

    const handleSuccessContinueBtn = () => {
        formData.positionDate = ''
        formData.sales = ''
        checkDisableCalculateBtn()
        getDistributionHdrListTableData(
            pageNumber,
            rowsPerPage,
            fromDate,
            toDate,
        )
        confirmModalDistribution.hide()
        successModalDistribution.hide()
    }

    const handleGoToDetails = (id: string) => {
        let url = `/app/distribution/details?rowsPerPage=10&pageNumber=1&id=${id}`
        goto(url, {
            noScroll: true,
            keepFocus: true,
        })
    }
</script>

<div class="p-4">
    <div class="mx-auto max-w-screen-md text-center">
        <h2
            class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
        >
            Distribution
        </h2>
    </div>

    <div
        class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md sm:p-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
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
                                    class="px-2 py-3 text-center"
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
                                            >{numbersFormData.totalDealer}</span
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
                                            >{numbersFormData.totalTeamLeader}</span
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
                                            >{numbersFormData.totalManager}</span
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
                                            >{numbersFormData.totalDirector}</span
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
                                            >{numbersFormData.totalExecPartner}</span
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
    <!--Second Table-->
    <div
        class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md sm:p-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="mb-4 items-center justify-center lg:flex">
            <p
                class="text-base font-semibold text-neutral-800 dark:text-neutral-300"
            >
                Total Sales: {numberFormatter.format(totalSales)}
            </p>
        </div>

        <div class=" flex flex-col">
            <div class="lg:mx-auto">
                <div
                    class="inline-block w-full items-center align-middle lg:w-auto"
                >
                    <div
                        class="overflow-x-auto rounded-lg border border-neutral-300 p-2 dark:border-neutral-600"
                    >
                        <table
                            class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                        >
                            <thead
                                class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                            >
                                <tr>
                                    <th
                                        scope="col"
                                        class="px-2 py-3 text-center"
                                        >Selection of position base date</th
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
                                        class="whitespace-nowrap py-3 text-sm text-black dark:text-neutral-300"
                                    >
                                        <!-- <div id="wrapper">
                                            <input
                                                type="text"
                                                id="day"
                                                maxlength="2"
                                            />/<input
                                                type="text"
                                                id="month"
                                                maxlength="2"
                                            />/<input
                                                type="text"
                                                id="year"
                                                maxlength="4"
                                            />
                                        </div> -->
                                        <input
                                            type="date"
                                            id="positionDate"
                                            name="positionDate"
                                            bind:value={formData.positionDate}
                                            on:input={handlePositionDate}
                                            class="mx-auto block w-36 rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        />
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="sales"
                                            name="sales"
                                            bind:value={formData.sales}
                                            on:input={handleSales}
                                            class="block w-36 rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
                                    <th
                                        scope="row"
                                        class="w-36 whitespace-nowrap p-2 text-center text-black dark:text-neutral-300"
                                    >
                                        <div
                                            class="flex items-center space-x-2 p-2"
                                        >
                                            <input
                                                type="text"
                                                id="percentage"
                                                name="percentage"
                                                bind:value={formData.percentage}
                                                on:input={handlepercentage}
                                                class="block w-28 rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                            />
                                            <span> % </span>

                                            <button
                                                type="button"
                                                on:click={handleCalculateBtn}
                                                disabled={disableCalculateBtn}
                                                class="{disableCalculateBtn
                                                    ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                                                    : 'bg-[#FF9119] hover:bg-[#FF9119]/80 dark:hover:bg-[#FF9119]/80'} items-center rounded-lg px-5 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-[#FF9119]/50 dark:focus:ring-[#FF9119]/40"
                                            >
                                                Calculate
                                            </button>
                                        </div>
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="totalAmount"
                                            name="totalAmount"
                                            disabled
                                            bind:value={formData.totalAmount}
                                            class="block w-28 rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
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
                                class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
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
                                        class="whitespace-nowrap px-4 py-3 text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="dealerAllowance"
                                            name="dealerAllowance"
                                            bind:value={formData.dealerAllowance}
                                            on:input={handleDealerAllowance}
                                            class="mx-auto block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        />
                                    </th>
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="teamLeaderAllowance"
                                            name="teamLeaderAllowance"
                                            bind:value={formData.teamLeaderAllowance}
                                            on:input={handleTeamLeaderAllowance}
                                            class="mx-auto block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="managerAllowance"
                                            name="managerAllowance"
                                            bind:value={formData.managerAllowance}
                                            on:input={handleManagerAllowance}
                                            class="mx-auto block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="directorAllowance"
                                            name="directorAllowance"
                                            bind:value={formData.directorAllowance}
                                            on:input={handleDirectorAllowance}
                                            class="mx-auto block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-black dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="executivePartnerAllowance"
                                            name="executivePartnerAllowance"
                                            bind:value={formData.executivePartnerAllowance}
                                            on:input={handleexecutivePartnerAllowance}
                                            class="mx-auto block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap px-4 py-3 text-center dark:text-neutral-300"
                                    >
                                        <input
                                            type="text"
                                            id="corporateAllowance"
                                            name="corporateAllowance"
                                            bind:value={formData.corporateAllowance}
                                            on:input={handleCorporateAllowance}
                                            class="mx-auto block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-center text-xs text-gray-900 focus:border-neutral-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-300 dark:focus:border-orange-500 dark:focus:ring-orange-500"
                                        /></th
                                    >
                                </tr>
                                <tr class="">
                                    <th
                                        scope="row"
                                        class=""
                                    >
                                        {#if showValidateMessage.dealerAllowance}
                                            <div
                                                class="mt-1 flex items-center justify-center"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.dealerAllowance}</span
                                                >
                                            </div>
                                        {/if}
                                    </th>
                                    <th
                                        scope="row"
                                        class=""
                                    >
                                        {#if showValidateMessage.teamLeaderAllowance}
                                            <div
                                                class="mt-1 flex items-center justify-center"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.teamLeaderAllowance}</span
                                                >
                                            </div>
                                        {/if}
                                    </th>
                                    <th
                                        scope="row"
                                        class=""
                                    >
                                        {#if showValidateMessage.managerAllowance}
                                            <div
                                                class="mt-1 flex items-center justify-center"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.managerAllowance}</span
                                                >
                                            </div>
                                        {/if}
                                    </th>
                                    <th
                                        scope="row"
                                        class=""
                                    >
                                        {#if showValidateMessage.directorAllowance}
                                            <div
                                                class="mt-1 flex items-center justify-center"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.directorAllowance}</span
                                                >
                                            </div>
                                        {/if}
                                    </th>
                                    <th
                                        scope="row"
                                        class=""
                                    >
                                        {#if showValidateMessage.executivePartnerAllowance}
                                            <div
                                                class="mt-1 flex items-center justify-center"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.executivePartnerAllowance}</span
                                                >
                                            </div>
                                        {/if}
                                    </th>
                                    <th
                                        scope="row"
                                        class=""
                                    >
                                        {#if showValidateMessage.corporateAllowance}
                                            <div
                                                class="mt-1 flex items-center justify-center"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.corporateAllowance}</span
                                                >
                                            </div>
                                        {/if}
                                    </th>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="mx-auto mt-8 flex w-full justify-center">
            <button
                type="button"
                disabled={disableSaveBtn}
                on:click={handleSaveBtn}
                class="{disableSaveBtn
                    ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                    : 'bg-[#FF9119] hover:bg-[#FF9119]/80 dark:hover:bg-[#FF9119]/80'} w-36 items-center rounded-lg py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-[#FF9119]/50 dark:focus:ring-[#FF9119]/40"
            >
                Save
            </button>
        </div>
    </div>
    <!---Third Table-->
    <div
        class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md sm:p-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="">
            <div class="inline-block w-full align-middle">
                <div class="overflow-x-auto">
                    <div
                        class="flex flex-col items-center justify-between space-y-3 p-4 md:flex-row md:space-y-0"
                    >
                        <div
                            class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-2 md:space-y-0"
                        >
                            <span
                                class="text-center text-neutral-800 dark:text-neutral-300"
                                >Search date from</span
                            >
                            <div class="items-center sm:mx-auto">
                                <input
                                    name="start"
                                    type="date"
                                    bind:value={fromDate}
                                    on:change={() => {
                                        getDistributionHdrListTableData(
                                            pageNumber,
                                            rowsPerPage,
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
                                        getDistributionHdrListTableData(
                                            pageNumber,
                                            rowsPerPage,
                                            fromDate,
                                            toDate,
                                        )
                                    }}
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-100 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:placeholder-neutral-400"
                                />
                            </div>
                        </div>
                        <!-- <div class="w-full md:w-1/4">
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
                                        placeholder="Search Date"
                                        bind:value={searchFilter}
                                        on:input={() => {
                                            getDistributionHdrListTableData(
                                                pageNumber,
                                                rowsPerPage,
                                                searchFilter,
                                            )
                                        }}
                                    />
                                </div>
                            </form>
                        </div> -->
                    </div>
                    <table
                        class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                    >
                        <thead
                            class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                        >
                            <tr>
                                <!-- <th
                                    scope="col"
                                    class="p-4"
                                >
                                    <div class="flex items-center">
                                        <input
                                            id="checkbox-all"
                                            type="checkbox"
                                            class="h-4 w-4 rounded border-neutral-300 bg-neutral-100 text-orange-400 focus:ring-2 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:ring-offset-neutral-800 dark:focus:ring-orange-600 dark:focus:ring-offset-neutral-800"
                                        />
                                        <label
                                            for="checkbox-all"
                                            class="sr-only">checkbox</label
                                        >
                                    </div>
                                </th> -->
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Date</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Distribution Amount</th
                                >

                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Percentage</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Total amount</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Dealer allowance</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Team Leader allowance</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Manager allowance</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Director allowance</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Executive Partner allowance</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Miracle Group allowance</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Distributed By</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center"
                                    >Created date</th
                                >
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-center">Action</th
                                >
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-neutral-200 dark:divide-neutral-600"
                        >
                            {#each paginatedDistributionHdr as row}
                                <tr class="">
                                    <!-- <td class="w-4 p-4">
                                    <div class="flex items-center">
                                        <input
                                            id="checkbox-all"
                                            type="checkbox"
                                            class="h-4 w-4 rounded border-neutral-300 bg-neutral-100 text-orange-400 focus:ring-2 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:ring-offset-neutral-800 dark:focus:ring-orange-600 dark:focus:ring-offset-neutral-800"
                                        />
                                        <label
                                            for="checkbox-table-1"
                                            class="sr-only">checkbox</label
                                        >
                                    </div>
                                </td> -->
                                    <th
                                        scope="row"
                                        class="whitespace-nowrap py-3 text-center text-sm text-black dark:text-neutral-300"
                                    >
                                        <div>
                                            <span
                                                class="px-4 text-xs text-neutral-800 dark:text-neutral-300"
                                                >{row.distribution_hdr
                                                    .positionDate}</span
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
                                                >{numberFormatter.format(
                                                    row.distribution_hdr.sales,
                                                )}</span
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
                                                >{Math.trunc(
                                                    Number(
                                                        row.distribution_hdr
                                                            .percentage,
                                                    ),
                                                )}</span
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
                                                >{numberFormatter.format(
                                                    Number(
                                                        row.distribution_hdr
                                                            .totalAmount,
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
                                                        row.distribution_hdr
                                                            .dealerAllowance,
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
                                                        row.distribution_hdr
                                                            .teamLeaderAllowance,
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
                                                        row.distribution_hdr
                                                            .managerAllowance,
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
                                                        row.distribution_hdr
                                                            .directorAllowance,
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
                                                        row.distribution_hdr
                                                            .executivePartnerAllowance,
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
                                                        row.distribution_hdr
                                                            .corporateAllowance,
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
                                                >{row.user.firstName}</span
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
                                                    row.distribution_hdr.createdAt,
                                                ).toLocaleString()}</span
                                            >
                                        </div>
                                    </th>
                                    <th
                                        class="whitespace-nowrap px-4 py-3 text-center"
                                    >
                                        <div
                                            class="flex items-center justify-center space-x-2"
                                        >
                                            <button
                                                type="button"
                                                on:click={() =>
                                                    handleGoToDetails(
                                                        row.distribution_hdr.id,
                                                    )}
                                                class="inline-flex items-center rounded-lg bg-orange-400 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                                            >
                                                See Details
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
                                            </button>
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
                                    getDistributionHdrListTableData(
                                        pageNumber,
                                        rowsPerPage,
                                        fromDate,
                                        toDate,
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
                                    getDistributionHdrListTableData(
                                        pageNumber - 1,
                                        rowsPerPage,
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
                                    getDistributionHdrListTableData(
                                        pageNumber + 1,
                                        rowsPerPage,
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

    <!-- <div class="grid grid-cols-6 p-10">
        <div
            class="col-span-4 col-start-2 flex h-96 items-center justify-center"
        >
            <div class="w-full max-w-2xl">
                <div
                    class="mb-4 rounded-lg border border-gray-200 bg-white p-2 shadow xl:mb-0 dark:border-gray-300 dark:bg-[#ebebed]"
                >
                    <div
                        class="grid place-content-center items-center md:grid-cols-1"
                    >
                        <div class="flex justify-center">
                            <div>
                                <div class="py-4 text-center">
                                    <h3
                                        class="text-xl font-semibold text-gray-900 dark:text-gray-900"
                                    >
                                        Sales for Today: 445,467
                                    </h3>
                                </div>
                                <div class="rounded-lg">
                                    <div>
                                        <input
                                            type="text"
                                            name="memberId"
                                            id="memberId"
                                            maxlength="10"
                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-lg dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                            placeholder="Enter Sales to Distribute"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-center p-2 pt-8">
                            <div>
                                <div class="text-center">
                                    <h1
                                        class="text-md mb-2 font-bold leading-tight tracking-tight text-gray-900 md:text-xl dark:text-gray-900"
                                    >
                                        Distribute To:
                                    </h1>
                                </div>
                                <div class="">
                                    <div
                                        class="mt-2 grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
                                    >
                                        <div
                                            class="flex items-center sm:justify-center"
                                        >
                                            <input
                                                id="modeOfDistribution"
                                                name="modeOfDistribution"
                                                type="radio"
                                                checked={formData.modeOfDistribution ===
                                                    'ALLMEMBER'}
                                                on:change={handleModeofDIstribution}
                                                value="ALLMEMBER"
                                                class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 items-center border border-gray-300 bg-gray-50 dark:border-gray-600 dark:ring-offset-gray-800"
                                            />
                                            <label
                                                for="modeOfDistribution"
                                                class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-900"
                                                >All Members</label
                                            >
                                        </div>
                                        <div
                                            class="flex items-center sm:justify-center"
                                        >
                                            <input
                                                id="modeOfDistribution2"
                                                name="modeOfDistribution"
                                                type="radio"
                                                checked={formData.modeOfDistribution ===
                                                    'PERRANK'}
                                                on:change={handleModeofDIstribution}
                                                value="PERRANK"
                                                class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:ring-offset-gray-800"
                                            />
                                            <label
                                                for="modeOfDistribution2"
                                                class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-900"
                                                >Per Rank</label
                                            >
                                        </div>
                                        <div
                                            class="flex items-center sm:justify-center"
                                        >
                                            <input
                                                id="modeOfDistribution3"
                                                name="modeOfDistribution"
                                                type="radio"
                                                checked={formData.modeOfDistribution ===
                                                    'PERMEMBER'}
                                                on:change={handleModeofDIstribution}
                                                value="PERMEMBER"
                                                class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:ring-offset-gray-800"
                                            />
                                            <label
                                                for="modeOfDistribution3"
                                                class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-900"
                                                >Per Member</label
                                            >
                                        </div>
                                        {#if showValidateMessage.modeOfDistribution}
                                            <div
                                                class="mt-1 flex items-center justify-start"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.modeOfDistribution}</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="{['', 'ALLMEMBER'].includes(
                                formData.modeOfDistribution,
                            )
                                ? 'hidden'
                                : ''} my-2 flex justify-center"
                        >
                            <div
                                class="space-y-4 rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-600 dark:bg-[#ebebed]"
                            >
                                <label
                                    for="bank"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-900"
                                >
                                    {formData.modeOfDistribution === 'PERRANK'
                                        ? 'Rank'
                                        : 'Member'}
                                </label>
                                {#if formData.modeOfDistribution === 'PERRANK'}
                                    <div>
                                        <select
                                            id="rankId"
                                            name="rankId"
                                            bind:value={formData.rankId}
                                            on:change={handleRankChange}
                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:w-96 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                                        >
                                            <option
                                                value=""
                                                disabled
                                                selected>Select Rank</option
                                            >
                                            {#each ranks as row}
                                                <option value={row.rankId}
                                                    >{row.rankName}</option
                                                >
                                            {/each}
                                        </select>
                                    </div>
                                {:else}
                                    <div>
                                        <input
                                            type="text"
                                            name="memberName"
                                            id="memberName"
                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:w-96 dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                            placeholder="Enter Name"
                                        />
                                        {#if showValidateMessage.firstName}
                                            <div
                                                class="mt-1 flex items-center justify-start"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.firstName}</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-center py-4">
                        <button
                            type="button"
                            class="items-center rounded-lg bg-[#FF9119] px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-[#FF9119]/80 focus:outline-none focus:ring-4 focus:ring-[#FF9119]/50 dark:hover:bg-[#FF9119]/80 dark:focus:ring-[#FF9119]/40"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div> -->
</div>

<div
    id="confirmModalDistributionElem"
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
                    Are you sure you want to save this distribution?
                </h3>
                <button
                    on:click={handleConfirmYesBtn}
                    type="button"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmModalDistribution.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="successModalDistributionElem"
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

<style>
    #wrapper {
        background: #fff;
        display: block;
        border-color: rgb(212 212 212);
        border-width: 1px;
        border-radius: 0.5rem;
    }
    #day,
    #month,
    #year {
        width: 50px;
        border: 0;
        text-align: center;
        outline: 0;
    }
    #year {
        width: 100px;
    }
</style>
