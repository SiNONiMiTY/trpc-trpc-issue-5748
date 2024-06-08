<script lang="ts">
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { Modal } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { Readable } from 'svelte/store'
    import type { ZodIssue } from 'zod'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import {
        sessionDataStore,
        trpcClientStoreLegacy,
        trpcClientStore,
    } from '$lib/stores.js'
    import { getImageDataURL } from '$lib/utilities.js'
    import countries from '../../Country/country'

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

    let viewModal: Modal
    let confirmModal: Modal
    let successModal: Modal
    let zoomModal: Modal

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

    $: totalItems = 0
    $: totalPages = 0
    $: fromPage = 0
    $: toPage = 0

    let forApproval: TRouterOutput['user']['getForApprovalList'] = {
        paginatedForApproval: [],
        totalNumberOfForApproval: 0,
    }

    let paginatedForApproval = forApproval.paginatedForApproval

    let roles: TRouterOutput['user']['getRoles']

    const formData = {
        userId: '',
        memberId: '',
        password: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        fullName: '',
        emailAddress: '',
        mobileNumber: '',
        taxIdentificationNumber: '',
        birthdate: '',
        gender: '',
        address: '',
        country: 'PH',
        introducerId: '',
        introducerName: '',
        placerId: '',
        placerName: '',
        isVerified: false,
        rankName: '',
        promotionThreshold: 0,
        commissionPercentage: '',
    }

    let imageData: Record<
        string,
        { data: string | null; type: string; name: string }
    > = {
        proofOfPayment: {
            data: null,
            type: '',
            name: '',
        },
        validId: {
            data: null,
            type: '',
            name: '',
        },
    }

    let alertMessage = ''
    let selectedRole = 3
    let isProof = false

    const isWeb = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(() => {
        viewModal = new Modal(document.getElementById('viewModalElem'), {
            placement: 'bottom-right',
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

        confirmModal = new Modal(
            document.getElementById('confirmModalApprovalElem'),
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

        successModal = new Modal(
            document.getElementById('successModalApprovalElem'),
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

        zoomModal = new Modal(document.getElementById('zoomModalElem'), {
            placement: 'bottom-right',
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

        $trpcClientStore.ws.signUpApproval.subscribe(
            { sessionId: $sessionData?.sessionId || '' },
            {
                onData: (value) => {
                    getForApprovalListTableData(
                        pageNumber,
                        rowsPerPage,
                        searchFilter,
                    )
                },
            },
        )
    })

    //////////////
    // Handlers //
    //////////////

    const getForApprovalListTableData = (
        pn = pageNumber,
        rpp = rowsPerPage,
        sf = searchFilter,
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

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })

        getForApprovalList()
    }

    const getForApprovalList = async () => {
        forApproval = await $trpcClient.user.getForApprovalList.query({
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
        })

        if (forApproval) {
            roles = await $trpcClient.user.getRoles.query()
            paginatedForApproval = forApproval.paginatedForApproval
            totalItems = forApproval.totalNumberOfForApproval
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const getMemberProfile = async (
        id: string,
        memberId: string,
        fullName: string,
        introId: string,
        introName: string,
        placerId: string,
        placerName: string,
    ) => {
        const memberProfile = await $trpcClient.user.getProfile.query({
            userId: id,
        })

        formData.userId = id
        formData.memberId = memberId
        formData.fullName = fullName
        formData.birthdate =
            dayjs(memberProfile.user.birthdate).toISOString().split('T')[0] ??
            ''
        formData.gender = memberProfile.user.gender ?? ''
        formData.mobileNumber = memberProfile.user.mobileNumber ?? ''
        formData.emailAddress = memberProfile.user.emailAddress ?? ''
        formData.address = memberProfile.user.address ?? ''
        formData.taxIdentificationNumber =
            memberProfile.user.taxIdentificationNumber ?? ''
        formData.country =
            countries.find((c) => c.code === memberProfile.user.country)
                ?.name ?? ''
        formData.introducerId = introId
        formData.introducerName = introName
        formData.placerId = placerId
        formData.placerName = placerName
        formData.rankName = memberProfile.rank.name
        formData.promotionThreshold = memberProfile.rank.promotionThreshold
        formData.commissionPercentage = memberProfile.rank.commissionPercentage

        imageData['proofOfPayment'].name =
            `${memberProfile.uploaded.proofOfPayment}`
        imageData['validId'].name = `${memberProfile.uploaded.validId}`

        imageData = await getImageDataURL(
            imageData,
            formData.userId,
            `${$sessionData?.sharedAccessSignature}`,
        )
    }

    const handleMoreDetailBtn = (
        id: string,
        memberId: string,
        fullName: string,
        introId: string,
        introName: string,
        placerId: string,
        placerName: string,
    ) => {
        getMemberProfile(
            id,
            memberId,
            fullName,
            introId,
            introName,
            placerId,
            placerName,
        )
        viewModal.show()
    }

    const handleApproveDeclineBtn = (verified: boolean) => {
        formData.isVerified = verified
        confirmModal.show()
    }

    const handleConfirmYesBtn = async () => {
        try {
            const response = await $trpcClient.user.updateIsVerified.mutate({
                userId: formData.userId,
                isVerified: formData.isVerified,
            })

            if (response) {
                alertMessage = response.isVerified
                    ? 'Member successfully approved.'
                    : 'Member is declined!'
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            confirmModal.hide()
            successModal.show()
        } catch (err) {
            alertMessage = ''
            const issues: ZodIssue[] = JSON.parse((err as TRPCError).message)
            issues.forEach((key) => {
                alertMessage += `${key.message} `
            })
            successModal.show()
        }
    }

    const handleSuccessContinueBtn = () => {
        viewModal.hide()
        confirmModal.hide()
        successModal.hide()
        getForApprovalListTableData(pageNumber, rowsPerPage, searchFilter)
    }

    const zoomIn = (bool: boolean) => {
        isProof = bool
        zoomModal.show()
    }
</script>

{#if isWeb}
    <div class="p-4">
        <!-- Start coding here -->
        <div class="mx-auto mb-4 max-w-screen-md text-center">
            <h2
                class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
            >
                Member Approval
            </h2>
            <!-- <p
                class="mb-5 font-normal text-gray-500 sm:text-sm dark:text-gray-400"
            >
                List of registered members to be verify for approving.
            </p> -->
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
                                    getForApprovalListTableData(
                                        pageNumber,
                                        rowsPerPage,
                                        searchFilter,
                                    )
                                }}
                            />
                        </div>
                    </form>
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
                                            class="w-16 py-3 pl-4 text-center"
                                        >
                                            <span class="invisible"></span>
                                        </th>
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
                                            >Introducer</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Placer</th
                                        >
                                        <!-- <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Role</th
                                        > -->
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                        >
                                            Registered Date
                                        </th>
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody
                                    class="divide-y divide-neutral-200 font-semibold dark:divide-neutral-600"
                                >
                                    {#each paginatedForApproval as row}
                                        <tr class="">
                                            <td class="py-3 pl-4">
                                                <img
                                                    class="h-10 w-10 rounded-full"
                                                    src="/defaultprofilepic.png"
                                                    alt="Default avatar"
                                                />
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.memberId}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.fullName}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div
                                                    class="text-sm font-normal text-black dark:text-neutral-300"
                                                >
                                                    <div>
                                                        <span
                                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >
                                                            Member ID: {row.introducerId}</span
                                                        >
                                                    </div>

                                                    <p
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {row.introducerName}
                                                    </p>
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center"
                                            >
                                                <div
                                                    class="text-sm font-normal text-black dark:text-neutral-300"
                                                >
                                                    <div>
                                                        <span
                                                            class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >
                                                            Member ID: {row.placerId}</span
                                                        >
                                                    </div>

                                                    <p
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {row.placerName}
                                                    </p>
                                                </div>
                                            </td>
                                            <!-- <td
                                                class="w-52 whitespace-nowrap px-4 py-3 text-center text-black dark:text-gray-900"
                                                ><select
                                                    id="countries"
                                                    bind:value={selectedRole}
                                                    class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                                >
                                                    {#each roles as row}
                                                        <option
                                                            value={row.roleId}
                                                            >{row.roleName}</option
                                                        >
                                                    {/each}
                                                </select></td
                                            > -->
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        Member ID: {new Date(
                                                            row.createdAt,
                                                        ).toLocaleString()}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center"
                                            >
                                                <div
                                                    class="flex items-center justify-center space-x-2"
                                                >
                                                    <button
                                                        type="button"
                                                        class="inline-flex items-center rounded-lg bg-orange-400 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                                                        on:click={() =>
                                                            handleMoreDetailBtn(
                                                                row.userId,
                                                                String(
                                                                    row.memberId,
                                                                ),
                                                                row.fullName,
                                                                String(
                                                                    row.introducerId,
                                                                ),
                                                                row.introducerName,
                                                                String(
                                                                    row.placerId,
                                                                ),
                                                                row.placerName,
                                                            )}
                                                    >
                                                        More Details
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
                                            getForApprovalListTableData(
                                                pageNumber,
                                                rowsPerPage,
                                                searchFilter,
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
                                        on:change={() => {
                                            getForApprovalListTableData(
                                                pageNumber - 1,
                                                rowsPerPage,
                                                searchFilter,
                                            )
                                        }}
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
                                        on:change={() => {
                                            getForApprovalListTableData(
                                                pageNumber + 1,
                                                rowsPerPage,
                                                searchFilter,
                                            )
                                        }}
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
    <button
        class="me-1 flex h-8 w-16 items-center justify-center rounded-lg px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
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

    <div
        class="grid grid-cols-1 px-4 pt-4 xl:grid-cols-3 xl:gap-4 dark:bg-gray-900"
    >
        <!-- Right Content -->
        <div class="col-span-full xl:col-auto">
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
            >
                <div
                    class="items-center sm:flex sm:space-x-4 xl:block xl:space-x-0 2xl:flex 2xl:space-x-4"
                >
                    <img
                        class="mb-4 h-28 w-28 rounded-lg sm:mb-0 xl:mb-4 2xl:mb-0"
                        src="/favicon.png"
                        alt="Jese picture"
                    />
                    <div>
                        <h3
                            class="mb-1 text-sm font-bold text-gray-900 dark:text-white"
                        >
                            Member ID : 18
                        </h3>
                        <h3
                            class="mb-1 text-base font-bold text-gray-900 dark:text-white"
                        >
                            Lindjunne Gerard T. Montenegro II
                        </h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-2">
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
            >
                <h3 class="mb-4 text-xl font-semibold dark:text-white">
                    Information
                </h3>
                <form action="#">
                    <div class="grid grid-cols-6 gap-3">
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="birthdate"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Birthday</label
                            >
                            <input
                                type="text"
                                name="birthdate"
                                id="birthdate"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="gender"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Gender</label
                            >
                            <input
                                type="text"
                                name="gender"
                                id="gender"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="mobileNumber"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Mobile Number</label
                            >
                            <input
                                type="text"
                                name="mobileNumber"
                                id="mobileNumber"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="emailAddress"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Email Address</label
                            >
                            <input
                                type="email"
                                name="emailAddress"
                                id="emailAddress"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="address"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Full Address</label
                            >
                            <input
                                type="text"
                                name="address"
                                id="address"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="taxIdentificationNumber"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >TIN</label
                            >
                            <input
                                type="text"
                                name="taxIdentificationNumber"
                                id="taxIdentificationNumber"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="country"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Country</label
                            >
                            <input
                                type="text"
                                name="country"
                                id="country"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="introducer"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Introducer</label
                            >
                            <input
                                type="text"
                                name="introducer"
                                id="introducer"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="placement"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Placement</label
                            >
                            <input
                                type="text"
                                name="placement"
                                id="placement"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                    </div>
                </form>
            </div>
            <!-- <div
                class="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800"
            >
                <h3 class="mb-4 text-xl font-semibold dark:text-white">
                    Proo of Payment
                </h3>
                <div>
                    <img
                        class="w-full max-h-32 rounded"
                        src={imageDataUrl['proofOfPayment']}
                        alt="image description"
                    />
                </div>
            </div>
            <div
                class="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800"
            >
                <h3 class="mb-4 text-xl font-semibold dark:text-white">
                    Valid ID
                </h3>
                <div>
                    <img
                        class="w-full max-h-32 rounded"
                        src={imageDataUrl['validId']}
                        alt="image description"
                    />
                </div>
            </div> -->
        </div>

        <div class="pb-4">
            <div class="flex gap-2">
                <button
                    class="w-full rounded-lg bg-green-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                    >Approve</button
                >
                <button
                    class="w-full rounded-lg bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                    >Decline</button
                >
            </div>
        </div>
    </div>
{/if}

<div
    id="viewModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-4xl p-4 md:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 shadow sm:p-5 dark:bg-[#a6a6a6]"
        >
            <div
                class="mb-4 flex items-center justify-between rounded-t sm:mb-5"
            >
                <div class="flex">
                    <!-- <div class="mr-3 inline-flex items-center">
                        <img
                            class="h-12 w-12 rounded-full"
                            src="/defaultprofilepic.png"
                            alt="image description"
                        />
                    </div> -->
                    <div class="flex-shrink-0 items-start">
                        <span
                            class="inline-flex text-base font-semibold leading-none text-gray-900 dark:text-white"
                            >{formData.fullName}&nbsp;({formData.rankName})</span
                        >
                        <div>
                            <h3
                                class="text-xs font-medium text-gray-600 sm:text-sm dark:text-gray-50"
                            >
                                Member ID: {formData.memberId}
                            </h3>
                        </div>
                    </div>
                </div>
                <div>
                    <button
                        type="button"
                        class="inline-flex rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                        on:click={() => viewModal.hide()}
                    >
                        <svg
                            aria-hidden="true"
                            class="h-5 w-5 dark:text-white"
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
            </div>
            <div class="grid grid-cols-3 gap-2">
                <dl>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Birthday
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.birthdate}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Mobile No.
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.mobileNumber}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Introducer
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        <p>Member ID: {formData.introducerId}</p>
                        <p>{formData.introducerName}</p>
                    </dd>
                </dl>
                <dl>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Gender
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.gender}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Email Address
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.emailAddress}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Placer
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        <p>Member ID: {formData.placerId}</p>
                        <p>{formData.placerName}</p>
                    </dd>
                </dl>
                <dl>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Country
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.country}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Full Address
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.address}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        TIN
                    </dt>
                    <dd
                        class="mb-4 font-normal text-gray-500 sm:mb-5 dark:text-gray-50"
                    >
                        {formData.taxIdentificationNumber}
                    </dd>
                </dl>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <h3
                        class="mb-2 flex items-center justify-center text-xl font-semibold dark:text-white"
                    >
                        Proof of Payment
                    </h3>
                    <div class="flex items-center justify-center">
                        <div class="h-64 max-h-64">
                            <div
                                class="border-0.5 relative h-64 w-auto rounded-lg bg-neutral-100"
                            >
                                <img
                                    id="proof"
                                    on:click={() => zoomIn(true)}
                                    class="h-full w-full cursor-zoom-in rounded-lg"
                                    src={imageData['proofOfPayment'].data}
                                    alt="LOADING IMAGE"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3
                        class="mb-2 flex items-center justify-center text-xl font-semibold dark:text-white"
                    >
                        Valid ID
                    </h3>
                    <div class="flex items-center justify-center">
                        <div class="h-64 max-h-64">
                            <div
                                class="border-0.5 relative h-64 w-auto rounded-lg bg-neutral-100"
                            >
                                <img
                                    id="valid"
                                    on:click={() => zoomIn(false)}
                                    class="h-full w-full cursor-zoom-in rounded-lg"
                                    src={imageData['validId'].data}
                                    alt="LOADING IMAGE"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-center pt-8">
                <div class="flex items-center space-x-3 sm:space-x-4">
                    <button
                        on:click={() => handleApproveDeclineBtn(true)}
                        type="button"
                        class="inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="mr-2 h-5 w-5"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Approve
                    </button>
                    <button
                        on:click={() => handleApproveDeclineBtn(false)}
                        type="button"
                        class="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-900"
                    >
                        <svg
                            class="mr-2 h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            ></path>
                        </svg>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<div
    id="confirmModalApprovalElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md p-4">
        <div class="relative rounded-lg bg-white shadow dark:bg-[#666666]">
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
                    class="mb-5 text-lg font-normal text-gray-500 dark:text-white"
                >
                    Are you sure you want to {formData.isVerified
                        ? 'approve'
                        : 'decline'} this member?
                </h3>
                <button
                    on:click={() => handleConfirmYesBtn()}
                    type="button"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmModal.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="successModalApprovalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-md p-4 md:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-[#666666]"
        >
            <div
                class="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 p-2 dark:bg-green-700"
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

<div
    id="zoomModalElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
>
    <div class="relative max-h-full w-full max-w-2xl p-4">
        <div class="relative rounded-lg bg-white shadow dark:bg-[#666666]">
            <div
                class="flex items-center justify-between rounded-t border-b p-4 md:p-5 dark:border-gray-600"
            >
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    {isProof ? 'Proof of Payment' : 'Valid ID'}
                </h3>
                <button
                    type="button"
                    on:click={() => zoomModal.hide()}
                    class="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                    <svg
                        class="h-3 w-3"
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
            <div class="flex justify-center p-4">
                <img
                    class="max-w-auto h-[448px] rounded-lg sm:h-[576px]"
                    src={isProof
                        ? imageData['proofOfPayment'].data
                        : imageData['validId'].data}
                    alt="image description"
                />
            </div>
        </div>
    </div>
</div>
