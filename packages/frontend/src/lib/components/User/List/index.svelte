<script lang="ts">
    import { Modal, initDropdowns } from 'flowbite'
    import { afterUpdate, getContext, onMount } from 'svelte'
    import type { Readable } from 'svelte/store'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import ChangePassword from '$lib/components/ChangePassword/index.svelte'
    import Profile from '$lib/components/User/Profile/index.svelte'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'
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

    // Modal
    let memberProfileModal: Modal
    let changePasswordModalMemberList: Modal

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
    let fromDate = $page.url.searchParams.get('fromDate') || ''
    let toDate = $page.url.searchParams.get('toDate') || ''

    $: totalItems = 0
    $: totalPages = 0
    $: fromPage = 0
    $: toPage = 0

    let memberList: TRouterOutput['user']['getMemberList'] = {
        paginatedMembers: [],
        totalNumberOfMembers: 0,
    }

    let paginatedMembers = memberList.paginatedMembers

    const formData = {
        userId: '',
        memberId: '',
        introducerId: '',
        placerId: '',
        isLocked: false,
        isVerified: false,
        idPicture: [] as string[],
    }

    let showValidateMessage: Record<string, string> = {}
    const isWeb = true
    let isVerified: boolean
    let profile: Profile
    let changePass: ChangePassword

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    afterUpdate(() => {
        initDropdowns()
    })

    onMount(async () => {
        memberProfileModal = new Modal(
            document.getElementById('memberProfileModalElem'),
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

        changePasswordModalMemberList = new Modal(
            document.getElementById('changePasswordModalMemberListElem'),
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

        await getMemberListTableData(
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

    const getMemberListTableData = async (
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

        fromDate = fd
        toDate = td

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })

        await getMemberList()
    }

    const getMemberList = async () => {
        memberList = await $trpcClient.user.getMemberList.query({
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
            fromDate,
            toDate,
        })

        if (memberList) {
            paginatedMembers = memberList.paginatedMembers
            totalItems = memberList.totalNumberOfMembers
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const getMemberProfile = (
        bool: boolean,
        id: string,
        introName: string,
        placerName: string,
    ) => {
        isVerified = bool
        formData.userId = id
        profile.getMemberProfile(id, introName, placerName)
        memberProfileModal.show()
    }

    const changePassword = (id: string) => {
        changePass.formData.userId = id
        changePass.clearInput()
        changePasswordModalMemberList.show()
    }
</script>

{#if isWeb}
    <div class="p-4">
        <div class="mx-auto mb-4 max-w-screen-md text-center">
            <h2
                class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
            >
                Members
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
                                    getMemberListTableData(
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

                <div class="flex items-center">
                    {#if fromDate && toDate}
                        <button
                            on:click={() =>
                                getMemberListTableData(
                                    pageNumber,
                                    rowsPerPage,
                                    searchFilter,
                                    '',
                                    '',
                                )}
                            type="button"
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-4"
                        >
                            Show All
                        </button>
                    {/if}
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
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Status</th
                                        >
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
                                    {#each paginatedMembers as row}
                                        <tr
                                            class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                        >
                                            <td class="py-3 pl-4">
                                                <img
                                                    class="h-10 w-10 rounded-full"
                                                    src="/defaultprofilepic.png"
                                                    alt="Default avatar"
                                                />
                                            </td>
                                            <td
                                                class="px-4 py-3 text-center text-sm text-black dark:text-neutral-300"
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
                                                class="whitespace-nowrap px-4 py-3 text-center"
                                                ><div
                                                    class="text-sm font-normal text-black dark:text-neutral-300"
                                                >
                                                    <div
                                                        class="text-xs font-normal text-black dark:text-neutral-300"
                                                    >
                                                        Member ID: {row.introducerId}
                                                    </div>
                                                    <p
                                                        class="text-black dark:text-neutral-300"
                                                    >
                                                        {row.introducerName}
                                                    </p>
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center"
                                                ><div
                                                    class="text-sm font-normal text-black dark:text-neutral-300"
                                                >
                                                    <div
                                                        class="text-xs font-normal text-black dark:text-neutral-300"
                                                    >
                                                        Member ID: {row.placerId}
                                                    </div>
                                                    <p
                                                        class="text-black dark:text-neutral-300"
                                                    >
                                                        {row.placerName}
                                                    </p>
                                                </div>
                                            </td>
                                            <td
                                                class="px-4 py-3 text-center text-sm"
                                            >
                                                {#if row.isVerified}
                                                    {#if row.isLocked}
                                                        <span
                                                            class="rounded-md border border-neutral-100 bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                                                            >Inactive</span
                                                        >
                                                    {:else}
                                                        <span
                                                            class="rounded-md border border-green-100 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:border-green-500 dark:bg-gray-700 dark:text-green-400"
                                                            >Active</span
                                                        >
                                                    {/if}
                                                {:else}
                                                    <span
                                                        class="rounded-md border border-red-100 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:border-red-400 dark:bg-gray-700 dark:text-red-400"
                                                        >Decline</span
                                                    >
                                                {/if}
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{new Date(
                                                            row.createdAt,
                                                        ).toLocaleString()}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center"
                                            >
                                                {#if row.isVerified}
                                                    <div
                                                        class="flex items-center justify-center space-x-2"
                                                    >
                                                        <button
                                                            type="button"
                                                            on:click={() =>
                                                                getMemberProfile(
                                                                    true,
                                                                    row.userId,
                                                                    row.introducerName,
                                                                    row.placerName,
                                                                )}
                                                            class="inline-flex items-center rounded-lg bg-orange-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                                                        >
                                                            Edit Details
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

                                                        <button
                                                            type="button"
                                                            on:click={() =>
                                                                changePassword(
                                                                    row.userId,
                                                                )}
                                                            class="inline-flex items-center rounded-lg bg-orange-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                                                        >
                                                            Change Password
                                                        </button>
                                                    </div>
                                                {:else}
                                                    <div
                                                        class="flex items-center justify-center space-x-2"
                                                    >
                                                        <button
                                                            type="button"
                                                            on:click={() =>
                                                                getMemberProfile(
                                                                    false,
                                                                    row.userId,
                                                                    row.introducerName,
                                                                    row.placerName,
                                                                )}
                                                            class="inline-flex items-center rounded-lg bg-orange-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
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
                                                        </button>
                                                    </div>
                                                {/if}
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
                                            getMemberListTableData(
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
                                        on:change={() => {
                                            getMemberListTableData(
                                                pageNumber - 1,
                                                rowsPerPage,
                                                searchFilter,
                                                fromDate,
                                                toDate,
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
                                            getMemberListTableData(
                                                pageNumber + 1,
                                                rowsPerPage,
                                                searchFilter,
                                                fromDate,
                                                toDate,
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
    <PageNavbar titleHeader={'All Members'} />
    <!-- <div class="p-4">
        <div class="rounded-lg bg-white dark:bg-gray-800 mt-24">
            <div class="flex items-center justify-between mb-1">
                <h3
                    class="text-base font-semibold text-gray-900 dark:text-white"
                ></h3>
            </div>

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
                tabindex="-1"
            >
                <div
                    class="grid grid-cols-1 mb-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2"
                >

                <path
                d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
            >
            </path>
            </svg>
        <span class="sr-only">Comment settings</span>
    </button>
    <div
        id="dropdownComment1"
        class="z-10 hidden bg-white divide-y divide-gray-100 rounded shadow w-36 dark:bg-gray-700 dark:divide-gray-600"
    >
        <ul
            class="py-1 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownMenuIconHorizontalButton"
        >
            <li>
                <a
                    href="#"
                    class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >All</a
                >
            </li>
            <li>
                <a
                    href="#"
                    class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >Active</a
                >
            </li>
            <li>
                <a
                    href="#"
                    class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >Inactive</a
                >
            </li>
        </ul>
    </div>
</div>
<div
    class="py-3 border-b border-gray-600"
    role="button"
    on:click={showMemberProfile}
    tabindex="-1"
>
    <div class="grid grid-cols-1 mb-1">
        <div class="grid grid-cols-10">
            <div
                class="items-center text-gray-500 dark:text-white col-span-7"
            >
                <div
                    class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                >
                    <span>Member ID: 1</span>
                </div>
                <div
                    class="w-full text-xs font-bold text-gray-500 dark:text-white"
                >
                    <p class="truncate mb-1">
                        Lindjunne Gerard Montenegro
                    </p>
                    <span
                        class="text-green-800 text-xs font-medium rounded dark:text-green-400"
                        >Active</span
                    >
                </div>
            </div>
            <div class="flex items-center justify-end col-span-3">
                <div
                    class="text-end col-span-3 w-full items-center text-gray-500 dark:text-white"
                >
                    <div
                        class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                    >
                        <span>Registered at</span>
                    </div>

                                <div
                                    class="w-full text-xs font-bold items-center text-gray-500 dark:text-white"
                                >
                                    <p class="truncate">31 Sep 2024</p>
                                    <span class="invisible">invi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
            class="py-3 border-b border-gray-600"
            role="button"
            on:click={showMemberProfile}
            tabindex="-1"
        >
            <div class="grid grid-cols-1 mb-1">
                <div class="grid grid-cols-10">
                    <div
                        class="items-center text-gray-500 dark:text-white col-span-7"
                    >
                        <div
                            class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                        >
                            <span>Member ID: 1</span>
                        </div>
                        <div
                            class="w-full text-xs font-bold text-gray-500 dark:text-white"
                        >
                            <p class="truncate mb-1">
                                Lindjunne Gerard Montenegro
                            </p>
                            <span
                                class="text-[#fbbf24] text-xs font-medium rounded dark:text-[#fbbf24]"
                                >Pending</span
                            >
                        </div>
                    </div>
                    <div class="flex items-center justify-end col-span-3">
                        <div
                            class="text-end col-span-3 w-full items-center text-gray-500 dark:text-white"
                        >
                            <div
                                class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                            >
                                <span>Registered at</span>
                            </div>

                            <div
                                class="w-full text-xs font-bold items-center text-gray-500 dark:text-white"
                            >
                                <p class="truncate">31 Sep 2024</p>
                                <span class="invisible">invi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="py-3 border-b border-gray-600"
            role="button"
            on:click={showMemberProfile}
            tabindex="-1"
        >
            <div class="grid grid-cols-1 mb-1">
                <div class="grid grid-cols-10">
                    <div
                        class="items-center text-gray-500 dark:text-white col-span-7"
                    >
                        <div
                            class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                        >
                            <span>Member ID: 1</span>
                        </div>
                        <div
                            class="w-full text-xs font-bold text-gray-500 dark:text-white"
                        >
                            <p class="truncate mb-1">
                                Lindjunne Gerard Montenegro
                            </p>
                            <span
                                class="text-red-800 text-xs font-medium rounded dark:text-red-400"
                                >Inactive</span
                            >
                        </div>
                    </div>
                    <div class="flex items-center justify-end col-span-3">
                        <div
                            class="text-end col-span-3 w-full items-center text-gray-500 dark:text-white"
                        >
                            <div
                                class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                            >
                                <span>Registered at</span>
                            </div>

                            <div
                                class="w-full text-xs font-bold items-center text-gray-500 dark:text-white"
                            >
                                <p class="truncate">31 Sep 2024</p>
                                <span class="invisible">invi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="py-3 border-b border-gray-600"
            role="button"
            on:click={showMemberProfile}
            tabindex="-1"
        >
            <div class="grid grid-cols-1 mb-1">
                <div class="grid grid-cols-10">
                    <div
                        class="items-center text-gray-500 dark:text-white col-span-7"
                    >
                        <div
                            class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                        >
                            <span>Member ID: 1</span>
                        </div>
                        <div
                            class="w-full text-xs font-bold text-gray-500 dark:text-white"
                        >
                            <p class="truncate">Lindjunne Gerard Montenegro</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-end col-span-3">
                        <div
                            class="text-end col-span-3 w-full items-center text-gray-500 dark:text-white"
                        >
                            <div
                                class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                            >
                                <span>Registered at</span>
                            </div>

                            <div
                                class="w-full text-xs font-bold items-center text-gray-500 dark:text-white"
                            >
                                <p class="truncate">31 Sep 2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="py-3 border-b border-gray-600"
            role="button"
            on:click={showMemberProfile}
            tabindex="-1"
        >
            <div class="grid grid-cols-1 mb-1">
                <div class="grid grid-cols-10">
                    <div
                        class="items-center text-gray-500 dark:text-white col-span-7"
                    >
                        <div
                            class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                        >
                            <span>Member ID: 1</span>
                        </div>
                        <div
                            class="w-full text-xs font-bold text-gray-500 dark:text-white"
                        >
                            <p class="truncate">Lindjunne Gerard Montenegro</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-end col-span-3">
                        <div
                            class="text-end col-span-3 w-full items-center text-gray-500 dark:text-white"
                        >
                            <div
                                class="w-full text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400"
                            >
                                <span>Registered at</span>
                            </div>

                            <div
                                class="w-full text-xs font-bold items-center text-gray-500 dark:text-white"
                            >
                                <p class="truncate">31 Sep 2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="flex items-center mt-4">
        <div class="w-full flex items-center pr-1">
            <label
                class="dark:text-white font-normal text-xs w-full"
                for="rows">Show Record</label
            >
            <select
                id="rows"
                class="border-1 text-xs font-semibold rounded-lg block py-1.5 pl-3.5 pr-6 dark:border-gray-500 dark:text-gray-800 dark:focus:ring-primary-500 dark:focus:border-primary-500"
            >
                <option
                    selected
                    value="5">5</option
                >
                <option value="10">10</option>
                <option value="20">20</option>
            </select>
        </div>

        <div class="w-full flex justify-end">
            <button
                class="flex items-center justify-center px-3 h-8 me-1 w-16 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
                <svg
                    class="w-3.5 h-3.5 rtl:rotate-180"
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
            <button
                class="flex items-center justify-center px-3 h-8 w-16 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
                <svg
                    class="w-3.5 h-3.5 rtl:rotate-180"
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
    </div>

    <div class="mt-2 text-center w-full items-center pr-1">
        <label
            class="dark:text-white font-semibold text-xs w-full"
            for="rows">Showing 1-10 of 1000</label
        >
    </div> -->
{/if}

<div
    id="memberProfileModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-4xl p-4 sm:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 shadow sm:p-5 dark:bg-[#a6a6a6]"
        >
            <div
                class="mb-2 flex items-center justify-between rounded-t border-b pb-2 dark:border-gray-600"
            >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Member Profile
                </h3>
                <button
                    type="button"
                    on:click={() => memberProfileModal.hide()}
                    class="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
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

            <Profile
                bind:this={profile}
                {isVerified}
                on:close={() => memberProfileModal.hide()}
            />
        </div>
    </div>
</div>

<div
    id="changePasswordModalMemberListElem"
    tabindex="-2"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-md p-4 sm:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 shadow sm:p-5 dark:bg-[#a6a6a6]"
        >
            <div
                class="mb-2 flex items-center justify-between rounded-t border-b pb-2 dark:border-gray-600"
            >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Change Password
                </h3>
                <button
                    type="button"
                    on:click={() => changePasswordModalMemberList.hide()}
                    class="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
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

            <ChangePassword
                bind:this={changePass}
                on:close={() => changePasswordModalMemberList.hide()}
            />
        </div>
    </div>
</div>
