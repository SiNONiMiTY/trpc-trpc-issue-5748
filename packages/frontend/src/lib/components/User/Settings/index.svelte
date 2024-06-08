<script lang="ts">
    import { updateAccountSettingsInputSchema } from '@trpc-subscription/validator/trpc/v1/user'
    import { saveUploadIdInputSchema } from '@trpc-subscription/validator/trpc/v1/utility'
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { Modal } from 'flowbite'
    import { onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { ZodIssue } from 'zod'

    import { browser } from '$app/environment'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'
    import {
        nanoidCustom,
        getImageDataURL,
        postImageDataURL,
    } from '$lib/utilities.js'
    import CountrySelect from '../../Country/CountrySelect.svelte'
    import countries from '../../Country/country.js'
    import '/node_modules/flag-icons/css/flag-icons.min.css'

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const sessionData = sessionDataStore()
    const trpcClient = trpcClientStoreLegacy()

    // Modal
    let confirmModalUserSettings: Modal
    let successModalUserSettings: Modal

    // Form Data
    const formData = {
        userId: '',
        memberId: '',
        password: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        emailAddress: '',
        mobileNumber: '',
        taxIdentificationNumber: '',
        birthdate: dayjs().toISOString().split('T')[0],
        gender: '',
        address: '',
        country: 'PH',
        introducerId: '',
        introducerName: '',
        placerId: '',
        placerName: '',
        modeOfPayment: '',
        acquisitionMethod: '',
        isLocked: false,
        idPicture: [] as string[],
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

    let validImageData: Record<string, { uploadId: string }> = {
        proofOfPayment: {
            uploadId: '',
        },
        validId: {
            uploadId: '',
        },
    }

    let validatedFormData: TRouterInput['user']['updateAccountSettings']
    let setMobilePhCode = countries.find((c) => c.code === 'PH')
    let setMobileCode: Record<string, string> = {
        code: setMobilePhCode?.code ?? '',
        mobileCode: setMobilePhCode?.mobileCode ?? '',
    }
    let showValidateMessage: Record<string, string> = {}
    let alertMessage = ''
    let imageNameProofOfPayment = ''
    let imageNameValidId = ''

    ///////////////
    // Lifecycle //
    ///////////////

    onMount(() => {
        confirmModalUserSettings = new Modal(
            document.getElementById('confirmModalUserSettingsElem'),
            {
                placement: 'center',
                backdrop: 'dynamic',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
            },
        )

        successModalUserSettings = new Modal(
            document.getElementById('successModalUserSettingsElem'),
            {
                placement: 'center',
                backdrop: 'static',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
            },
        )

        getMemberProfile()
    })

    //////////////
    // Handlers //
    //////////////

    const getMemberProfile = async () => {
        const memberProfile = await $trpcClient.user.getProfile.query({
            userId: $sessionData?.userId ?? '',
        })

        formData.userId = memberProfile.user.id
        formData.memberId = String(memberProfile.user.memberId)
        formData.password = memberProfile.user.hashedPassword
        formData.firstName = memberProfile.user.firstName
        formData.middleName = memberProfile.user.middleName ?? ''
        formData.lastName = memberProfile.user.lastName
        formData.suffix = memberProfile.user.suffix ?? ''
        formData.birthdate =
            dayjs(memberProfile.user.birthdate).toISOString().split('T')[0] ??
            ''
        formData.gender = memberProfile.user.gender ?? ''
        formData.mobileNumber =
            memberProfile.user.mobileNumber?.substring(3) ?? ''
        formData.emailAddress = memberProfile.user.emailAddress ?? ''
        formData.address = memberProfile.user.address ?? ''
        formData.taxIdentificationNumber =
            memberProfile.user.taxIdentificationNumber ?? ''
        formData.country =
            countries.find((c) => c.code === memberProfile.user.country)
                ?.code ?? ''

        imageData['proofOfPayment'].name =
            `${memberProfile.uploaded.proofOfPayment}`
        imageData['validId'].name = `${memberProfile.uploaded.validId}`

        validImageData['proofOfPayment'].uploadId =
            `${memberProfile.uploaded.proof}`
        validImageData['validId'].uploadId = `${memberProfile.uploaded.valid}`

        if (
            imageData['proofOfPayment'].name !== 'null' &&
            imageData['validId'].name !== 'null'
        ) {
            imageData = await getImageDataURL(
                imageData,
                `${$sessionData?.userId}`,
                `${$sessionData?.sharedAccessSignature}`,
            )
        }
    }

    const handleProofOfPaymentChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        imageValidationFn(event, 'proofOfPayment')

        const target = event.target as HTMLInputElement
        const file = target.files?.[0]
        if (file) {
            imageNameProofOfPayment = file.name
        } else {
            imageNameProofOfPayment = ''
        }
    }

    const handleValidIdChange: FormEventHandler<HTMLInputElement> = (event) => {
        imageValidationFn(event, 'validId')

        const target = event.target as HTMLInputElement
        const file = target.files?.[0]
        if (file) {
            imageNameValidId = file.name
        } else {
            imageNameValidId = ''
        }
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
                    `${$sessionData?.userId}`,
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

    const hideDropDownList = () => {
        const elemId = document.getElementById('dropdown-phone') as HTMLElement

        if (elemId) {
            elemId.classList.remove('hidden')
        }
    }

    const getMobileNumber = (selectCode: string, mbCode: string) => {
        setMobileCode = {
            code: selectCode,
            mobileCode: mbCode,
        }

        const elemId = document.getElementById('dropdown-phone') as HTMLElement

        if (elemId) {
            elemId.classList.add('hidden')
        }
    }

    const handleMobileNumberChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.mobileNumber = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.mobileNumber) {
            const elemId = document.getElementById(
                'mobileNumber',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.mobileNumber = ''
        }
    }

    const handleEmailAddressChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.emailAddress = event.currentTarget.value

        if (formData.emailAddress) {
            const elemId = document.getElementById(
                'emailAddress',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.emailAddress = ''
        }
    }

    const handleTinChange: FormEventHandler<HTMLInputElement> = (event) => {
        formData.taxIdentificationNumber = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.taxIdentificationNumber) {
            const elemId = document.getElementById('tin') as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.tin = ''
        }
    }

    const handleAddressChange: FormEventHandler<HTMLTextAreaElement> = (
        event,
    ) => {
        formData.address = event.currentTarget.value

        if (formData.address) {
            const elemId = document.getElementById(
                'address',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.address = ''
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

    const handleTransportMode: FormEventHandler<HTMLInputElement> = (event) => {
        formData.acquisitionMethod = event.currentTarget
            .value as TRouterInput['user']['signUp']['acquisitionMethod']

        if (formData.acquisitionMethod) {
            const elemId = document.getElementById(
                'acquisitionMethod',
            ) as HTMLInputElement
            const elemId2 = document.getElementById(
                'acquisitionMethod2',
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
            showValidateMessage.acquisitionMethod = ''
        }
    }

    const clearInput = () => {
        //
    }

    const handleUpdateBtn = async () => {
        const validator = await updateAccountSettingsInputSchema
            .superRefine(async (schema, ctx) => {
                const fields = [
                    { name: 'E-mail address', path: 'emailAddress' },
                    { name: 'Mobile number', path: 'mobileNumber' },
                    {
                        name: 'Tax Identification Number',
                        path: 'taxIdentificationNumber',
                    },
                ]

                const result = await Promise.all([
                    $trpcClient.user.isDataExisting.query({
                        inputSchema: {
                            key: 'emailAddress',
                            value: schema.emailAddress ?? '',
                        },
                        userId: formData.userId,
                    }),
                    $trpcClient.user.isDataExisting.query({
                        inputSchema: {
                            key: 'mobileNumber',
                            value: schema.mobileNumber ?? '',
                        },
                        userId: formData.userId,
                    }),
                    $trpcClient.user.isDataExisting.query({
                        inputSchema: {
                            key: 'taxIdentificationNumber',
                            value: schema.taxIdentificationNumber ?? '',
                        },
                        userId: formData.userId,
                    }),
                ]).catch((err) => {
                    alertMessage = `Something went wrong: ${err.message}`
                    successModalUserSettings.show()
                    ctx.addIssue({
                        code: 'custom',
                        message: err.message,
                    })
                })

                if (result) {
                    for (let i = 0; i < fields.length; i++) {
                        if (result[i]) {
                            ctx.addIssue({
                                code: 'custom',
                                message: `${fields[i].name} already taken.`,
                                path: [fields[i].path],
                            })
                        }
                    }
                }
            })
            .safeParseAsync({
                ...formData,
                memberId: Number(formData.memberId),
                mobileNumber: `${setMobileCode.mobileCode}${formData.mobileNumber}`,
                introducerId: Number(formData.introducerId),
                placerId: Number(formData.placerId),
            })

        if (validator.success) {
            validatedFormData = validator.data
            confirmModalUserSettings.show()
        } else {
            showValidateMessage = {}
            validator.error.issues.forEach((key, index) => {
                key.path.forEach((elem) => {
                    const elemId = document.getElementById(
                        `${String(elem)}`,
                    ) as HTMLInputElement

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
                    if (elem === 'acquisitionMethod') {
                        const elemId2 = document.getElementById(
                            `${String(elem)}2`,
                        ) as HTMLInputElement

                        if (elemId2) {
                            elemId2.classList.add(
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
                        showValidateMessage[elem] = key.message
                    }
                })
            })
        }
    }

    const handleConfirmModalYesBtn = async () => {
        try {
            if (!$sessionData?.isVerified) {
                const response = await $trpcClient.user.updateProfile.mutate({
                    userId: $sessionData?.userId ?? '',
                    proofOfPayment: validImageData['proofOfPayment'].uploadId,
                    validId: validImageData['validId'].uploadId,
                })

                if (response) {
                    alertMessage =
                        'Upload successful, Please wait to verify your account.'
                } else {
                    alertMessage = 'Something went wrong. Please try again.'
                }
            } else {
                const response =
                    await $trpcClient.user.updateAccountSettings.mutate(
                        validatedFormData,
                    )

                if (response) {
                    alertMessage = 'Update successful.'
                } else {
                    alertMessage = 'Something went wrong. Please try again.'
                }
            }

            confirmModalUserSettings.hide()
            successModalUserSettings.show()
        } catch (err) {
            alertMessage = ''
            const issues: ZodIssue[] = JSON.parse((err as TRPCError).message)
            issues.forEach((key) => {
                alertMessage += `${key.message} `
            })
            successModalUserSettings.show()
        }
    }

    const handleSuccessModalOkBtn = () => {
        clearInput()
        getMemberProfile()
        confirmModalUserSettings.hide()
        successModalUserSettings.hide()
    }
</script>

<div class="p-4">
    <div class="mx-auto mb-4 max-w-screen-2xl text-center">
        <h2
            class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
        >
            Settings
        </h2>
    </div>
    {#if !$sessionData?.isVerified}
        <div
            class="mx-0 rounded border border-neutral-300 bg-white p-5 px-4 shadow-lg lg:mx-8 2xl:px-36 dark:border-neutral-600 dark:bg-neutral-800"
        >
            <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div class="mb-4">
                    <label
                        class="mb-2 block text-sm font-bold text-neutral-900 lg:text-lg dark:text-neutral-300"
                        for="proofOfPayment">Proof of Payment</label
                    >

                    <div class="flex w-full items-center justify-center">
                        <label
                            for="proofOfPayment"
                            class="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:hover:border-gray-500 dark:hover:bg-neutral-600"
                        >
                            <div
                                class="flex flex-col items-center justify-center pb-6 pt-5"
                            >
                                <svg
                                    class="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>
                                <p
                                    class="mb-2 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    <span class="font-semibold"
                                        >Click to upload</span
                                    > or drag and drop
                                </p>
                                <p
                                    class="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {imageNameProofOfPayment || 'JPG or PNG'}
                                </p>
                            </div>
                            <input
                                class="block hidden w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-50"
                                aria-describedby="file_input_help"
                                id="proofOfPayment"
                                type="file"
                                on:change={handleProofOfPaymentChange}
                            />
                        </label>
                    </div>

                    <!-- <input
                        class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-50"
                        aria-describedby="file_input_help"
                        id="proofOfPayment"
                        type="file"
                        on:change={handleProofOfPaymentChange}
                    /> -->
                    {#if imageData.proofOfPayment.data === null}
                        <p
                            class="mt-1 text-sm text-neutral-900 dark:text-neutral-300"
                            id="file_input_help"
                        >
                            JPG or PNG (MAX 2MB).
                        </p>
                    {:else if imageData.proofOfPayment.data === ''}
                        <div class="mt-1 flex items-center justify-start">
                            <span
                                class="text-sm font-bold text-red-500 dark:text-red-600"
                                >Supported formats are JPG, PNG & size must be
                                2MB or less.</span
                            >
                        </div>
                    {:else}
                        <div class="mt-1 flex items-center justify-center">
                            <span
                                class="text-sm font-bold text-green-500 dark:text-green-700"
                                >Image is valid.</span
                            >
                        </div>
                    {/if}
                    {#if imageData.proofOfPayment.data !== null}
                        <div class="mt-5 h-64 max-h-64">
                            {#if imageData.proofOfPayment.data}
                                <div class="mb-4">
                                    <div
                                        class="flex flex-row justify-center gap-2 overflow-x-auto"
                                    >
                                        <div
                                            class="border-0.5 relative h-64 w-auto rounded-lg bg-neutral-100"
                                        >
                                            <img
                                                src={imageData.proofOfPayment
                                                    .data}
                                                class="h-full w-full rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div></div>
                    {/if}
                </div>
                <div class="mb-4">
                    <label
                        class="mb-2 block text-sm font-bold text-neutral-900 lg:text-lg dark:text-neutral-300"
                        for="validId">Valid ID</label
                    >
                    <div class="flex w-full items-center justify-center">
                        <label
                            for="validId"
                            class="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:hover:border-gray-500 dark:hover:bg-neutral-600"
                        >
                            <div
                                class="flex flex-col items-center justify-center pb-6 pt-5"
                            >
                                <svg
                                    class="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>
                                <p
                                    class="mb-2 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    <span class="font-semibold"
                                        >Click to upload</span
                                    > or drag and drop
                                </p>
                                <p
                                    class="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {imageNameValidId || 'JPG or PNG'}
                                </p>
                            </div>
                            <input
                                class="hidden w-full cursor-pointer rounded-lg border border-neutral-300 bg-neutral-50 text-sm text-neutral-900 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700"
                                aria-describedby="file_input_help"
                                id="validId"
                                type="file"
                                on:change={handleValidIdChange}
                            />
                        </label>
                    </div>
                    <!-- <input
                        class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-50"
                        aria-describedby="file_input_help"
                        id="validId"
                        type="file"
                        on:change={handleValidIdChange}
                    /> -->
                    {#if imageData.validId.data === null}
                        <p
                            class="mt-1 text-sm text-neutral-900 dark:text-neutral-300"
                            id="file_input_help"
                        >
                            JPG or PNG (MAX 2MB).
                        </p>
                    {:else if imageData.validId.data === ''}
                        <div class="mt-1 flex items-center justify-start">
                            <span
                                class="text-sm font-bold text-red-500 dark:text-red-600"
                                >Supported formats are JPG, PNG & size must be
                                2MB or less.</span
                            >
                        </div>
                    {:else}
                        <div class="mt-1 flex items-center justify-center">
                            <span
                                class="text-sm font-bold text-green-500 dark:text-green-700"
                                >Image is valid.</span
                            >
                        </div>
                    {/if}
                    {#if imageData.validId.data !== null}
                        <div class="mt-5 h-64 max-h-64">
                            {#if imageData.validId.data}
                                <div class="mb-4">
                                    <div
                                        class="flex flex-row justify-center gap-2 overflow-x-auto"
                                    >
                                        <div
                                            class="border-0.5 relative h-64 w-auto rounded-lg bg-neutral-100"
                                        >
                                            <img
                                                src={imageData.validId.data}
                                                class="h-full w-full rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div></div>
                    {/if}
                </div>
            </div>
            <div class="mt-10 flex items-center justify-center">
                <button
                    type="button"
                    on:click={() => confirmModalUserSettings.show()}
                    disabled={imageData['proofOfPayment'].name === '' &&
                        imageData['validId'].name === ''}
                    class="{imageData['proofOfPayment'].name &&
                    imageData['validId'].name
                        ? 'bg-primary-700 dark:bg-primary-600'
                        : 'cursor-not-allowed bg-gradient-to-tl from-neutral-900 via-neutral-700 to-neutral-900'} hover:bg-primary-800 focus:ring-primary-300 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Upload
                </button>
            </div>
        </div>
    {/if}

    {#if $sessionData?.isVerified}
        <div class="grid grid-cols-1 px-4 pt-4 xl:grid-cols-3 xl:gap-4">
            <!-- <div class="col-span-full">
                <div class="rounded-lg bg-white p-4 sm:px-6 2xl:col-span-2">
                    <div
                        class="items-center sm:flex sm:space-x-4 xl:block xl:space-x-0 2xl:flex 2xl:space-x-4"
                    >
                        <img
                            class="mb-4 h-28 w-28 rounded-lg sm:mb-0 xl:mb-4 2xl:mb-0"
                            src="https://flowbite-admin-dashboard.vercel.app/images/users/bonnie-green-2x.png"
                            alt="Jese picture"
                        />
                        <div>
                            <h3
                                class="mb-1 text-xl font-bold text-gray-900 dark:text-white"
                            ></h3>
                            <div
                                class="mb-4 text-sm text-gray-500 dark:text-gray-400"
                            >
                                JPG, GIF or PNG. Max size of 800K
                            </div>
                            <div class="flex items-center space-x-4">
                                <button
                                    type="button"
                                    class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex items-center rounded-lg px-3 py-2 text-center text-sm font-medium text-white focus:ring-4"
                                >
                                    <svg
                                        class="-ml-1 mr-2 h-4 w-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                        ><path
                                            d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"
                                        ></path><path
                                            d="M9 13h2v5a1 1 0 11-2 0v-5z"
                                        ></path></svg
                                    >
                                    Upload picture
                                </button>
                                <button
                                    type="button"
                                    class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-50 dark:hover:text-white dark:focus:ring-gray-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div> -->
            <div class="col-span-full">
                <div class="rounded-lg bg-white p-4 sm:px-6 2xl:col-span-2">
                    <h3 class="mb-4 text-xl font-semibold dark:text-white">
                        Personal information
                    </h3>
                    <form
                        method="post"
                        on:submit|preventDefault={handleUpdateBtn}
                    >
                        <div class="grid grid-cols-7 gap-6">
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="firstName"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    id="firstName"
                                    bind:value={formData.firstName}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                    disabled
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
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="middleName"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    name="middleName"
                                    id="middleName"
                                    bind:value={formData.middleName}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                    disabled
                                />
                            </div>
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="lastName"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    id="lastName"
                                    bind:value={formData.lastName}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                    disabled
                                />
                                {#if showValidateMessage.lastName}
                                    <div
                                        class="mt-1 flex items-center justify-start"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-500"
                                            >{showValidateMessage.lastName}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <div class="col-span-7 sm:col-span-1">
                                <label
                                    for="suffix"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Suffix
                                </label>
                                <input
                                    type="text"
                                    name="suffix"
                                    id="suffix"
                                    bind:value={formData.suffix}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                    disabled
                                />
                            </div>
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="birthdate"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Birthday
                                </label>
                                <input
                                    type="date"
                                    name="birthdate"
                                    id="birthdate"
                                    bind:value={formData.birthdate}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                    disabled
                                />
                                {#if showValidateMessage.birthdate}
                                    <div
                                        class="mt-1 flex items-center justify-start"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-500"
                                            >{showValidateMessage.birthdate}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="gender"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    bind:value={formData.gender}
                                    disabled
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                >
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                    <option value="UNSPECIFIED"
                                        >UNSPECIFIED</option
                                    >
                                </select>
                                {#if showValidateMessage.gender}
                                    <div
                                        class="mt-1 flex items-center justify-start"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-500"
                                            >{showValidateMessage.gender}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <div class="col-span-7 sm:col-span-3">
                                <label
                                    for="mobileNumber"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Mobile Number <span
                                        class="font-bold text-red-500">*</span
                                    >
                                </label>
                                <div class="flex items-center">
                                    <button
                                        id="dropdown-phone-button"
                                        data-dropdown-toggle="dropdown-phone"
                                        class="dark:focus:ring-primary-500 z-10 inline-flex flex-shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-300"
                                        type="button"
                                        on:click={hideDropDownList}
                                    >
                                        <div class="flex flex-row">
                                            <span
                                                class={`fi fi-${String(
                                                    setMobileCode.code,
                                                ).toLowerCase()} mr-1`}
                                            />
                                            {setMobileCode.mobileCode}
                                        </div>
                                        <svg
                                            class="ms-2.5 h-2.5 w-2.5"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 10 6"
                                            ><path
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="m1 1 4 4 4-4"
                                            /></svg
                                        >
                                    </button>
                                    <div
                                        id="dropdown-phone"
                                        class="z-10 hidden max-h-56 w-auto divide-y divide-gray-100 overflow-y-scroll rounded-lg bg-white shadow dark:bg-gray-50"
                                    >
                                        <ul
                                            class="py-2 text-sm text-gray-700 dark:text-gray-200"
                                            aria-labelledby="dropdown-phone-button"
                                        >
                                            {#each countries as country}
                                                <li>
                                                    <button
                                                        id="mobile-list-button"
                                                        type="button"
                                                        class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:hover:text-gray-900"
                                                        role="menuitem"
                                                        on:click={() =>
                                                            getMobileNumber(
                                                                country.code,
                                                                country.mobileCode,
                                                            )}
                                                    >
                                                        <div
                                                            class="inline-flex items-center"
                                                        >
                                                            <span
                                                                class={`fi fi-${String(
                                                                    country.code,
                                                                ).toLowerCase()} mr-1`}
                                                            />
                                                            {country.code}
                                                            {country.mobileCode}
                                                        </div>
                                                    </button>
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>

                                    <div class="relative w-full">
                                        <input
                                            type="text"
                                            name="mobileNumber"
                                            id="mobileNumber"
                                            maxlength="10"
                                            bind:value={formData.mobileNumber}
                                            on:input={handleMobileNumberChange}
                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                        />
                                    </div>
                                </div>
                                {#if showValidateMessage.mobileNumber}
                                    <div
                                        class="mt-1 flex items-center justify-start"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-500"
                                            >{showValidateMessage.mobileNumber}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="emailAddress"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Email Address <span
                                        class="font-bold text-red-500">*</span
                                    >
                                </label>
                                <input
                                    type="email"
                                    name="emailAddress"
                                    id="emailAddress"
                                    bind:value={formData.emailAddress}
                                    on:input={handleEmailAddressChange}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                />
                                {#if showValidateMessage.emailAddress}
                                    <div
                                        class="mt-1 flex items-center justify-start"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-500"
                                            >{showValidateMessage.emailAddress}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <div class="col-span-7 sm:col-span-2">
                                <label
                                    for="tin"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    TIN <span class="font-bold text-red-500"
                                        >*</span
                                    >
                                </label>
                                <input
                                    type="text"
                                    name="tin"
                                    id="tin"
                                    maxlength="12"
                                    bind:value={formData.taxIdentificationNumber}
                                    on:input={handleTinChange}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                />
                            </div>
                            <div class="col-span-7 sm:col-span-3">
                                <label
                                    for="country"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Country
                                </label>
                                {#if browser}
                                    {#if localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)}
                                        <CountrySelect
                                            listId="country"
                                            name="country"
                                            search_logic
                                            bind:value={formData.country}
                                            customClass="custom"
                                            disabled
                                        >
                                            <style>
                                                .custom {
                                                    --field-background-color: rgb(
                                                        249 250 251
                                                    );
                                                    --list-background-color: rgb(
                                                        255 255 255
                                                    );
                                                    --field-border-color: rgb(
                                                        75 85 99
                                                    );

                                                    --field-focus-border-color: rgb(
                                                        248 113 113
                                                    );
                                                    --field-border-width: 1px;
                                                }
                                            </style>
                                        </CountrySelect>
                                    {:else}
                                        <CountrySelect
                                            listId="country"
                                            name="country"
                                            search_logic
                                            bind:value={formData.country}
                                            disabled
                                        />
                                    {/if}
                                {/if}
                            </div>
                            <div class="col-span-7">
                                <label
                                    for="address"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Full Address <span
                                        class="font-bold text-red-500">*</span
                                    >
                                </label>
                                <textarea
                                    name="address"
                                    id="address"
                                    rows="3"
                                    bind:value={formData.address}
                                    on:input={handleAddressChange}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
                                />
                                {#if showValidateMessage.address}
                                    <div
                                        class="mt-1 flex items-center justify-start"
                                    >
                                        <span
                                            class="text-sm font-bold text-red-500"
                                            >{showValidateMessage.address}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <div
                                class="sm:col-full col-span-7 flex justify-center"
                            >
                                <button
                                    class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                                    type="submit">Update</button
                                >
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    {/if}
</div>

<div
    id="confirmModalUserSettingsElem"
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
                    {#if !$sessionData?.isVerified}
                        Are you sure you want to upload this images?
                    {:else}
                        Are you sure you want to update this changes?
                    {/if}
                </h3>
                <button
                    on:click={handleConfirmModalYesBtn}
                    type="button"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmModalUserSettings.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>
<div
    id="successModalUserSettingsElem"
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
                on:click={handleSuccessModalOkBtn}
                class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:focus:ring-primary-900 rounded-lg px-3 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
            >
                Continue
            </button>
        </div>
    </div>
</div>

<style>
    input:disabled {
        background-color: #ececec;
    }
    select:disabled {
        background-color: #ececec;
    }
</style>
