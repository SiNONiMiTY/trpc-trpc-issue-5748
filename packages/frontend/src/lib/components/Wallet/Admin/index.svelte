<script lang="ts">
    import { Modal } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { Readable } from 'svelte/store'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'
    import {
        getPublicImageDataURL,
        nanoidCustom,
        postPublicImageDataURL,
    } from '$lib/utilities'
    import type { TRPCError } from '@trpc/server'
    import type { FormEventHandler } from 'svelte/elements'
    import type { ZodIssue } from 'zod'

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
    let memberTreeModal: Modal
    let badgeModal: Modal
    let confirmModalBadge: Modal
    let successModalBadge: Modal

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

    let memberList: TRouterOutput['wallet']['getMemberList'] = {
        paginatedMembers: [],
        totalNumberOfMembers: 0,
    }

    let paginatedMembers = memberList.paginatedMembers

    let treeLine: TRouterOutput['user']['getTreeLine'] = {
        sortedUpline: [],
        sortedDownline: [],
    }

    let sortedUpline = treeLine.sortedUpline

    let sortedDownline = treeLine.sortedDownline

    // Form Data
    const formData = {
        userId: '',
    }

    let imageData: Record<
        string,
        { data: string | null; type: string; name: string }
    > = {}

    let validatedImageData: Record<string, { uploadId: string | null }> = {
        img: {
            uploadId: null,
        },
    }

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    let showValidateMessage: Record<string, string> = {}
    const isWeb = true
    let validateIdPictureType = ''
    let alertMessage = ''
    let imageName: string[] = []

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(() => {
        memberTreeModal = new Modal(
            document.getElementById('memberTreeModalElem'),
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

        badgeModal = new Modal(document.getElementById('badgeModalElem'), {
            placement: 'bottom-right',
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

        confirmModalBadge = new Modal(
            document.getElementById('confirmModalBadgeElem'),
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

        successModalBadge = new Modal(
            document.getElementById('successModalBadgeElem'),
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

        getMemberListTableData(pageNumber, rowsPerPage, searchFilter)
    })

    //////////////
    // Handlers //
    //////////////

    const getMemberListTableData = async (
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

        await getMemberList()
    }

    const getMemberList = async () => {
        memberList = await $trpcClient.wallet.getMemberList.query({
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
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

    const getTreeLine = async (userId: string, memberId: number) => {
        treeLine = await $trpcClient.user.getTreeLine.query({
            userId,
            memberId,
        })

        sortedUpline = treeLine.sortedUpline
        sortedDownline = treeLine.sortedDownline
    }

    const viewTreeLine = (userId: string, memberId: number) => {
        getTreeLine(userId, memberId)
        memberTreeModal.show()
    }

    const handleCheckBadge = async (userId: string, badgeId: string | null) => {
        formData.userId = userId

        const uploaded = await $trpcClient.utility.getUploadedImages.query({
            sessionId: $sessionData?.sessionId || '',
            userId,
            uploadId: badgeId,
            uploadType: 'badge',
        })

        if (uploaded.length > 0) {
            uploaded.forEach((val) => {
                imageData[val.uploadedItemId] = {
                    data: null,
                    type: 'extension',
                    name: val.uploadedItemId,
                }
            })
            imageData = await getPublicImageDataURL(imageData)

            validatedImageData.img.uploadId = uploaded[0].badgeId
        }
    }

    const handleUploadBadgeBtn = (userId: string, badgeId: string | null) => {
        clearInput()
        handleCheckBadge(userId, badgeId)
        badgeModal.show()
    }

    const handleImgFile: FormEventHandler<HTMLInputElement> = (event) => {
        const files = event.currentTarget.files

        validateIdPictureType = ''

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files.item(i)!
                const name = file.name
                const extension = name.substring(name.lastIndexOf('.') + 1)
                const size = Math.round(file.size / 1024)

                if (!/^jpe?g|png$/.test(extension) || size > 2048) {
                    validateIdPictureType =
                        'Supported formats are JPG, PNG & size must be 2MB or less.'
                    return
                }

                const fileReader = new FileReader()
                const fileName = nanoidCustom()
                fileReader.addEventListener('load', async () => {
                    imageData[fileName] = {
                        data: fileReader.result as string,
                        type: extension,
                        name: fileName,
                    }

                    await postPublicImageDataURL(
                        imageData,
                        `${$sessionData?.sharedAccessSignature}`,
                    )
                })
                fileReader.readAsDataURL(files.item(i)!)
                imageName.push(fileName)
            }
        }
    }

    const handleSaveBtn = async () => {
        const result = await $trpcClient.utility.saveUploadedFileId.mutate({
            uploadId: nanoidCustom(),
            fileName: imageName,
        })
        validatedImageData.img.uploadId = result
        confirmModalBadge.show()
    }

    const handleConfirmYesBtn = async () => {
        try {
            if (Object.entries(imageData).length <= 0) {
                validatedImageData.img.uploadId = null
            }

            const response = await $trpcClient.user.saveBadge.mutate({
                sessionId: $sessionData?.sessionId || '',
                userId: formData.userId,
                badgeImageId: validatedImageData.img.uploadId,
            })

            if (response !== '' || response === null) {
                alertMessage = 'Badge saved successful.'
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            successModalBadge.show()
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

    const clearInput = () => {
        formData.userId = ''
        imageData = {}
        validatedImageData.img.uploadId = null
    }

    const handleDeleteImg = (index: string) => {
        delete imageData[index]
        const newList = imageData
        imageData = newList
    }

    const handleSuccessContinueBtn = () => {
        badgeModal.hide()
        confirmModalBadge.hide()
        successModalBadge.hide()
        clearInput()
        getMemberListTableData(pageNumber, rowsPerPage, searchFilter)
    }
</script>

{#if isWeb}
    <div class="p-4">
        <div class="mx-auto mb-4 max-w-screen-md text-center">
            <h2
                class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
            >
                Wallet
            </h2>
            <!-- <p
                class="mb-5 font-light text-gray-500 sm:text-sm dark:text-gray-400"
            >
                Wallet and commission of registered members.
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
                                    getMemberListTableData(
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
                <div class="">
                    <div class="inline-block w-full align-middle">
                        <div class="overflow-x-auto">
                            <table
                                class="w-full text-left text-sm text-neutral-500 dark:text-neutral-600"
                            >
                                <thead
                                    class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200
                                    "
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
                                            >Rank</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >One Marketing Points</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Commission Points</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Member Tree</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Action</th
                                        >
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
                                                    >
                                                        {row.memberId}</span
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
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.rankName}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                    >
                                                        {numberFormatter.format(
                                                            Number(
                                                                row.oneMarketingBalance,
                                                            ),
                                                        )}</span
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
                                                            Number(
                                                                row.salesCommBalance,
                                                            ),
                                                        )}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <button
                                                    on:click={() =>
                                                        viewTreeLine(
                                                            row.userId,
                                                            row.memberId,
                                                        )}
                                                    class="font-medium text-orange-400 hover:underline dark:text-orange-400"
                                                    >View</button
                                                >
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div
                                                    class="flex items-center justify-center space-x-2"
                                                >
                                                    <button
                                                        on:click={() =>
                                                            handleUploadBadgeBtn(
                                                                row.userId,
                                                                row.badgeId,
                                                            )}
                                                        type="button"
                                                        class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                                                    >
                                                        Upload Badge
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
                                            getMemberListTableData(
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
                                            getMemberListTableData(
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
                                            getMemberListTableData(
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
    <PageNavbar titleHeader={'All Members'} />
    <!-- <div class="p-4">
        <div class="mt-24 rounded-lg bg-white dark:bg-gray-800">
            <div class="mb-1 flex items-center justify-between">
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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
                                    class="rounded text-xs font-medium uppercase text-[#fbbf24] dark:text-[#fbbf24]"
                                    >Pending</span
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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
                                    class="rounded text-xs font-medium uppercase text-red-600 dark:text-green-400 dark:text-red-500"
                                    >Inactive</span
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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
                                    class="rounded text-xs font-medium uppercase text-[#fbbf24] dark:text-[#fbbf24]"
                                    >Pending</span
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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
                                    class="rounded text-xs font-medium uppercase text-red-600 dark:text-green-400 dark:text-red-500"
                                    >Inactive</span
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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
                                    class="rounded text-xs font-medium uppercase text-[#fbbf24] dark:text-[#fbbf24]"
                                    >Pending</span
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

            <div
                class="py-1"
                role="button"
                on:click={showMemberProfile}
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
                                    class="rounded text-xs font-medium uppercase text-red-600 dark:text-green-400 dark:text-red-500"
                                    >Inactive</span
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
    </div> -->
{/if}

<div
    id="memberTreeModalElem"
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
                    Member Tree
                </h3>
                <button
                    type="button"
                    on:click={() => memberTreeModal.hide()}
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

            <div class="container mx-auto text-center">
                <div class="flex items-center justify-center">
                    <div class="text-center">
                        {#each sortedUpline as row, i}
                            <ul class="mt-10 flex flex-row justify-center">
                                {#if i !== 0}
                                    <div
                                        class="absolute -mt-10 h-10 border-l-2 border-neutral-400"
                                    ></div>
                                {/if}
                                <li class="relative">
                                    <div class="relative flex justify-center">
                                        {#if i !== 0}
                                            <div
                                                class="absolute top-0 -mt-6 h-6 border-l-2 border-neutral-400"
                                            ></div>
                                        {/if}
                                        <div
                                            class="border border-gray-400 p-2 text-center"
                                        >
                                            <div
                                                class="flex flex-col items-center justify-center"
                                            >
                                                <div class="w-24">
                                                    <img
                                                        class="m-auto block rounded-lg"
                                                        alt=""
                                                        src="/defaultprofilepic.png"
                                                    />
                                                </div>
                                                <div
                                                    class="text-neutral-900 dark:text-neutral-300"
                                                >
                                                    <p>{row.fullName}</p>
                                                    <p>{row.position}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        {/each}
                        {#if sortedDownline.length > 0}
                            <ul class="mt-10 flex flex-row justify-center">
                                <div
                                    class="absolute -mt-10 h-10 border-l-2 border-neutral-400"
                                ></div>
                                {#each sortedDownline as row, i}
                                    {#if i < 5}
                                        <li class="relative p-6">
                                            <div
                                                class="absolute top-0 h-8 border-t-2 border-neutral-400"
                                                style="{i === 0
                                                    ? 'left:50%;'
                                                    : 'left:0px;'}{i === 4
                                                    ? 'right:50%;'
                                                    : 'right: 0px;'}"
                                            ></div>
                                            <div
                                                class="relative flex justify-center"
                                            >
                                                <div
                                                    class="absolute top-0 -mt-6 h-6 border-l-2 border-neutral-400"
                                                ></div>
                                                <div
                                                    class="border border-gray-400 p-2 text-center"
                                                >
                                                    <div
                                                        class="flex flex-col items-center justify-center"
                                                    >
                                                        <div class="w-24">
                                                            <img
                                                                class="m-auto block rounded-lg"
                                                                alt=""
                                                                src="/defaultprofilepic.png"
                                                            />
                                                        </div>
                                                        <div
                                                            class="text-neutral-900 dark:text-neutral-300"
                                                        >
                                                            <p>
                                                                {row.fullName}
                                                            </p>
                                                            <p>
                                                                {row.position}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    {/if}
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div
    id="badgeModalElem"
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
                    Badge
                </h3>
                <button
                    type="button"
                    on:click={() => {
                        badgeModal.hide()
                        clearInput()
                    }}
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
            <form
                class="space-y-2 md:space-y-3"
                method="post"
                enctype="multipart/form-data"
                on:submit|preventDefault={handleSaveBtn}
            >
                <div
                    class={Object.entries(imageData).length > 0
                        ? 'mb-2'
                        : 'mb-4'}
                >
                    <label
                        for="newsPromotionImgs"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Upload Image
                    </label>
                    <div class="flex w-full items-center justify-center">
                        <label
                            class="dark:hover:bg-bray-800 flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-100 dark:bg-gray-700"
                            for="badgeImage"
                        >
                            <div
                                class="flex w-full flex-col items-center justify-center py-5"
                            >
                                <svg
                                    class="mb-2 h-10 w-10 text-[#9CA3AF] dark:text-gray-400"
                                    aria-hidden="true"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    ></path>
                                </svg>
                                <p
                                    class="mb-1 text-sm text-[#6B7280] dark:text-white"
                                >
                                    <span class="font-semibold"
                                        >Click to upload</span
                                    >
                                    or drag and drop
                                </p>
                                <p
                                    class="text-xs text-[#6B7280] dark:text-white"
                                >
                                    PNG, JPG, JPEG (MAX. 800x400px)
                                </p>

                                <input
                                    id="badgeImage"
                                    name="badgeImage"
                                    class="hidden"
                                    type="file"
                                    accept="image/jpeg, image/jpg, image/png"
                                    multiple
                                    on:change={handleImgFile}
                                />
                            </div>
                        </label>
                    </div>
                    {#if validateIdPictureType}
                        <div class="mt-1 flex items-center justify-start">
                            <span class="text-sm font-bold text-red-500"
                                >{validateIdPictureType}</span
                            >
                        </div>
                    {:else if Object.entries(imageData).length > 0}
                        <div class="mt-1 flex items-center justify-start">
                            <span
                                class="text-sm font-bold text-green-500 dark:text-green-700"
                                >Image is valid.</span
                            >
                        </div>
                    {:else}
                        <p
                            class="mt-1 text-sm text-gray-500 dark:text-gray-600"
                            id="file_input_help"
                        >
                            JPG or PNG (MAX 2MB).
                        </p>
                    {/if}
                </div>

                {#if Object.entries(imageData).length > 0}
                    <div class="mb-4">
                        <div
                            class="rounded-lg border border-gray-200 p-2 pt-2 shadow"
                        >
                            <div class="flex flex-row gap-2 overflow-x-auto">
                                {#each Object.entries(imageData) as [key, val]}
                                    <div
                                        class="border-0.5 relative h-20 w-20 rounded-lg bg-neutral-100"
                                    >
                                        <img
                                            src={val.data}
                                            class="h-full w-full rounded-lg"
                                        />
                                        <button
                                            class="absolute right-0.5 top-0.5 rounded-full bg-white p-1"
                                            type="button"
                                            on:click={() =>
                                                handleDeleteImg(val.name)}
                                        >
                                            <svg
                                                class="h-5 w-5 text-red-600 hover:text-red-500"
                                                aria-hidden="true"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="currentColor"
                                                viewBox="0 0 18 20"
                                            >
                                                <path
                                                    d="M17 4h-4V2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2H1a1 1 0 0 0 0 2h1v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1a1 1 0 1 0 0-2ZM7 2h4v2H7V2Zm1 14a1 1 0 1 1-2 0V8a1 1 0 0 1 2 0v8Zm4 0a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0v8Z"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                {/if}
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <button
                            type="submit"
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                        >
                            Save badge
                        </button>
                    </div>
                    <div>
                        <button
                            on:click={() => badgeModal.hide()}
                            type="button"
                            class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                            >Cancel</button
                        >
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<div
    id="confirmModalBadgeElem"
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
                    Are you sure you want to save this badge?
                </h3>
                <button
                    on:click={handleConfirmYesBtn}
                    type="button"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmModalBadge.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="successModalBadgeElem"
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
