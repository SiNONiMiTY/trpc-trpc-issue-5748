<script lang="ts">
    import {
        cashOutInputSchema,
        processCashOutInputSchema,
    } from '@trpc-subscription/validator/trpc/v1/user'
    import { saveUploadIdInputSchema } from '@trpc-subscription/validator/trpc/v1/utility'
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { Modal } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { Readable } from 'svelte/store'
    import type { ZodIssue } from 'zod'

    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import {
        myPts,
        sessionDataStore,
        trpcClientStoreLegacy,
        trpcClientStore,
    } from '$lib/stores.js'
    import { nanoidCustom, postImageDataURL } from '$lib/utilities.js'

    /* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

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
    let confirmModalCashOut: Modal
    let processModalCashOut: Modal
    let successModalCashOut: Modal

    // Form Data
    const formData = {
        userId: '',
        memberId: '',
        usePts: '',
        amount: '',
        modeOfPayment: '',
        bank: '',
        accountNumber: '',
        accountName: '',
        status: '',
        txnId: '',
        notes: '',
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

    let userCashOutTxn: TRouterOutput['wallet']['getUserCashOut'] = {
        paginatedUserCashOutTxn: [],
        totalNumberOfUserCashOutTxn: 0,
    }

    let pendingCashOutTxn: TRouterOutput['wallet']['getPendingApprovedCashOut'] =
        {
            paginatedPendingCashOutTxn: [],
            totalNumberOfPendingCashOutTxn: 0,
        }

    let paginatedUserCashOutTxn = userCashOutTxn.paginatedUserCashOutTxn
    let paginatedPendingCashOutTxn =
        pendingCashOutTxn.paginatedPendingCashOutTxn

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
    let validImageData: Record<string, { uploadId: string }> = {
        proofOfPayment: {
            uploadId: '',
        },
    }

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    let validatedFormData: TRouterInput['wallet']['insertCashOut']
    let cashOutType = $page.url.searchParams.get('myPts') || ''
    let showValidateMessage: Record<string, string> = {}
    let alertMessage = ''
    let disableSubmitBtn = true
    let disabledConfirmBtn = Number($sessionData?.rbacFlag) & 3 ? true : false
    const isWeb = true
    const isAdmin = true
    myPts.update((value) => (value = cashOutType))

    ///////////////
    // Lifecycle //
    ///////////////

    onMount(() => {
        confirmModalCashOut = new Modal(
            document.getElementById('confirmModalCashOutElem'),
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

        successModalCashOut = new Modal(
            document.getElementById('successModalCashOutElem'),
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

        processModalCashOut = new Modal(
            document.getElementById('processModalCashOutElem'),
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

        $trpcClientStore.ws.cashOutApproval.subscribe(
            { sessionId: $sessionData?.sessionId || '' },
            {
                onData: (value) => {
                    getCashOutListTableData(
                        pageNumber,
                        rowsPerPage,
                        searchFilter,
                        fromDate,
                        toDate,
                    )
                },
            },
        )
    })

    //////////////
    // Handlers //
    //////////////

    const getMemberProfile = async () => {
        const memberProfile = await $trpcClient.user.getProfile.query({
            userId: $sessionData?.userId!,
        })

        formData.usePts = numberFormatter.format(
            Number(
                cashOutType
                    ? cashOutType === 'salesComm'
                        ? memberProfile.wallet.salesCommBalance
                        : memberProfile.wallet.oneMarketingBalance
                    : '0.00',
            ),
        )

        disableSubmitBtn = Number(formData.usePts) <= 0
    }

    const getCashOutListTableData = (
        pn = pageNumber,
        rpp = rowsPerPage,
        sf = searchFilter,
        fd = fromDate,
        td = toDate,
    ) => {
        getMemberProfile()

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

        if (Number($sessionData?.rbacFlag) & 3) {
            getPendingApprovedCashOutList()
        } else if ($sessionData?.rbacFlag === 8) {
            getUserCashOutList()
        }
    }

    const getUserCashOutList = async () => {
        userCashOutTxn = await $trpcClient.wallet.getUserCashOut.query({
            userId: $sessionData?.userId!,
            fromDate,
            toDate,
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
        })

        if (userCashOutTxn) {
            paginatedUserCashOutTxn = userCashOutTxn.paginatedUserCashOutTxn
            totalItems = userCashOutTxn.totalNumberOfUserCashOutTxn
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const getPendingApprovedCashOutList = async () => {
        pendingCashOutTxn =
            await $trpcClient.wallet.getPendingApprovedCashOut.query({
                fromDate,
                toDate,
                limit: rowsPerPage,
                offset: rowsPerPage * (pageNumber - 1),
                searchFilter,
            })

        if (pendingCashOutTxn) {
            paginatedPendingCashOutTxn =
                pendingCashOutTxn.paginatedPendingCashOutTxn
            totalItems = pendingCashOutTxn.totalNumberOfPendingCashOutTxn
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const handleCashOutType: FormEventHandler<HTMLInputElement> = (event) => {
        cashOutType = event.currentTarget.value
        getMemberProfile()

        if (cashOutType) {
            const elemId = document.getElementById(
                'salesComm',
            ) as HTMLInputElement
            const elemId2 = document.getElementById(
                'oneMarketing',
            ) as HTMLInputElement

            if (elemId && elemId2) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )

                elemId2.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.cashOutType = ''
        }
    }

    const handleAmountChange: FormEventHandler<HTMLInputElement> = (event) => {
        formData.amount = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        disableSubmitBtn = Number(formData.amount) > Number(formData.usePts)

        if (formData.amount) {
            const elemId = document.getElementById('amount') as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.amount = ''
        }
    }

    const handleModeofPayment: FormEventHandler<HTMLInputElement> = (event) => {
        formData.modeOfPayment = event.currentTarget
            .value as TRouterInput['user']['signUp']['modeOfPayment']

        if (formData.modeOfPayment) {
            const elemId = document.getElementById(
                'modeOfPayment',
            ) as HTMLInputElement
            const elemId2 = document.getElementById(
                'modeOfPayment2',
            ) as HTMLInputElement

            const elemId3 = document.getElementById(
                'modeOfPayment3',
            ) as HTMLInputElement

            if (elemId && elemId2 && elemId3) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )

                elemId2.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
                elemId3.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.modeOfPayment = ''
        }
    }

    const handleBankChange = () => {
        if (formData.bank) {
            const elemId = document.getElementById('bank') as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.bank = ''
        }
    }

    const handleAccountNumberChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.accountNumber = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.accountNumber) {
            const elemId = document.getElementById(
                'accountNumber',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.accountNumber = ''
        }
    }

    const handleAccountNameChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.accountName = event.currentTarget.value

        if (formData.accountName) {
            const elemId = document.getElementById(
                'accountName',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.accountName = ''
        }
    }

    const handleSubmitBtn = async () => {
        const validator = await cashOutInputSchema
            .superRefine((schema, ctx) => {
                const fields = [
                    { name: 'Bank/E-Wallet', path: 'bank' },
                    { name: 'Account number', path: 'accountNumber' },
                    { name: 'Account name', path: 'accountName' },
                ]

                if (schema.modeOfPayment !== 'CASH') {
                    if (!schema.bank) {
                        ctx.addIssue({
                            code: 'custom',
                            message: `${fields[0].name} is required.`,
                            path: [fields[0].path],
                        })
                    }

                    if (!schema.accountNumber) {
                        ctx.addIssue({
                            code: 'custom',
                            message: `${fields[1].name} is required.`,
                            path: [fields[1].path],
                        })
                    } else {
                        if (schema.accountNumber?.length > 17) {
                            ctx.addIssue({
                                code: 'custom',
                                message: `${fields[1].name} must be 17 characters or less..`,
                                path: [fields[1].path],
                            })
                        }
                    }

                    if (!schema.accountName) {
                        ctx.addIssue({
                            code: 'custom',
                            message: `${fields[2].name} is required.`,
                            path: [fields[2].path],
                        })
                    } else {
                        if (schema.accountName?.length > 100) {
                            ctx.addIssue({
                                code: 'custom',
                                message: `${fields[2].name} must be 100 characters or less..`,
                                path: [fields[2].path],
                            })
                        }
                    }
                }
            })
            .safeParseAsync({
                ...formData,
                amount: Number(formData.amount),
                cashOutType,
            })

        if (validator.success) {
            validatedFormData = validator.data
            confirmModalCashOut.show()
        } else {
            showValidateMessage = {}
            validator.error.issues.forEach((key, index) => {
                key.path.forEach((elem) => {
                    const elemId = document.getElementById(
                        `${String(elem)}`,
                    ) as HTMLInputElement

                    if (elem === 'cashOutType') {
                        const elemId = document.getElementById(
                            'salesComm',
                        ) as HTMLInputElement
                        const elemId2 = document.getElementById(
                            'oneMarketing',
                        ) as HTMLInputElement

                        if (elemId && elemId2) {
                            elemId.classList.add(
                                'border-red-700',
                                'dark:border-red-700',
                                'border-2',
                            )
                            elemId2.classList.add(
                                'border-red-700',
                                'dark:border-red-700',
                                'border-2',
                            )
                        }
                    }

                    if (elem === 'modeOfPayment') {
                        const elemId2 = document.getElementById(
                            `${String(elem)}2`,
                        ) as HTMLInputElement

                        const elemId3 = document.getElementById(
                            `${String(elem)}3`,
                        ) as HTMLInputElement

                        if (elemId2 && elemId3) {
                            elemId2.classList.add(
                                'border-red-700',
                                'dark:border-red-700',
                                'border-2',
                            )
                            elemId3.classList.add(
                                'border-red-700',
                                'dark:border-red-700',
                                'border-2',
                            )
                        }
                    }

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
                await $trpcClient.wallet.insertCashOut.mutate(validatedFormData)

            if (response) {
                alertMessage = `Thank you for cashing out. Please wait a moment to complete your request`
                clearInput()
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            successModalCashOut.show()
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
        formData.amount = ''
        formData.modeOfPayment = ''
        formData.bank = ''
        formData.accountNumber = ''
        formData.accountName = ''
    }

    const handleApproveCompleteBtn = (
        txnId: string,
        userId: string,
        status: string,
    ) => {
        formData.txnId = txnId
        formData.userId = userId
        formData.status =
            status === '02_APPROVED' ? '03_COMPLETED' : '02_APPROVED'
        processModalCashOut.show()
    }

    const handleCancelBtn = (txnId: string, userId: string) => {
        formData.txnId = txnId
        formData.userId = userId
        formData.status = '00_VOID'
        processModalCashOut.show()
    }

    const onChangeCancelNotes: FormEventHandler<HTMLTextAreaElement> = (
        event,
    ) => {
        if (event.currentTarget.value) {
            disabledConfirmBtn = false
        } else {
            disabledConfirmBtn = true
        }

        formData.notes = event.currentTarget.value
    }

    const handleProofOfPaymentChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        imageValidationFn(event, 'proofOfPayment')
    }

    const imageValidationFn = async (
        event: Event & {
            currentTarget: EventTarget & HTMLInputElement
        },
        elementId: string,
    ) => {
        const files = event.currentTarget.files
        const imageName: string[] = []

        if (files && files.length === 1) {
            const file = files.item(0)!
            const name = file.name
            const extension = name.substring(name.lastIndexOf('.') + 1)
            const size = Math.round(file.size / 1024)

            if (!/^jpe?g|png$/.test(extension) || size > 2048) {
                imageData[elementId].data = ''
                event.currentTarget.value = ''
                return
            }

            const fileReader = new FileReader()
            const fileName = nanoidCustom()
            fileReader.addEventListener('load', async () => {
                imageData[elementId].data = fileReader.result as string
                imageData[elementId].type = extension
                imageData[elementId].name = fileName

                await postImageDataURL(
                    imageData,
                    formData.userId,
                    `${$sessionData?.sharedAccessSignature}`,
                )
            })
            fileReader.readAsDataURL(file)

            imageName.push(fileName)

            const validator = await saveUploadIdInputSchema.safeParseAsync({
                uploadId: nanoidCustom(),
                fileName: imageName,
            })

            if (validator.success) {
                const result =
                    await $trpcClient.utility.saveUploadedFileId.mutate(
                        validator.data,
                    )
                validImageData[elementId].uploadId = result
            }
        }
    }

    const handleProcessPendingConfirmYesBtn = async () => {
        try {
            const validator = await processCashOutInputSchema.safeParseAsync({
                ...formData,
                transactionStatus: formData.status,
                adminNote: formData.notes,
                proofOfPayment: imageData['proofOfPayment'].name,
            })

            if (validator.success) {
                const response =
                    await $trpcClient.wallet.processPendingCashOut.mutate(
                        validator.data,
                    )

                if (response) {
                    alertMessage = `Cash out
                    ${
                        response.status === '00_VOID'
                            ? 'cancelled successfully.'
                            : `${
                                  response.status === '02_APPROVED'
                                      ? 'approved successfully. Provide receipt to complete the cash out.'
                                      : 'completed successfully.'
                              }`
                    }`
                } else {
                    alertMessage = 'Something went wrong. Please try again.'
                }

                successModalCashOut.show()
            } else {
                showValidateMessage = {}
                validator.error.issues.forEach((key, index) => {
                    key.path.forEach((elem) => {
                        showValidateMessage[elem] = key.message
                    })
                })
            }
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
        confirmModalCashOut.hide()
        processModalCashOut.hide()
        successModalCashOut.hide()
        getCashOutListTableData(
            pageNumber,
            rowsPerPage,
            searchFilter,
            fromDate,
            toDate,
        )
    }
</script>

<div class="p-4">
    <div class="mx-auto mb-4 max-w-screen-md text-center">
        <h2
            class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
        >
            Cash Out
        </h2>
    </div>
    {#if $sessionData?.rbacFlag === 8}
        <div class="mb-4 flex items-center justify-center">
            <div class="max-w-screen w-full">
                <div
                    class="mb-4 rounded-lg border border-neutral-300 bg-white p-4 shadow xl:mb-0 dark:border-neutral-600 dark:bg-neutral-800"
                >
                    <div
                        class="grid place-content-center items-center md:grid-cols-1"
                    >
                        <div class="mb-4 flex justify-center">
                            <div>
                                <div class="text-center">
                                    <h1
                                        class="text-md mb-2 font-bold leading-tight tracking-tight text-neutral-900 md:text-xl dark:text-neutral-300"
                                    >
                                        Select Points to Use
                                    </h1>
                                </div>
                                <div class="">
                                    <div
                                        class="mt-2 grid w-full grid-cols-2 items-center"
                                    >
                                        <div>
                                            <input
                                                id="salesComm"
                                                name="cashOutType"
                                                type="radio"
                                                checked={cashOutType ===
                                                    'salesComm'}
                                                on:change={handleCashOutType}
                                                value="salesComm"
                                                disabled={$myPts !== ''}
                                                class="focus:ring-3 h-4 w-4 items-center border border-neutral-300 bg-neutral-50 focus:ring-orange-300 dark:border-neutral-600 dark:ring-offset-neutral-800 dark:focus:ring-orange-500"
                                            />
                                            <label
                                                for="salesComm"
                                                class="sm:ml:0 ml-1 text-neutral-700 dark:text-neutral-300"
                                                >Commission</label
                                            >
                                        </div>
                                        <div>
                                            <input
                                                id="oneMarketing"
                                                name="cashOutType"
                                                type="radio"
                                                checked={cashOutType ===
                                                    'oneMarketing'}
                                                on:change={handleCashOutType}
                                                value="oneMarketing"
                                                disabled={$myPts !== ''}
                                                class="focus:ring-3 h-4 w-4 items-center border border-neutral-300 bg-neutral-50 focus:ring-orange-300 dark:border-neutral-600 dark:ring-offset-neutral-800 dark:focus:ring-orange-500"
                                            />
                                            <label
                                                for="oneMarketing"
                                                class="sm:ml:0 ml-1 text-neutral-700 dark:text-neutral-300"
                                                >One Marketing</label
                                            >
                                        </div>
                                    </div>
                                    {#if showValidateMessage.cashOutType}
                                        <div
                                            class="mt-1 flex items-center justify-center"
                                        >
                                            <span
                                                class="text-sm font-bold text-red-500"
                                                >{showValidateMessage.cashOutType}</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                        <div class="mb-2 flex justify-center">
                            <div>
                                <div class="text-center">
                                    <h3
                                        class="text-lg font-semibold text-neutral-700 dark:text-neutral-300"
                                    >
                                        My Points: {formData.usePts}
                                    </h3>
                                </div>
                                <div class="rounded-lg p-2">
                                    <div class="flex justify-center">
                                        <input
                                            type="text"
                                            name="amount"
                                            id="amount"
                                            maxlength="10"
                                            bind:value={formData.amount}
                                            on:input={handleAmountChange}
                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-60 rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-50 dark:text-neutral-900 dark:placeholder-neutral-400"
                                            placeholder="Enter Points"
                                        />
                                    </div>
                                    {#if showValidateMessage.amount}
                                        <div
                                            class="mt-1 flex items-center justify-start"
                                        >
                                            <span
                                                class="text-sm font-bold text-red-500"
                                                >{showValidateMessage.amount}</span
                                            >
                                        </div>
                                    {:else}
                                        <div class="mt-2">
                                            <span
                                                class="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                                                >Amount must be minimum of 100
                                                and multiply of 100 ex. 100,
                                                200, 300 etc.</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                        <div class="mb-2 flex justify-center">
                            <div>
                                <div class="text-center">
                                    <h1
                                        class="text-md mb-2 font-bold leading-tight tracking-tight text-neutral-700 md:text-xl dark:text-neutral-200"
                                    >
                                        Mode of Payment
                                    </h1>
                                </div>
                                <div class="">
                                    <div
                                        class="mt-2 grid w-full grid-cols-3 items-center"
                                    >
                                        <div>
                                            <input
                                                id="modeOfPayment"
                                                name="modeOfPayment"
                                                type="radio"
                                                checked={formData.modeOfPayment ===
                                                    'CASH'}
                                                on:change={handleModeofPayment}
                                                value="CASH"
                                                class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 items-center border border-gray-300 bg-gray-50 dark:border-gray-600 dark:ring-offset-gray-800"
                                            />
                                            <label
                                                for="modeOfPayment"
                                                class="sm:ml:0 ml-1 mr-5 text-neutral-700 dark:text-neutral-300"
                                                >Cash</label
                                            >
                                        </div>
                                        <div>
                                            <input
                                                id="modeOfPayment2"
                                                name="modeOfPayment"
                                                type="radio"
                                                checked={formData.modeOfPayment ===
                                                    'BANK'}
                                                on:change={handleModeofPayment}
                                                value="BANK"
                                                class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:ring-offset-gray-800"
                                            />
                                            <label
                                                for="modeOfPayment2"
                                                class="sm:ml:0 ml-1 mr-5 text-neutral-700 dark:text-neutral-300"
                                                >Bank</label
                                            >
                                        </div>
                                        <div>
                                            <input
                                                id="modeOfPayment3"
                                                name="modeOfPayment"
                                                type="radio"
                                                checked={formData.modeOfPayment ===
                                                    'E-WALLET'}
                                                on:change={handleModeofPayment}
                                                value="E-WALLET"
                                                class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:ring-offset-gray-800"
                                            />
                                            <label
                                                for="modeOfPayment3"
                                                class="sm:ml:0 ml-1 text-neutral-700 dark:text-neutral-300"
                                                >E-Wallet</label
                                            >
                                        </div>
                                    </div>
                                    {#if showValidateMessage.modeOfPayment}
                                        <div
                                            class="mt-1 flex items-center justify-start"
                                        >
                                            <span
                                                class="text-sm font-bold text-red-500"
                                                >{showValidateMessage.modeOfPayment}</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <div
                            class="{['', 'CASH'].includes(
                                formData.modeOfPayment,
                            )
                                ? 'hidden'
                                : ''} my-2 flex justify-center"
                        >
                            <div
                                class="space-y-4 rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-600 dark:bg-[#ebebed]"
                            >
                                <div>
                                    <label
                                        for="bank"
                                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-900"
                                    >
                                        {formData.modeOfPayment === 'BANK'
                                            ? 'Bank'
                                            : 'E-Wallet'}
                                    </label>
                                    <select
                                        id="bank"
                                        name="bank"
                                        bind:value={formData.bank}
                                        on:change={handleBankChange}
                                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-96 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    >
                                        {#if formData.modeOfPayment === 'BANK'}
                                            <option value="010530667"
                                                >BDO UNIBANK, INC.</option
                                            >
                                            <option value="010620014"
                                                >EAST WEST BANK</option
                                            >
                                            <option value="010350025"
                                                >LAND BANK OF THE PHILIPPINES
                                                (LANDBANK)</option
                                            >
                                            <option value="010269996"
                                                >METROPOLITAN BANK & TRUST CO.
                                                (METROBANK)</option
                                            >
                                        {:else}
                                            <option value="GCASH">GCASH</option>
                                            <option value="MAYA">MAYA</option>
                                        {/if}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        for="accountNumber"
                                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-900"
                                    >
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        id="accountNumber"
                                        bind:value={formData.accountNumber}
                                        on:input={handleAccountNumberChange}
                                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                        placeholder=""
                                    />
                                    {#if showValidateMessage.accountNumber}
                                        <div
                                            class="mt-1 flex items-center justify-start"
                                        >
                                            <span
                                                class="text-sm font-bold text-red-500"
                                                >{showValidateMessage.accountNumber}</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                                <div>
                                    <label
                                        for="accountName"
                                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-900"
                                    >
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        name="accountName"
                                        id="accountName"
                                        bind:value={formData.accountName}
                                        on:input={handleAccountNameChange}
                                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                        placeholder=""
                                    />
                                    {#if showValidateMessage.accountName}
                                        <div
                                            class="mt-1 flex items-center justify-start"
                                        >
                                            <span
                                                class="text-sm font-bold text-red-500"
                                                >{showValidateMessage.accountName}</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center justify-center">
                        <button
                            type="button"
                            on:click={handleSubmitBtn}
                            disabled={disableSubmitBtn}
                            class="{disableSubmitBtn
                                ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                                : 'bg-[#FF9119] hover:bg-[#FF9119]/80 focus:outline-none focus:ring-4 focus:ring-[#FF9119]/50 dark:hover:bg-[#FF9119]/80 dark:focus:ring-[#FF9119]/40'} items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

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
                                getCashOutListTableData(
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
                class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-2 md:space-y-0"
            >
                <div class="items-center sm:mx-auto">
                    <input
                        name="start"
                        type="date"
                        bind:value={fromDate}
                        on:change={() => {
                            getCashOutListTableData(
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
                            getCashOutListTableData(
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

        {#if $sessionData?.rbacFlag === 8}
            <div class="flex flex-col">
                <div class="overflow-x-auto">
                    <div class="inline-block min-w-full align-middle">
                        <div class="overflow-hidden shadow">
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
                                            class="p-4 text-center"
                                            >Mode of Payment</th
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
                                            >Bank/E-Wallet</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Account Number</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center"
                                            >Account Name</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Status</th
                                        >
                                        <th
                                            scope="col"
                                            class="p-4 text-center">Date</th
                                        >
                                    </tr>
                                </thead>
                                <tbody
                                    class="divide-y divide-neutral-200 font-semibold dark:divide-neutral-600"
                                >
                                    {#each paginatedUserCashOutTxn as row}
                                        <tr
                                            class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                        >
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class=" text-xs text-neutral-800 dark:text-neutral-300"
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
                                                        >{row.modeOfPayment}</span
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
                                                        >{row.modeOfPaymentOther ??
                                                            '--'}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.accountNumber ??
                                                            '--'}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap p-4 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.accountName ??
                                                            '--'}</span
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
                                                        class="rounded-md border border-green-100 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:border-green-500 dark:bg-[#ebebed] dark:text-green-600"
                                                        >COMPLETED</span
                                                    >
                                                {/if}
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
                                            getCashOutListTableData(
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
                                            getCashOutListTableData(
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
                                            getCashOutListTableData(
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
        {/if}

        {#if Number($sessionData?.rbacFlag) & 3}
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
                                            class="px-4 py-3 text-center"
                                            >Transaction Number</th
                                        >

                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Mode of Payment</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Name</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >One Marketing Amount</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Commission Amount</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Bank/E-Wallet</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Account Number</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Account Name</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Status</th
                                        >
                                        <th
                                            scope="col"
                                            class="px-4 py-3 text-center"
                                            >Date</th
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
                                    {#each paginatedPendingCashOutTxn as row}
                                        <tr
                                            class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                        >
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.txnId}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.modeOfPayment}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div>
                                                    <span
                                                        class="text-xs text-neutral-800 dark:text-neutral-300"
                                                        >{row.memberName}</span
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
                                                                row.oneMarketingAmount,
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
                                                                row.commissionAmount,
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
                                                    >
                                                        {row.modeOfPaymentOther ??
                                                            '--'}</span
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
                                                        {row.accountNumber ??
                                                            '--'}</span
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
                                                        {row.accountName ??
                                                            '--'}</span
                                                    >
                                                </div>
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                                >{#if row.transactionStatus === '00_VOID'}
                                                    <span
                                                        class="rounded-md border border-red-100 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:border-red-500 dark:bg-[#ebebed] dark:text-red-600"
                                                        >CANCELLED</span
                                                    >
                                                {:else if row.transactionStatus === '01_PENDING'}
                                                    <span
                                                        class="mr-2 rounded-md border border-yellow-100 bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:border-yellow-500 dark:bg-[#ebebed] dark:text-yellow-600"
                                                        >PENDING</span
                                                    >
                                                {:else if row.transactionStatus === '02_APPROVED'}
                                                    <span
                                                        class="mr-2 rounded-md border border-purple-100 bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:border-purple-500 dark:bg-[#ebebed] dark:text-purple-600"
                                                        >APPROVED</span
                                                    >
                                                {:else}
                                                    <span
                                                        class="mr-2 rounded-md border border-green-100 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:border-green-500 dark:bg-[#ebebed] dark:text-green-600"
                                                        >COMPLETED</span
                                                    >
                                                {/if}
                                            </td>
                                            <td
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
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
                                                class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                            >
                                                <div
                                                    class="flex items-center justify-center space-x-2"
                                                >
                                                    <button
                                                        type="button"
                                                        on:click={() =>
                                                            handleApproveCompleteBtn(
                                                                row.txnId,
                                                                row.userId,
                                                                `${row.transactionStatus}`,
                                                            )}
                                                        class="focus:ring-primary-300 inline-flex items-center rounded-lg bg-green-600 px-2 py-2 text-center text-sm font-bold tracking-[.12rem] text-white hover:bg-green-700 focus:ring-4"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke-width="1.5"
                                                            stroke="currentColor"
                                                            class="mr-1 h-6 w-6"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                                                            />
                                                        </svg>
                                                        {#if row.transactionStatus === '01_PENDING'}
                                                            Approve
                                                        {:else if row.transactionStatus === '02_APPROVED'}
                                                            Complete
                                                        {/if}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        on:click={() =>
                                                            handleCancelBtn(
                                                                row.txnId,
                                                                row.userId,
                                                            )}
                                                        class="inline-flex items-center rounded-lg bg-red-600 px-2 py-2 text-center text-sm font-bold tracking-[.12rem] text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke-width="1.5"
                                                            stroke="currentColor"
                                                            class="mr-1 h-6 w-6"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {#if row.transactionStatus === '01_PENDING'}
                                                            Decline
                                                        {:else if row.transactionStatus === '02_APPROVED'}
                                                            Cancel
                                                        {/if}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                        <div
                            class="sticky bottom-0 right-0 items-center border-t border-neutral-300 bg-neutral-100 p-4 sm:flex sm:justify-between dark:border-neutral-600 dark:bg-neutral-700"
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
                                            getCashOutListTableData(
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
                                            getCashOutListTableData(
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
                                            getCashOutListTableData(
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
        {/if}
    </div>
</div>

<div
    id="confirmModalCashOutElem"
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
                    Are you sure you want to cash out?
                </h3>
                <button
                    on:click={() => handleConfirmYesBtn()}
                    type="button"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmModalCashOut.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="processModalCashOutElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md p-4">
        <div class="relative rounded-lg bg-white shadow dark:bg-[#666666]">
            <div class="p-4 md:p-5">
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
                    class="{formData.status !== '00_VOID'
                        ? 'mb-5'
                        : $sessionData?.rbacFlag === 8
                          ? 'mb-5'
                          : ''} text-center text-lg font-normal text-gray-500 dark:text-gray-400"
                >
                    {#if browser}
                        {#if formData.status === '00_VOID'}
                            Are you sure you want to cancel this cash out?
                        {:else if formData.status === '02_APPROVED'}
                            Are you sure you want to approved this cash out?
                        {:else}
                            Are you sure you want to complete this cash out?
                        {/if}
                    {/if}
                </h3>
                {#if Number($sessionData?.rbacFlag) & 3}
                    {#if formData.status === '00_VOID'}
                        <div class="flex justify-center p-4">
                            <textarea
                                bind:value={formData.notes}
                                on:input={onChangeCancelNotes}
                                id="notes"
                                name="notes"
                                class="border-custom-gold-1 dark:bg-sveltekit-sh1 dark:border-custom-gold-1 block w-full rounded-lg border bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:placeholder-gray-200 dark:focus:border-yellow-500 dark:focus:ring-yellow-500"
                                rows="4"
                                placeholder="Leave a comment..."
                            ></textarea>
                        </div>
                    {/if}

                    {#if formData.status === '03_COMPLETED'}
                        <div class="mb-4">
                            <label
                                class="mb-2 block text-center text-sm font-bold text-gray-900 dark:text-gray-400"
                                for="proofOfPayment">Receipt</label
                            >
                            <input
                                class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-50"
                                aria-describedby="file_input_help"
                                id="proofOfPayment"
                                type="file"
                                on:change={handleProofOfPaymentChange}
                            />
                            {#if imageData.proofOfPayment.data === null}
                                <p
                                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                    id="file_input_help"
                                >
                                    JPG or PNG (MAX 2MB).
                                </p>
                            {:else if imageData.proofOfPayment.data === ''}
                                <div
                                    class="mt-1 flex items-center justify-start"
                                >
                                    <span
                                        class="text-sm font-bold text-red-500 dark:text-red-600"
                                        >Supported formats are JPG, PNG & size
                                        must be 2MB or less.</span
                                    >
                                </div>
                            {:else}
                                <div
                                    class="mt-1 flex items-center justify-start"
                                >
                                    <span
                                        class="text-sm font-bold text-green-500 dark:text-green-700"
                                        >Image is valid.</span
                                    >
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/if}
                <div class="text-center">
                    <!-- {#if formData.status === '03_COMPLETED'}
                        <button
                            on:click={() => handleProcessPendingConfirmYesBtn()}
                            type="button"
                            disabled={imageData['proofOfPayment'].name === ''}
                            class="{imageData['proofOfPayment'].name === ''
                                ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                                : 'bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 cursor-pointer'} me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                        >
                            Yes
                        </button>
                    {:else}
                        <button
                            on:click={() => handleProcessPendingConfirmYesBtn()}
                            type="button"
                            disabled={disabledConfirmBtn &&
                                formData.status === '00_VOID'}
                            class="{disabledConfirmBtn &&
                            formData.status === '00_VOID'
                                ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                                : 'bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 cursor-pointer'} me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                        >
                            Yes
                        </button>
                    {/if} -->

                    <button
                        on:click={() => handleProcessPendingConfirmYesBtn()}
                        type="button"
                        disabled={disabledConfirmBtn &&
                            formData.status === '00_VOID'}
                        class="{disabledConfirmBtn &&
                        formData.status === '00_VOID'
                            ? 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'
                            : 'bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 cursor-pointer'} me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                    >
                        Yes
                    </button>

                    <button
                        on:click={() => processModalCashOut.hide()}
                        type="button"
                        class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                        >No</button
                    >
                </div>
            </div>
        </div>
    </div>
</div>

<div
    id="successModalCashOutElem"
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
