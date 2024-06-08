<script lang="ts">
    import { updateProfileInputSchema } from '@trpc-subscription/validator/trpc/v1/user'
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { initDropdowns, Modal, Tabs } from 'flowbite'
    import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { ZodIssue } from 'zod'

    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'
    import countries from '../../Country/country.js'
    import CountrySelect from '../../Country/CountrySelect.svelte'
    import '/node_modules/flag-icons/css/flag-icons.min.css'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'
    import { getImageDataURL } from '$lib/utilities.js'

    ////////////////////
    // Initialization //
    ////////////////////

    export let isVerified: boolean
    // export let exportData: {
    //     userId: string
    //     introducerName: string
    //     placerName: string
    // }
    const dispatch = createEventDispatcher()
    const closeModal = () => dispatch('close')

    // Custom Stores
    const sessionData = sessionDataStore()
    const trpcClient = trpcClientStoreLegacy()

    // Modal
    let confirmModal: Modal
    let successModal: Modal
    let deleteModal: Modal

    // Tab
    let panelTab: Tabs

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
        validId: {
            data: null,
            type: '',
            name: '',
        },
    }

    let validatedFormData: TRouterInput['user']['updateProfile']
    let setMobilePhCode = countries.find((c) => c.code === 'PH')
    let setMobileCode: Record<string, string> = {
        code: setMobilePhCode?.code ?? '',
        mobileCode: setMobilePhCode?.mobileCode ?? '',
    }
    let confirmPassword = ''
    let showPassword = false
    let showConPassword = false
    let imageIdList: string[] = []
    let imageBankDetailsList: string[] = []
    let validateIdPictureType = ''
    let validateBankDetailsPictureType = ''
    let showValidateMessage: Record<string, string> = {}
    let alertMessage = ''
    const isWeb = true
    const isAdmin = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    afterUpdate(() => {
        initDropdowns()
    })

    onMount(() => {
        confirmModal = new Modal(
            document.getElementById('confirmModalProfileElem'),
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

        deleteModal = new Modal(document.getElementById('deleteModalElem'), {
            placement: 'bottom-right',
            backdrop: 'dynamic',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

        successModal = new Modal(
            document.getElementById('successModalProfileElem'),
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

        if (isAdmin) {
            const tabsElement = document.getElementById('panel-tab')
            const tabElements = [
                {
                    id: 'personal',
                    triggerEl: document.querySelector(
                        '#personal-tab',
                    ) as HTMLElement,
                    targetEl: document.querySelector(
                        '#personal-content',
                    ) as HTMLElement,
                },
                {
                    id: 'otherinfo',
                    triggerEl: document.querySelector(
                        '#otherinfo-tab',
                    ) as HTMLElement,
                    targetEl: document.querySelector(
                        '#otherinfo-content',
                    ) as HTMLElement,
                },
                // {
                //     id: 'general',
                //     triggerEl: document.querySelector(
                //         '#general-tab',
                //     ) as HTMLElement,
                //     targetEl: document.querySelector(
                //         '#general-content',
                //     ) as HTMLElement,
                // },
            ]

            const options = {
                defaultTabId: 'settings',
                activeClasses: 'bg-primary-700 text-white rounded-full',
                inactiveClasses:
                    'text-gray-500 hover:text-gray-600 dark:text-gray-600 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300',
                onShow: () => {},
            }

            panelTab = new Tabs(tabsElement, tabElements, options)
        }
    })

    //////////////
    // Handlers //
    //////////////

    export async function getMemberProfile(
        userId: string,
        introducerName: string,
        placerName: string,
    ) {
        const memberProfile = await $trpcClient.user.getProfile.query({
            userId,
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
        formData.introducerId = String(memberProfile.user.introducerId)
        formData.introducerName = introducerName
        formData.placerId = String(memberProfile.user.placerId)
        formData.placerName = placerName
        formData.modeOfPayment = memberProfile.user.modeOfPayment ?? ''
        formData.acquisitionMethod = memberProfile.user.acquisitionMethod ?? ''
        formData.isLocked = memberProfile.user.isLocked

        imageData['validId'].name = memberProfile.user.validId ?? ''

        imageData = await getImageDataURL(
            imageData,
            formData.userId,
            `${$sessionData?.sharedAccessSignature}`,
        )
    }

    const handleMemberIdChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.memberId = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.memberId) {
            const elemId = document.getElementById(
                'memberId',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.memberId = ''
        }
    }

    const handleFirstNameChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.firstName = event.currentTarget.value

        if (formData.firstName) {
            const elemId = document.getElementById(
                'firstName',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.firstName = ''
        }
    }

    const handleLastNameChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.lastName = event.currentTarget.value

        if (formData.lastName) {
            const elemId = document.getElementById(
                'lastName',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.lastName = ''
        }
    }

    const handleGenderChange = () => {
        if (formData.gender) {
            const elemId = document.getElementById('gender') as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.gender = ''
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

    const handleAddressChange: FormEventHandler<HTMLInputElement> = (event) => {
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

    const handleIdPictureFile: FormEventHandler<HTMLInputElement> = (event) => {
        const files = event.currentTarget.files
        validateIdPictureType = ''

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const fileName = files.item(i)!.name
                const fileExt = fileName.substring(
                    fileName.lastIndexOf('.') + 1,
                )

                // if (fileExt && !fileExt.match(/^jpe?g|png$/)) {
                //     validateIdPictureType =
                //         'Supported formats are JPG, JPEG, PNG.'
                //     continue
                // }

                const fileReader = new FileReader()

                fileReader.addEventListener('load', () => {
                    formData.idPicture.push(fileReader.result as string)
                })
                fileReader.readAsDataURL(files.item(i)!)

                imageIdList = [
                    ...imageIdList,
                    fileName,
                ]
            }
        }
    }

    const handleIntroducerIdChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.introducerId = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.introducerId) {
            const elemId = document.getElementById(
                'introducerId',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.introducerId = ''
        }
    }

    const handlePlacerIdChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.placerId = !isNaN(Number(event.currentTarget.value))
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (formData.placerId) {
            const elemId = document.getElementById(
                'placerId',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.placerId = ''
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

    const handleBankDetailsFile: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const files = event.currentTarget.files
        imageBankDetailsList = []
        validateBankDetailsPictureType = ''
        if (files) {
            for (let i = 0; i <= files.length; i++) {
                const fileName = files.item(i)?.name as string
                const fileType = files.item(i)?.type as string
                const imgExt = fileType?.substring(
                    fileType?.lastIndexOf('/') + 1,
                )

                if (imgExt) {
                    if (!imgExt.match(/jpeg|jpg|png/)) {
                        validateBankDetailsPictureType =
                            'Image must be jpeg, jpg, png'
                        imageBankDetailsList = []
                        break
                    }
                }

                if (fileName) {
                    imageBankDetailsList = [
                        ...imageBankDetailsList,
                        String(fileName),
                    ]
                }
            }
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

    const handleUpdateBtn = async () => {
        const validator = await updateProfileInputSchema
            .superRefine(async (schema, ctx) => {
                const fields = [
                    { name: 'Member ID', path: 'memberId' },
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
                            key: 'memberId',
                            value: Number(schema.memberId),
                        },
                        userId: formData.userId,
                    }),
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
                    successModal.show()
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
            confirmModal.show()
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

    const handleConfirmYesBtn = async () => {
        try {
            const response = isVerified
                ? await $trpcClient.user.updateProfile.mutate(validatedFormData)
                : await $trpcClient.user.deleteProfile.mutate(validatedFormData)

            if (response) {
                alertMessage = `Member successfully ${isVerified ? 'updated' : 'deleted'}.`
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            successModal.show()
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
        closeModal()
        confirmModal.hide()
        deleteModal.hide()
        successModal.hide()
    }

    const showTab = (id: string) => {
        panelTab.show(id)
    }
</script>

{#if isWeb}
    {#if isAdmin}
        <div class={isVerified ? '' : 'hidden'}>
            <form
                method="post"
                on:submit|preventDefault={handleUpdateBtn}
            >
                <div>
                    <div class="mt-4 items-center sm:flex sm:space-x-2">
                        <div>
                            <div class="mb-1 flex items-center justify-center">
                                <!-- <div class="flex w-[142px] justify-center">
                                    <img
                                        class="mb-4 h-28 w-28 rounded-full sm:mb-0 xl:mb-4 2xl:mb-0"
                                        src="/defaultprofilepic.png"
                                        alt="Jese picture"
                                    />
                                </div> -->
                                <div>
                                    <div class="mb-2 flex items-center">
                                        <label
                                            for="memberId"
                                            class="mr-2 block w-20 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Member ID:
                                        </label>
                                        <input
                                            type="text"
                                            name="memberId"
                                            id="memberId"
                                            maxlength="10"
                                            bind:value={formData.memberId}
                                            on:input={handleMemberIdChange}
                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-20 rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                            placeholder=""
                                        />
                                    </div>

                                    {#if showValidateMessage.memberId}
                                        <div
                                            class="mt-1 flex items-center justify-start"
                                        >
                                            <span
                                                class="text-sm font-bold text-red-500"
                                                >{showValidateMessage.memberId}</span
                                            >
                                        </div>
                                    {/if}

                                    <div>
                                        <div
                                            class="flex items-center space-x-4"
                                        >
                                            <div class="grid grid-cols-2">
                                                <div>
                                                    <input
                                                        id="active"
                                                        name="locked"
                                                        type="radio"
                                                        checked={!formData.isLocked}
                                                        class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                    />
                                                    <label
                                                        for="active"
                                                        class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-300"
                                                        >Active</label
                                                    >
                                                </div>
                                                <div>
                                                    <input
                                                        id="inactive"
                                                        name="locked"
                                                        type="radio"
                                                        checked={formData.isLocked}
                                                        class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                    />
                                                    <label
                                                        for="inactive"
                                                        class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-300"
                                                        >Inactive</label
                                                    >
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- <div>
                                <input
                                    type="file"
                                    id="actual-btn"
                                    hidden
                                />
                                <label
                                    for="actual-btn"
                                    class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-center text-sm font-medium text-white focus:ring-4"
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
                                </label>
                            </div> -->
                        </div>
                    </div>
                </div>

                <div class="mb-4 mt-2">
                    <ul
                        class="-mb-px flex justify-center px-4 text-center text-sm font-bold"
                        id="panel-tab"
                        role="tablist"
                    >
                        <li
                            class="me-2"
                            role="presentation"
                        >
                            <button
                                class="inline-block flex items-center justify-center px-4 py-3"
                                id="personal-tab"
                                type="button"
                                on:click={() => showTab('personal')}
                                role="tab">Personal Information</button
                            >
                        </li>
                        <li
                            class="me-2"
                            role="presentation"
                        >
                            <button
                                class="inline-block flex items-center justify-center px-4 py-3"
                                id="otherinfo-tab"
                                type="button"
                                on:click={() => showTab('otherinfo')}
                                role="tab">Other Information</button
                            >
                        </li>
                        <!-- <li
                            class="me-2"
                            role="presentation"
                        >
                            <button
                                class="inline-block py-3 px-4 flex justify-center items-center"
                                id="general-tab"
                                type="button"
                                on:click={() => showTab('general')}
                                role="tab">Valid ID</button
                            >
                        </li> -->
                    </ul>
                </div>

                <div
                    id="default-tab-content"
                    class="h-[450px] rounded-lg border border-gray-200 p-4 shadow dark:border-gray-500"
                >
                    <div
                        class="hidden"
                        id="personal-content"
                        role="tabpanel"
                    >
                        <div class="grid gap-4 sm:grid-cols-10">
                            <div class="col-span-3">
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
                                    on:input={handleFirstNameChange}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
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
                            <div class="col-span-3">
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
                                />
                            </div>
                            <div class="col-span-3">
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
                                    on:input={handleLastNameChange}
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                    placeholder=""
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
                            <div>
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
                                />
                            </div>
                            <div class="col-span-3">
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
                            <div class="col-span-3">
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
                                    on:change={handleGenderChange}
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
                            <div class="col-span-4">
                                <label
                                    for="mobileNumber"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Mobile Number
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
                            <div class="col-span-3">
                                <label
                                    for="emailAddress"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Email Address
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
                            <div class="col-span-3">
                                <label
                                    for="tin"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    TIN
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
                            <div class="col-span-4">
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
                                        />
                                    {/if}
                                {/if}
                            </div>
                            <div class="col-span-10">
                                <label
                                    for="address"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Full Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
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
                        </div>
                    </div>

                    <div
                        class="hidden"
                        id="otherinfo-content"
                        role="tabpanel"
                    >
                        <div class="grid grid-cols-2 gap-8">
                            <dl>
                                <h1
                                    class="text-md mb-2 font-bold leading-tight tracking-tight text-gray-900 md:text-xl dark:text-white"
                                >
                                    [One-Marketing]
                                </h1>
                                <div class="grid grid-cols-1 gap-2">
                                    <div>
                                        <label
                                            for="introducerId"
                                            class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Introducer
                                        </label>
                                        <div>
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <div
                                                    class="flex w-full items-center"
                                                >
                                                    <input
                                                        type="text"
                                                        name="introducerId"
                                                        id="introducerId"
                                                        maxlength="10"
                                                        bind:value={formData.introducerId}
                                                        on:input={handleIntroducerIdChange}
                                                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 z-10 block inline-flex w-[75px] flex-shrink-0 rounded-s-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                                        placeholder=""
                                                        disabled
                                                    />
                                                    <div
                                                        class="relative w-full"
                                                    >
                                                        <input
                                                            value={formData.introducerName}
                                                            disabled
                                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {#if showValidateMessage.introducerId}
                                                <div
                                                    class="mt-1 flex items-center justify-start"
                                                >
                                                    <span
                                                        class="text-sm font-bold text-red-500"
                                                        >{showValidateMessage.introducerId}</span
                                                    >
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            for="placerId"
                                            class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Placement
                                        </label>
                                        <div>
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <div
                                                    class="flex w-full items-center"
                                                >
                                                    <input
                                                        type="text"
                                                        name="placerId"
                                                        id="placerId"
                                                        maxlength="10"
                                                        bind:value={formData.placerId}
                                                        on:input={handlePlacerIdChange}
                                                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 z-10 block inline-flex w-[75px] flex-shrink-0 rounded-s-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                                        placeholder=""
                                                        disabled
                                                    />
                                                    <div
                                                        class="relative w-full"
                                                    >
                                                        <input
                                                            value={formData.placerName}
                                                            disabled
                                                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {#if showValidateMessage.placerId}
                                                <div
                                                    class="mt-1 flex items-center justify-start"
                                                >
                                                    <span
                                                        class="text-sm font-bold text-red-500"
                                                        >{showValidateMessage.placerId}</span
                                                    >
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </dl>
                            <dl>
                                <h1
                                    class="text-md mb-2 font-bold leading-tight tracking-tight text-gray-900 md:text-xl dark:text-white"
                                >
                                    [Payment]
                                </h1>
                                <div class="grid grid-cols-1 gap-6">
                                    <div class="items-center">
                                        <label
                                            for="modeOfPayment"
                                            class="mb-2 block w-full text-sm font-medium text-gray-900 sm:mb-0 sm:w-56 dark:text-white"
                                        >
                                            Mode of Payment
                                        </label>
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
                                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 items-center border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                />
                                                <label
                                                    for="modeOfPayment"
                                                    class="sm:ml:0 ml-1 mr-5 text-gray-900 dark:text-gray-300"
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
                                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                />
                                                <label
                                                    for="modeOfPayment2"
                                                    class="sm:ml:0 ml-1 mr-5 text-gray-900 dark:text-gray-300"
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
                                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                />
                                                <label
                                                    for="modeOfPayment3"
                                                    class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-300"
                                                    >E-Wallet</label
                                                >
                                            </div>
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

                                    <div class="items-center">
                                        <label
                                            for="modeOfPayment"
                                            class="mb-2 block w-full text-sm font-medium text-gray-900 sm:mb-0 sm:w-56 dark:text-white"
                                        >
                                            Acquisition Method
                                        </label>
                                        <div
                                            class="mt-2 grid w-full grid-cols-3 items-center"
                                        >
                                            <div>
                                                <input
                                                    id="acquisitionMethod"
                                                    name="acquisitionMethod"
                                                    type="radio"
                                                    checked={formData.acquisitionMethod ===
                                                        'PICKUP'}
                                                    on:change={handleTransportMode}
                                                    value="PICKUP"
                                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                />
                                                <label
                                                    for="acquisitionMethod"
                                                    class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-300"
                                                    >Pickup</label
                                                >
                                            </div>
                                            <div>
                                                <input
                                                    id="acquisitionMethod2"
                                                    name="acquisitionMethod"
                                                    type="radio"
                                                    checked={formData.acquisitionMethod ===
                                                        'DELIVERY'}
                                                    on:change={handleTransportMode}
                                                    value="DELIVERY"
                                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-500 h-4 w-4 border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                                />
                                                <label
                                                    for="acquisitionMethod2"
                                                    class="sm:ml:0 ml-1 text-gray-900 dark:text-gray-300"
                                                    >Delivery</label
                                                >
                                            </div>
                                        </div>
                                        {#if showValidateMessage.acquisitionMethod}
                                            <div
                                                class="mt-1 flex items-center justify-start"
                                            >
                                                <span
                                                    class="text-sm font-bold text-red-500"
                                                    >{showValidateMessage.acquisitionMethod}</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </dl>
                        </div>
                        <!-- <div class="mt-6">
                            <h1
                                class="mb-2 text-md font-bold leading-tight tracking-tight text-gray-900 md:text-xl dark:text-white"
                            >
                                [Valid ID]
                            </h1>
                            <div class="flex items-center justify-center">
                                <div class="max-w-96 shadow">
                                    <img
                                        class="max-h-48 w-96 rounded-lg"
                                        src={imageData['validId'].data}
                                        alt="image description"
                                    />
                                </div>
                            </div>
                            <div class="mt-0.5 flex justify-center">
                                <div class="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        id="actual-btn"
                                        hidden
                                    />
                                    <label
                                        for="actual-btn"
                                        class="text-primary-700 hover:text-primary-800 dark:text-primary-600 dark:hover:text-primary-800 inline-flex cursor-pointer items-center rounded-lg px-3 py-1 text-center text-sm font-medium"
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
                                        Change Valid ID
                                    </label>
                                </div>
                            </div>
                        </div> -->
                    </div>

                    <!-- <div
                        class="hidden flex justify-center items-center h-full"
                        id="general-content"
                        role="tabpanel"
                    >
                        <div>
                            <h3
                                class="mb-2 text-base font-semibold dark:text-white flex justify-center items-center"
                            >
                                Valid ID
                            </h3>
                            <div class="flex justify-center items-center">
                                <div class="max-w-96 shadow">
                                    <img
                                        class="w-96 max-h-48 rounded-lg"
                                        src="/example.png"
                                        alt="image description"
                                    />
                                </div>
                            </div>
                            <div class="flex justify-center mt-0.5">
                                <div class="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        id="actual-btn"
                                        hidden
                                    />
                                    <label
                                        for="actual-btn"
                                        class="cursor-pointer inline-flex items-center px-3 py-1 text-sm font-medium text-center rounded-lg text-primary-700 hover:text-primary-800"
                                    >
                                        <svg
                                            class="w-4 h-4 mr-2 -ml-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            xmlns="http://www.w3.org/2000/svg"
                                            ><path
                                                d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"
                                            ></path><path
                                                d="M9 13h2v5a1 1 0 11-2 0v-5z"
                                            ></path></svg
                                        >
                                        Change ID
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div> -->
                </div>

                <div class="mt-4 flex items-center justify-center space-x-4">
                    <button
                        type="submit"
                        class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                    >
                        Update
                    </button>
                    <button
                        on:click={closeModal}
                        type="button"
                        class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                        >Cancel</button
                    >
                </div>
            </form>
        </div>

        <div class={isVerified ? 'hidden' : ''}>
            <div
                class="my-4 flex items-center justify-between rounded-t sm:mb-5"
            >
                <div class="flex items-center">
                    <div class="mr-3 inline-flex items-center">
                        <img
                            class="h-24 w-24 rounded-full"
                            src="/defaultprofilepic.png"
                            alt="image description"
                        />
                    </div>
                    <div class="flex-shrink-0 items-start">
                        <span
                            class="inline-flex text-base font-semibold leading-none text-gray-900 dark:text-white"
                            >{formData.firstName}
                            {formData.middleName}
                            {formData.lastName}
                            {formData.suffix}</span
                        >
                        <div>
                            <h3
                                class="text-xs font-medium text-gray-600 sm:text-sm dark:text-gray-400"
                            >
                                Member ID: {formData.memberId}
                            </h3>
                        </div>
                    </div>
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
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.birthdate}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Mobile No.
                    </dt>
                    <dd
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.mobileNumber}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Introducer
                    </dt>
                    <dd
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
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
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.gender}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Email Address
                    </dt>
                    <dd
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.emailAddress}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Placer
                    </dt>
                    <dd
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
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
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.country}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        Full Address
                    </dt>
                    <dd
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.address}
                    </dd>
                    <dt
                        class="mb-2 font-semibold leading-none text-gray-900 dark:text-white"
                    >
                        TIN
                    </dt>
                    <dd
                        class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400"
                    >
                        {formData.taxIdentificationNumber}
                    </dd>
                </dl>
            </div>

            <h3
                class="mb-2 flex items-center justify-center text-xl font-semibold dark:text-white"
            >
                Valid ID
            </h3>
            <div class="flex items-center justify-center">
                <div class="mb-4 max-w-96 shadow">
                    <img
                        class="max-h-48 w-96 rounded-lg"
                        src="/example.png"
                        alt="image description"
                    />
                </div>
            </div>

            <div class="flex items-center justify-center">
                <div class="flex items-center space-x-3 sm:space-x-4">
                    <button
                        type="button"
                        class="inline-flex items-center rounded-lg border border-red-600 px-5 py-2.5 text-center text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
                        on:click={() => deleteModal.show()}
                    >
                        <svg
                            class="-ml-1 mr-1 h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                            ><path
                                fill-rule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            ></path></svg
                        >
                        Delete this member
                    </button>
                </div>
            </div>
        </div>
    {/if}
    {#if !isAdmin}
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
                            src="/example.png"
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
            </div>
            <div class="col-span-2">
                <div
                    class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-4 text-xl font-semibold dark:text-white">
                        General information
                    </h3>
                    <form action="#">
                        <div class="grid grid-cols-6 gap-6">
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="first-name"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >First Name</label
                                >
                                <input
                                    type="text"
                                    name="first-name"
                                    id="first-name"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="Bonnie"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="last-name"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Last Name</label
                                >
                                <input
                                    type="text"
                                    name="last-name"
                                    id="last-name"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="Green"
                                    required
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
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="United States"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="city"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >City</label
                                >
                                <input
                                    type="text"
                                    name="city"
                                    id="city"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="e.g. San Francisco"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="address"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Address</label
                                >
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="e.g. California"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="email"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Email</label
                                >
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="example@company.com"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="phone-number"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Phone Number</label
                                >
                                <input
                                    type="number"
                                    name="phone-number"
                                    id="phone-number"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="e.g. +(12)3456 789"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="birthday"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Birthday</label
                                >
                                <input
                                    type="number"
                                    name="birthday"
                                    id="birthday"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="15/08/1990"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="organization"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Organization</label
                                >
                                <input
                                    type="text"
                                    name="organization"
                                    id="organization"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="Company Name"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="role"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Role</label
                                >
                                <input
                                    type="text"
                                    name="role"
                                    id="role"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="React Developer"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="department"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Department</label
                                >
                                <input
                                    type="text"
                                    name="department"
                                    id="department"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="Development"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="zip-code"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Zip/postal code</label
                                >
                                <input
                                    type="number"
                                    name="zip-code"
                                    id="zip-code"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="123456"
                                    required
                                />
                            </div>
                            <div class="sm:col-full col-span-6">
                                <button
                                    class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                                    type="submit">Save all</button
                                >
                            </div>
                        </div>
                    </form>
                </div>
                <div
                    class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-4 text-xl font-semibold dark:text-white">
                        Password information
                    </h3>
                    <form action="#">
                        <div class="grid grid-cols-6 gap-6">
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="current-password"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Current password</label
                                >
                                <input
                                    type="text"
                                    name="current-password"
                                    id="current-password"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="password"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >New password</label
                                >
                                <input
                                    data-popover-target="popover-password"
                                    data-popover-placement="bottom"
                                    type="password"
                                    id="password"
                                    class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    placeholder="••••••••"
                                    required
                                />
                                <div
                                    data-popover
                                    id="popover-password"
                                    role="tooltip"
                                    class="invisible absolute z-10 inline-block w-72 rounded-lg border border-gray-200 bg-white text-sm font-light text-gray-500 opacity-0 shadow-sm transition-opacity duration-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                >
                                    <div class="space-y-2 p-3">
                                        <h3
                                            class="font-semibold text-gray-900 dark:text-white"
                                        >
                                            Must have at least 6 characters
                                        </h3>
                                        <div class="grid grid-cols-4 gap-2">
                                            <div
                                                class="h-1 bg-orange-300 dark:bg-orange-400"
                                            ></div>
                                            <div
                                                class="h-1 bg-orange-300 dark:bg-orange-400"
                                            ></div>
                                            <div
                                                class="h-1 bg-gray-200 dark:bg-gray-600"
                                            ></div>
                                            <div
                                                class="h-1 bg-gray-200 dark:bg-gray-600"
                                            ></div>
                                        </div>
                                        <p>It’s better to have:</p>
                                        <ul>
                                            <li class="mb-1 flex items-center">
                                                <svg
                                                    class="mr-2 h-4 w-4 text-green-400 dark:text-green-500"
                                                    aria-hidden="true"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    ><path
                                                        fill-rule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clip-rule="evenodd"
                                                    ></path></svg
                                                >
                                                Upper & lower case letters
                                            </li>
                                            <li class="mb-1 flex items-center">
                                                <svg
                                                    class="mr-2 h-4 w-4 text-gray-300 dark:text-gray-400"
                                                    aria-hidden="true"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    ><path
                                                        fill-rule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clip-rule="evenodd"
                                                    ></path></svg
                                                >
                                                A symbol (#$&)
                                            </li>
                                            <li class="flex items-center">
                                                <svg
                                                    class="mr-2 h-4 w-4 text-gray-300 dark:text-gray-400"
                                                    aria-hidden="true"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    ><path
                                                        fill-rule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clip-rule="evenodd"
                                                    ></path></svg
                                                >
                                                A longer password (min. 12 chars.)
                                            </li>
                                        </ul>
                                    </div>
                                    <div data-popper-arrow></div>
                                </div>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label
                                    for="confirm-password"
                                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                    >Confirm password</label
                                >
                                <input
                                    type="text"
                                    name="confirm-password"
                                    id="confirm-password"
                                    class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div class="sm:col-full col-span-6">
                                <button
                                    class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                                    type="submit">Save all</button
                                >
                            </div>
                        </div>
                    </form>
                </div>
                <div
                    class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
                >
                    <div class="flow-root">
                        <h3 class="text-xl font-semibold dark:text-white">
                            Sessions
                        </h3>
                        <ul
                            class="divide-y divide-gray-200 dark:divide-gray-700"
                        >
                            <li class="py-4">
                                <div class="flex items-center space-x-4">
                                    <div class="flex-shrink-0">
                                        <svg
                                            class="h-6 w-6 dark:text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            ></path></svg
                                        >
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="truncate text-base font-semibold text-gray-900 dark:text-white"
                                        >
                                            California 123.123.123.123
                                        </p>
                                        <p
                                            class="truncate text-sm font-normal text-gray-500 dark:text-gray-400"
                                        >
                                            Chrome on macOS
                                        </p>
                                    </div>
                                    <div class="inline-flex items-center">
                                        <a
                                            href="#"
                                            class="focus:ring-primary-300 mb-3 mr-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-50 dark:hover:text-white"
                                            >Revoke</a
                                        >
                                    </div>
                                </div>
                            </li>
                            <li class="pb-6 pt-4">
                                <div class="flex items-center space-x-4">
                                    <div class="flex-shrink-0">
                                        <svg
                                            class="h-6 w-6 dark:text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            ></path></svg
                                        >
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="truncate text-base font-semibold text-gray-900 dark:text-white"
                                        >
                                            Rome 24.456.355.98
                                        </p>
                                        <p
                                            class="truncate text-sm font-normal text-gray-500 dark:text-gray-400"
                                        >
                                            Safari on iPhone
                                        </p>
                                    </div>
                                    <div class="inline-flex items-center">
                                        <a
                                            href="#"
                                            class="focus:ring-primary-300 mb-3 mr-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-50 dark:hover:text-white"
                                            >Revoke</a
                                        >
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <div>
                            <button
                                class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                                >See more</button
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 px-4 xl:grid-cols-2 xl:gap-4">
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 xl:mb-0 dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="flow-root">
                    <h3 class="text-xl font-semibold dark:text-white">
                        Alerts & Notifications
                    </h3>
                    <p
                        class="text-sm font-normal text-gray-500 dark:text-gray-400"
                    >
                        You can set up Themesberg to get notifications
                    </p>
                    <div class="divide-y divide-gray-200 dark:divide-gray-700">
                        <!-- Item 1 -->
                        <div class="flex items-center justify-between py-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Company News
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Get Themesberg news, announcements, and
                                    product updates
                                </div>
                            </div>
                            <label
                                for="company-news"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="company-news"
                                    class="sr-only"
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                        <!-- Item 2 -->
                        <div class="flex items-center justify-between py-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Account Activity
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Get important notifications about you or
                                    activity you've missed
                                </div>
                            </div>
                            <label
                                for="account-activity"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="account-activity"
                                    class="sr-only"
                                    checked
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                        <!-- Item 3 -->
                        <div class="flex items-center justify-between py-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Meetups Near You
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Get an email when a Dribbble Meetup is
                                    posted close to my location
                                </div>
                            </div>
                            <label
                                for="meetups"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="meetups"
                                    class="sr-only"
                                    checked
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                        <!-- Item 4 -->
                        <div class="flex items-center justify-between pt-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    New Messages
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Get Themsberg news, announcements, and
                                    product updates
                                </div>
                            </div>
                            <label
                                for="new-messages"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="new-messages"
                                    class="sr-only"
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                    </div>
                    <div class="mt-6">
                        <button
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                            >Save all</button
                        >
                    </div>
                </div>
            </div>
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 xl:mb-0 dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="flow-root">
                    <h3 class="text-xl font-semibold dark:text-white">
                        Email Notifications
                    </h3>
                    <p
                        class="text-sm font-normal text-gray-500 dark:text-gray-400"
                    >
                        You can set up Themesberg to get email notifications
                    </p>
                    <div class="divide-y divide-gray-200 dark:divide-gray-700">
                        <!-- Item 1 -->
                        <div class="flex items-center justify-between py-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Rating reminders
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Send an email reminding me to rate an item a
                                    week after purchase
                                </div>
                            </div>
                            <label
                                for="rating-reminders"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="rating-reminders"
                                    class="sr-only"
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                        <!-- Item 2 -->
                        <div class="flex items-center justify-between py-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Item update notifications
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Send user and product notifications for you
                                </div>
                            </div>
                            <label
                                for="item-update"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="item-update"
                                    class="sr-only"
                                    checked
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                        <!-- Item 3 -->
                        <div class="flex items-center justify-between py-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Item comment notifications
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Send me an email when someone comments on
                                    one of my items
                                </div>
                            </div>
                            <label
                                for="item-comment"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="item-comment"
                                    class="sr-only"
                                    checked
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                        <!-- Item 4 -->
                        <div class="flex items-center justify-between pt-4">
                            <div class="flex flex-grow flex-col">
                                <div
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Buyer review notifications
                                </div>
                                <div
                                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                                >
                                    Send me an email when someone leaves a
                                    review with their rating
                                </div>
                            </div>
                            <label
                                for="buyer-rev"
                                class="relative flex cursor-pointer items-center"
                            >
                                <input
                                    type="checkbox"
                                    id="buyer-rev"
                                    class="sr-only"
                                />
                                <span
                                    class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                                ></span>
                            </label>
                        </div>
                    </div>
                    <div class="mt-6">
                        <button
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                            >Save all</button
                        >
                    </div>
                </div>
            </div>
        </div>
    {/if}
{:else}
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
                        src="/example.png"
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
                                    ></path><path d="M9 13h2v5a1 1 0 11-2 0v-5z"
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
        </div>
        <div class="col-span-2">
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
            >
                <h3 class="mb-4 text-xl font-semibold dark:text-white">
                    General information
                </h3>
                <form action="#">
                    <div class="grid grid-cols-6 gap-6">
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="first-name"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >First Name</label
                            >
                            <input
                                type="text"
                                name="first-name"
                                id="first-name"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="Bonnie"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="last-name"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Last Name</label
                            >
                            <input
                                type="text"
                                name="last-name"
                                id="last-name"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="Green"
                                required
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
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="United States"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="city"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >City</label
                            >
                            <input
                                type="text"
                                name="city"
                                id="city"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="e.g. San Francisco"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="address"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Address</label
                            >
                            <input
                                type="text"
                                name="address"
                                id="address"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="e.g. California"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="email"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Email</label
                            >
                            <input
                                type="email"
                                name="email"
                                id="email"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="example@company.com"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="phone-number"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Phone Number</label
                            >
                            <input
                                type="number"
                                name="phone-number"
                                id="phone-number"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="e.g. +(12)3456 789"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="birthday"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Birthday</label
                            >
                            <input
                                type="number"
                                name="birthday"
                                id="birthday"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="15/08/1990"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="organization"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Organization</label
                            >
                            <input
                                type="text"
                                name="organization"
                                id="organization"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="Company Name"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="role"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Role</label
                            >
                            <input
                                type="text"
                                name="role"
                                id="role"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="React Developer"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="department"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Department</label
                            >
                            <input
                                type="text"
                                name="department"
                                id="department"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="Development"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="zip-code"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Zip/postal code</label
                            >
                            <input
                                type="number"
                                name="zip-code"
                                id="zip-code"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="123456"
                                required
                            />
                        </div>
                        <div class="sm:col-full col-span-6">
                            <button
                                class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                                type="submit">Save all</button
                            >
                        </div>
                    </div>
                </form>
            </div>
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
            >
                <h3 class="mb-4 text-xl font-semibold dark:text-white">
                    Password information
                </h3>
                <form action="#">
                    <div class="grid grid-cols-6 gap-6">
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="current-password"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Current password</label
                            >
                            <input
                                type="text"
                                name="current-password"
                                id="current-password"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="password"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >New password</label
                            >
                            <input
                                data-popover-target="popover-password"
                                data-popover-placement="bottom"
                                type="password"
                                id="password"
                                class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <div
                                data-popover
                                id="popover-password"
                                role="tooltip"
                                class="invisible absolute z-10 inline-block w-72 rounded-lg border border-gray-200 bg-white text-sm font-light text-gray-500 opacity-0 shadow-sm transition-opacity duration-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            >
                                <div class="space-y-2 p-3">
                                    <h3
                                        class="font-semibold text-gray-900 dark:text-white"
                                    >
                                        Must have at least 6 characters
                                    </h3>
                                    <div class="grid grid-cols-4 gap-2">
                                        <div
                                            class="h-1 bg-orange-300 dark:bg-orange-400"
                                        ></div>
                                        <div
                                            class="h-1 bg-orange-300 dark:bg-orange-400"
                                        ></div>
                                        <div
                                            class="h-1 bg-gray-200 dark:bg-gray-600"
                                        ></div>
                                        <div
                                            class="h-1 bg-gray-200 dark:bg-gray-600"
                                        ></div>
                                    </div>
                                    <p>It’s better to have:</p>
                                    <ul>
                                        <li class="mb-1 flex items-center">
                                            <svg
                                                class="mr-2 h-4 w-4 text-green-400 dark:text-green-500"
                                                aria-hidden="true"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                                ><path
                                                    fill-rule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clip-rule="evenodd"
                                                ></path></svg
                                            >
                                            Upper & lower case letters
                                        </li>
                                        <li class="mb-1 flex items-center">
                                            <svg
                                                class="mr-2 h-4 w-4 text-gray-300 dark:text-gray-400"
                                                aria-hidden="true"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                                ><path
                                                    fill-rule="evenodd"
                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                    clip-rule="evenodd"
                                                ></path></svg
                                            >
                                            A symbol (#$&)
                                        </li>
                                        <li class="flex items-center">
                                            <svg
                                                class="mr-2 h-4 w-4 text-gray-300 dark:text-gray-400"
                                                aria-hidden="true"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                                ><path
                                                    fill-rule="evenodd"
                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                    clip-rule="evenodd"
                                                ></path></svg
                                            >
                                            A longer password (min. 12 chars.)
                                        </li>
                                    </ul>
                                </div>
                                <div data-popper-arrow></div>
                            </div>
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <label
                                for="confirm-password"
                                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                >Confirm password</label
                            >
                            <input
                                type="text"
                                name="confirm-password"
                                id="confirm-password"
                                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-50 dark:text-white dark:placeholder-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div class="sm:col-full col-span-6">
                            <button
                                class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                                type="submit">Save all</button
                            >
                        </div>
                    </div>
                </form>
            </div>
            <div
                class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="flow-root">
                    <h3 class="text-xl font-semibold dark:text-white">
                        Sessions
                    </h3>
                    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
                        <li class="py-4">
                            <div class="flex items-center space-x-4">
                                <div class="flex-shrink-0">
                                    <svg
                                        class="h-6 w-6 dark:text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        ></path></svg
                                    >
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="truncate text-base font-semibold text-gray-900 dark:text-white"
                                    >
                                        California 123.123.123.123
                                    </p>
                                    <p
                                        class="truncate text-sm font-normal text-gray-500 dark:text-gray-400"
                                    >
                                        Chrome on macOS
                                    </p>
                                </div>
                                <div class="inline-flex items-center">
                                    <a
                                        href="#"
                                        class="focus:ring-primary-300 mb-3 mr-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-50 dark:hover:text-white"
                                        >Revoke</a
                                    >
                                </div>
                            </div>
                        </li>
                        <li class="pb-6 pt-4">
                            <div class="flex items-center space-x-4">
                                <div class="flex-shrink-0">
                                    <svg
                                        class="h-6 w-6 dark:text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        ></path></svg
                                    >
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="truncate text-base font-semibold text-gray-900 dark:text-white"
                                    >
                                        Rome 24.456.355.98
                                    </p>
                                    <p
                                        class="truncate text-sm font-normal text-gray-500 dark:text-gray-400"
                                    >
                                        Safari on iPhone
                                    </p>
                                </div>
                                <div class="inline-flex items-center">
                                    <a
                                        href="#"
                                        class="focus:ring-primary-300 mb-3 mr-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-50 dark:hover:text-white"
                                        >Revoke</a
                                    >
                                </div>
                            </div>
                        </li>
                    </ul>
                    <div>
                        <button
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                            >See more</button
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="grid grid-cols-1 px-4 xl:grid-cols-2 xl:gap-4">
        <div
            class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 xl:mb-0 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="flow-root">
                <h3 class="text-xl font-semibold dark:text-white">
                    Alerts & Notifications
                </h3>
                <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    You can set up Themesberg to get notifications
                </p>
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- Item 1 -->
                    <div class="flex items-center justify-between py-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Company News
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Get Themesberg news, announcements, and product
                                updates
                            </div>
                        </div>
                        <label
                            for="company-news"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="company-news"
                                class="sr-only"
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                    <!-- Item 2 -->
                    <div class="flex items-center justify-between py-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Account Activity
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Get important notifications about you or
                                activity you've missed
                            </div>
                        </div>
                        <label
                            for="account-activity"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="account-activity"
                                class="sr-only"
                                checked
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                    <!-- Item 3 -->
                    <div class="flex items-center justify-between py-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Meetups Near You
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Get an email when a Dribbble Meetup is posted
                                close to my location
                            </div>
                        </div>
                        <label
                            for="meetups"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="meetups"
                                class="sr-only"
                                checked
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                    <!-- Item 4 -->
                    <div class="flex items-center justify-between pt-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                New Messages
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Get Themsberg news, announcements, and product
                                updates
                            </div>
                        </div>
                        <label
                            for="new-messages"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="new-messages"
                                class="sr-only"
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                </div>
                <div class="mt-6">
                    <button
                        class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                        >Save all</button
                    >
                </div>
            </div>
        </div>
        <div
            class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 xl:mb-0 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="flow-root">
                <h3 class="text-xl font-semibold dark:text-white">
                    Email Notifications
                </h3>
                <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    You can set up Themesberg to get email notifications
                </p>
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- Item 1 -->
                    <div class="flex items-center justify-between py-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Rating reminders
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Send an email reminding me to rate an item a
                                week after purchase
                            </div>
                        </div>
                        <label
                            for="rating-reminders"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="rating-reminders"
                                class="sr-only"
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                    <!-- Item 2 -->
                    <div class="flex items-center justify-between py-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Item update notifications
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Send user and product notifications for you
                            </div>
                        </div>
                        <label
                            for="item-update"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="item-update"
                                class="sr-only"
                                checked
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                    <!-- Item 3 -->
                    <div class="flex items-center justify-between py-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Item comment notifications
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Send me an email when someone comments on one of
                                my items
                            </div>
                        </div>
                        <label
                            for="item-comment"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="item-comment"
                                class="sr-only"
                                checked
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                    <!-- Item 4 -->
                    <div class="flex items-center justify-between pt-4">
                        <div class="flex flex-grow flex-col">
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Buyer review notifications
                            </div>
                            <div
                                class="text-base font-normal text-gray-500 dark:text-gray-400"
                            >
                                Send me an email when someone leaves a review
                                with their rating
                            </div>
                        </div>
                        <label
                            for="buyer-rev"
                            class="relative flex cursor-pointer items-center"
                        >
                            <input
                                type="checkbox"
                                id="buyer-rev"
                                class="sr-only"
                            />
                            <span
                                class="toggle-bg h-6 w-11 rounded-full border border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-50"
                            ></span>
                        </label>
                    </div>
                </div>
                <div class="mt-6">
                    <button
                        class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4"
                        >Save all</button
                    >
                </div>
            </div>
        </div>
    </div>
{/if}

<div
    id="confirmModalProfileElem"
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
                    Are you sure you want to update this member?
                </h3>
                <button
                    on:click={handleConfirmYesBtn}
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
    id="deleteModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-md p-4 md:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-[#666666]"
        >
            <button
                type="button"
                class="absolute right-2.5 top-2.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                on:click={() => deleteModal.hide()}
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
            <svg
                class="mx-auto mb-3.5 h-11 w-11 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                ></path></svg
            >
            <p class="mb-4 text-gray-500 dark:text-white">
                Are you sure you want to delete this member?
            </p>
            <div class="flex items-center justify-center space-x-4">
                <button
                    on:click={() => successModal.show()}
                    type="submit"
                    class="rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                >
                    Yes
                </button>
                <button
                    on:click={() => deleteModal.hide()}
                    type="button"
                    class="focus:ring-primary-300 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                >
                    No
                </button>
            </div>
        </div>
    </div>
</div>

<div
    id="successModalProfileElem"
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
