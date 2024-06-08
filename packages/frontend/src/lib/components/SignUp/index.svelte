<script lang="ts">
    import { signUpInputSchema } from '@trpc-subscription/validator/trpc/v1/user'
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { initDropdowns, Modal } from 'flowbite'
    import { afterUpdate, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { ZodIssue } from 'zod'

    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import { trpcClientStoreLegacy } from '$lib/stores.js'
    import countries from '../Country/country.js'
    import CountrySelect from '../Country/CountrySelect.svelte'
    import '/node_modules/flag-icons/css/flag-icons.min.css'

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const trpcClient = trpcClientStoreLegacy()

    // Form Data
    const formData = {
        memberId: '',
        rankId: '',
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
        placerId: '',
        modeOfPayment: '',
        acquisitionMethod: '',
        idPicture: [] as string[],
    }

    let validatedFormData: TRouterInput['user']['signUp']
    let ranks: TRouterOutput['user']['getRanks'] = []

    // Generic
    let setMobilePhCode = countries.find((c) => c.code === 'PH')
    let setMobileCode: Record<string, string> = {
        code: setMobilePhCode?.code ?? '',
        mobileCode: setMobilePhCode?.mobileCode ?? '',
    }

    let modalAccept: Modal
    let modalTermsAndCondition: Modal
    let modalPrivacyPolicy: Modal
    let modalAlert: Modal

    let confirmPassword = ''
    let showPassword = false
    let showConPassword = false
    let imageIdList: string[] = []
    let imageBankDetailsList: string[] = []
    let validateIdPictureType = ''
    let validateBankDetailsPictureType = ''
    let showValidateMessage: Record<string, string> = {}
    let disabledRegisterBtn = true
    let isCheckedTerm = false
    let isCheckedPolicy = false
    let alertMessage = ''

    ///////////////
    // Lifecycle //
    ///////////////

    afterUpdate(() => {
        initDropdowns()
    })

    onMount(async () => {
        modalAccept = new Modal(document.getElementById('modalAcceptElem'), {
            backdrop: 'dynamic',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
            placement: 'center',
        })

        modalTermsAndCondition = new Modal(
            document.getElementById('modalTermsAndConditionElem'),
            {
                backdrop: 'dynamic',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
                placement: 'center',
            },
        )

        modalPrivacyPolicy = new Modal(
            document.getElementById('modalPrivacyPolicyElem'),
            {
                backdrop: 'dynamic',
                backdropClasses:
                    'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
                closable: true,
                onHide: () => {},
                onShow: () => {},
                onToggle: () => {},
                placement: 'center',
            },
        )

        modalAlert = new Modal(document.getElementById('modalAlertElem'), {
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
            placement: 'center',
        })

        ranks = await $trpcClient.user.getRanks.query({
            rankId: 0,
        })
    })

    //////////////
    // Handlers //
    //////////////

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

    const handleRankChange = () => {
        if (formData.rankId) {
            const elemId = document.getElementById('rankId') as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.rankId = ''
        }
    }

    const handlePasswordChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.password = event.currentTarget.value

        if (formData.password) {
            const elemId = document.getElementById(
                'password',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.password = ''
        }
    }

    const handleConfirmPasswordChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        confirmPassword = event.currentTarget.value

        if (confirmPassword) {
            const elemId = document.getElementById(
                'confirmPassword',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.confirmPassword = ''
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
            showValidateMessage.taxIdentificationNumber = ''
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

    const handleCheckBox = () => {
        disabledRegisterBtn = true
        if (isCheckedTerm && isCheckedPolicy) {
            disabledRegisterBtn = false
        }
    }

    const handleModalTermsAndConditionBtn = () => {
        modalTermsAndCondition.show()
    }

    const handleModalPrivacyPolicyBtn = () => {
        modalPrivacyPolicy.show()
    }

    const handleSignUp = async () => {
        const validator = await signUpInputSchema
            .refine(
                (schema) =>
                    schema.password !== ''
                        ? schema.password === confirmPassword
                        : true,
                {
                    message: 'Passwords must match.',
                    path: ['confirmPassword'],
                },
            )
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
                            value: schema.emailAddress,
                        },
                    }),
                    $trpcClient.user.isDataExisting.query({
                        inputSchema: {
                            key: 'mobileNumber',
                            value: schema.mobileNumber,
                        },
                    }),
                    $trpcClient.user.isDataExisting.query({
                        inputSchema: {
                            key: 'taxIdentificationNumber',
                            value: schema.taxIdentificationNumber,
                        },
                    }),
                ]).catch((err) => {
                    alertMessage = `Something went wrong: ${err.message}`
                    modalAlert.show()
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
            modalAccept.show()
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

    const handleModalAcceptBtn = async () => {
        try {
            const response =
                await $trpcClient.user.signUp.mutate(validatedFormData)

            if (response) {
                alertMessage = `You have successfully registered with Member ID: ${response.memberId}\n
                    Please take note your member id and provide proof of payment and valid id upon sign in.`
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            modalAccept.hide()
            modalAlert.show()
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

    const handleModalAcceptCloseBtn = () => {
        modalAccept.hide()
    }

    const handleModalAlertBtn = () => {
        if (alertMessage.includes('You have successfully registered')) {
            goto('/sign-in')
        }
        modalAlert.hide()
    }
</script>

<section class="bg-white dark:bg-[#a6a6a6]">
    <div class="flex items-center justify-center sm:py-8">
        <div
            class="w-full overflow-y-auto sm:max-w-lg sm:rounded-lg sm:shadow md:mt-0 xl:p-0 dark:border dark:border-gray-700 dark:bg-[#ebebed]"
        >
            <div class="space-y-2 p-6 sm:p-8 md:space-y-4">
                <div
                    class="font-base pb-2 text-sm text-gray-500 dark:text-gray-600"
                >
                    Already have an account?
                    <a
                        class="ml-1 text-blue-700 hover:underline dark:text-blue-700"
                        href="/sign-in"
                    >
                        Sign in here.
                    </a>
                </div>
                <h1
                    class="text-center text-lg font-bold leading-tight tracking-tight text-gray-900 md:text-2xl"
                >
                    NEW MEMBER
                </h1>
                <h1
                    class="text-md text-center font-bold leading-tight tracking-tight text-gray-900 md:text-xl"
                >
                    Registration
                </h1>
                <form
                    class="space-y-2 md:space-y-3"
                    method="post"
                    enctype="multipart/form-data"
                    on:submit|preventDefault={handleSignUp}
                >
                    <h1
                        class="text-md font-bold leading-tight tracking-tight text-gray-900 md:text-xl"
                    >
                        [General]
                    </h1>
                    <!-- <div>
                        <label
                            for="memberId"
                            class="block mb-2 text-sm font-medium text-gray-900 "
                        >
                            Member ID
                        </label>
                        <input
                            type="text"
                            name="memberId"
                            id="memberId"
                            maxlength="10"
                            bind:value={formData.memberId}
                            on:input={handleMemberIdChange}
                            class="bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-50 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder=""
                        />
                        {#if showValidateMessage.memberId}
                            <div class="mt-1 flex justify-start items-center">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.memberId}</span
                                >
                            </div>
                        {/if}
                    </div> -->
                    <div>
                        <label
                            for="rankId"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Rank
                        </label>
                        <select
                            id="rankId"
                            name="rankId"
                            bind:value={formData.rankId}
                            on:change={handleRankChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
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
                        {#if showValidateMessage.rankId}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.rankId}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="password"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Password
                        </label>
                        <div class="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                id="password"
                                value={formData.password}
                                on:input={handlePasswordChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                                maxLength={32}
                            />
                            <button
                                type="button"
                                class="pointer-events-auto absolute bottom-2.5 right-2.5"
                                on:click={() => (showPassword = !showPassword)}
                            >
                                {#if showPassword}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-400"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                {:else}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-400"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        </div>
                        {#if showValidateMessage.password}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.password}</span
                                >
                            </div>
                        {:else}
                            <div>
                                <span
                                    class="text-xs font-bold dark:text-gray-400"
                                    >Password must be minimum of 12 characters</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="confirmPassword"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Confirm Password
                        </label>
                        <div class="relative">
                            <input
                                type={showConPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                id="confirmPassword"
                                value={confirmPassword}
                                on:input={handleConfirmPasswordChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                                maxLength={32}
                            />
                            <button
                                type="button"
                                class="pointer-events-auto absolute bottom-2.5 right-2.5"
                                on:click={() =>
                                    (showConPassword = !showConPassword)}
                            >
                                {#if showConPassword}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-400"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                {:else}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-400"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        </div>
                        {#if showValidateMessage.confirmPassword}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.confirmPassword}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <h1
                        class="text-md pt-2 font-bold leading-tight tracking-tight text-gray-900 md:text-xl"
                    >
                        [Personal Information]
                    </h1>
                    <div>
                        <label
                            for="firstName"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            First Name
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            bind:value={formData.firstName}
                            on:input={handleFirstNameChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                        {#if showValidateMessage.firstName}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.firstName}</span
                                >
                            </div>
                        {/if}
                    </div>

                    <div>
                        <label
                            for="middleName"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Middle Name
                        </label>
                        <input
                            type="text"
                            name="middleName"
                            id="middleName"
                            bind:value={formData.middleName}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                    </div>
                    <div>
                        <label
                            for="lastName"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            bind:value={formData.lastName}
                            on:input={handleLastNameChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                        {#if showValidateMessage.lastName}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.lastName}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="suffix"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Suffix
                        </label>
                        <input
                            type="text"
                            name="suffix"
                            id="suffix"
                            bind:value={formData.suffix}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                    </div>
                    <div>
                        <label
                            for="birthdate"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Birthday
                        </label>
                        <input
                            type="date"
                            name="birthdate"
                            id="birthdate"
                            bind:value={formData.birthdate}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                        {#if showValidateMessage.birthdate}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.birthdate}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="gender"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Gender
                        </label>
                        <select
                            id="gender"
                            name="gender"
                            bind:value={formData.gender}
                            on:change={handleGenderChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                        >
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                            <option value="UNSPECIFIED">UNSPECIFIED</option>
                        </select>
                        {#if showValidateMessage.gender}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.gender}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="mobileNumber"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Mobile Number
                        </label>
                        <div class="flex items-center">
                            <button
                                id="dropdown-phone-button"
                                data-dropdown-toggle="dropdown-phone"
                                class="dark:focus:ring-primary-500 z-10 inline-flex flex-shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:hover:bg-gray-600"
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
                                                class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
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
                                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-50 dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                        {#if showValidateMessage.mobileNumber}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.mobileNumber}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <!-- <div>
                        <label
                            for="mobileNumber"
                            class="block mb-2 text-sm font-medium text-gray-900 "
                        >
                            Mobile Number
                        </label>
                        <input
                            type="text"
                            name="mobileNumber"
                            id="mobileNumber"
                            bind:value={mobileNumber}
                            on:input={handleMobileNumberChange}
                            class="bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-50 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder=""
                        />
                        {#if showValidateMessage.mobileNumber}
                            <div class="mt-1 flex justify-start items-center">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.mobileNumber}</span
                                >
                            </div>
                        {/if}
                    </div> -->
                    <div>
                        <label
                            for="emailAddress"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="emailAddress"
                            id="emailAddress"
                            bind:value={formData.emailAddress}
                            on:input={handleEmailAddressChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                        {#if showValidateMessage.emailAddress}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.emailAddress}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="address"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Full Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            bind:value={formData.address}
                            on:input={handleAddressChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                        {#if showValidateMessage.address}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.address}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="tin"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            TIN
                        </label>
                        <input
                            type="text"
                            name="taxIdentificationNumber"
                            id="taxIdentificationNumber"
                            maxlength="12"
                            bind:value={formData.taxIdentificationNumber}
                            on:input={handleTinChange}
                            class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                            placeholder=""
                        />
                        {#if showValidateMessage.taxIdentificationNumber}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.taxIdentificationNumber}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <label
                            for="country"
                            class="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Select Country
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
                                            --field-border-color: rgb(75 85 99);

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
                    <!-- <div>
                        <label
                            for="idPicture"
                            class="block mb-2 text-sm font-medium text-gray-900 "
                        >
                            ID Picture
                        </label>
                        <div class="flex justify-center items-center w-full">
                            <label
                                class="flex flex-col justify-center items-center w-full h-28 bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-400 cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-50"
                                for="idPicture"
                            >
                                <div
                                    class="w-full flex flex-col justify-center items-center py-5"
                                >
                                    {#if imageIdList.length > 0}
                                        <span
                                            class="break-all w-full text-center text-xs text-gray-900 "
                                        >
                                            {#each imageIdList as img}
                                                {img}<br />
                                            {/each}
                                        </span>
                                    {:else}
                                        <svg
                                            class="mb-2 w-10 h-10 text-[#9CA3AF] dark:text-gray-400"
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
                                            class="mb-1 text-sm text-[#6B7280] "
                                        >
                                            <span class="font-semibold"
                                                >Click to upload</span
                                            >
                                            or drag and drop
                                        </p>
                                        <p
                                            class="text-xs text-[#6B7280] "
                                        >
                                            PNG, JPG, JPEG (MAX. 800x400px)
                                        </p>
                                    {/if}

                                    <input
                                        id="idPicture"
                                        name="idPicture"
                                        class="hidden"
                                        type="file"
                                        accept="image/jpeg, image/jpg, image/png"
                                        multiple
                                        on:change={handleIdPictureFile}
                                    />
                                </div>
                            </label>
                        </div>
                        {#if validateIdPictureType}
                            <div class="mt-1 flex justify-start items-center">
                                <span class="text-sm font-bold text-red-500"
                                    >{validateIdPictureType}</span
                                >
                            </div>
                        {/if}
                    </div> -->
                    <h1
                        class="text-md pt-4 font-bold leading-tight tracking-tight text-gray-900 md:text-xl"
                    >
                        [One-Marketing]
                    </h1>
                    <label
                        for="introducerId"
                        class="mb-2 block text-sm font-medium text-gray-900"
                    >
                        Introducer ID
                    </label>
                    <div>
                        <div class="flex items-center justify-between">
                            <input
                                type="text"
                                name="introducerId"
                                id="introducerId"
                                maxlength="10"
                                bind:value={formData.introducerId}
                                on:input={handleIntroducerIdChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                                placeholder=""
                            />
                        </div>
                        {#if showValidateMessage.introducerId}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.introducerId}</span
                                >
                            </div>
                        {/if}
                    </div>

                    <label
                        for="placerId"
                        class="mb-2 block text-sm font-medium text-gray-900"
                    >
                        Placement ID
                    </label>
                    <div>
                        <div class="flex items-center justify-between">
                            <input
                                type="text"
                                name="placerId"
                                id="placerId"
                                maxlength="10"
                                bind:value={formData.placerId}
                                on:input={handlePlacerIdChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:placeholder-gray-400"
                                placeholder=""
                            />
                        </div>
                        {#if showValidateMessage.placerId}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.placerId}</span
                                >
                            </div>
                        {/if}
                    </div>

                    <h1
                        class="text-md pt-4 font-bold leading-tight tracking-tight text-gray-900 md:text-xl"
                    >
                        [Payment]
                    </h1>
                    <div>
                        <div class="items-center">
                            <label
                                for="modeOfPayment"
                                class="mb-2 block w-full text-sm font-medium text-gray-900 sm:mb-0 sm:w-56"
                            >
                                Mode of Payment
                            </label>
                            <div
                                class="mt-2 grid w-full grid-cols-2 items-center space-y-2"
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
                                        class="sm:ml:0 ml-1 mr-5 text-gray-900"
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
                                        class="sm:ml:0 ml-1 mr-5 text-gray-900"
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
                                        class="sm:ml:0 ml-1 text-gray-900"
                                        >E-Wallet</label
                                    >
                                </div>
                            </div>
                        </div>
                        {#if showValidateMessage.modeOfPayment}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.modeOfPayment}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div class="items-center pt-1">
                        <label
                            for="modeOfPayment"
                            class="mb-2 block w-full text-sm font-medium text-gray-900 sm:mb-0 sm:w-56"
                        >
                            Acquisition Method
                        </label>
                        <div
                            class="mt-2 grid w-full grid-cols-2 items-center space-y-2"
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
                                    class="sm:ml:0 ml-1 text-gray-900"
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
                                    class="sm:ml:0 ml-1 text-gray-900"
                                    >Delivery</label
                                >
                            </div>
                        </div>
                        {#if showValidateMessage.acquisitionMethod}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.acquisitionMethod}</span
                                >
                            </div>
                        {/if}
                    </div>
                    <div>
                        <div class="flex items-center justify-center pt-4">
                            <h5
                                class="leading-tight tracking-tight text-gray-900 md:text-lg"
                            >
                                <a
                                    href="#"
                                    class="font-medium text-blue-600 hover:underline dark:text-blue-600"
                                    >I agree with the terms and condition</a
                                >
                            </h5>
                            <div class="flex h-5 items-center">
                                <input
                                    id="termsCondition"
                                    name="termsCondition"
                                    aria-describedby="termsCondition"
                                    type="checkbox"
                                    bind:checked={isCheckedTerm}
                                    on:change={handleCheckBox}
                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-600 ml-2.5 h-4 w-4 rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div
                            class="flex items-center justify-center pt-2 sm:pt-0"
                        >
                            <h5
                                class="leading-tight tracking-tight text-gray-900 md:text-lg"
                            >
                                <a
                                    href="#"
                                    class="font-medium text-blue-600 hover:underline dark:text-blue-600"
                                    >I agree with the privacy policy</a
                                >
                            </h5>
                            <div class="flex h-5 items-center">
                                <input
                                    id="privatePolicy"
                                    name="=privatePolicy"
                                    aria-describedby="privatePolicy"
                                    type="checkbox"
                                    bind:checked={isCheckedPolicy}
                                    on:change={handleCheckBox}
                                    class="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-600 ml-2.5 h-4 w-4 rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-50 dark:ring-offset-gray-800"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="py-4">
                        <button
                            id="registerBtn"
                            type="submit"
                            disabled={disabledRegisterBtn}
                            class="{disabledRegisterBtn
                                ? 'bg-primary-400 dark:bg-primary-500 cursor-not-allowed border border-gray-500 text-white'
                                : 'bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700 border border-gray-500'} focus:ring-primary-300 dark:focus:ring-primary-800 w-full rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                            >Register</button
                        >
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>

<div
    id="modalAcceptElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full overflow-y-auto overflow-x-hidden p-4 md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md">
        <div
            class="relative rounded-lg border border-gray-500 bg-white shadow dark:bg-gray-50"
        >
            <div class="p-6 text-center">
                <h3 class="mb-5 text-lg font-normal text-gray-500">
                    I hereby confirm that all information are true, complete,
                    and correct.
                    <p>and</p>
                    I understand that the One - Marketing placement cannot be change
                    once this application is processed
                </h3>
                <button
                    on:click={handleModalAcceptBtn}
                    id="acceptBtn"
                    type="button"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 w-[87px] rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Accept
                </button>
                <button
                    on:click={handleModalAcceptCloseBtn}
                    id="closeBtn"
                    type="button"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 w-[87px] rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Back
                </button>
            </div>
        </div>
    </div>
</div>

<div
    id="modalTermsAndConditionElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full overflow-y-auto overflow-x-hidden p-4 md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md">
        <div
            class="border-custom-gold-1 relative rounded-lg border bg-white from-neutral-700 via-neutral-900 to-neutral-700 shadow dark:bg-gradient-to-tl"
        >
            <div class="p-6 text-center">
                <h3 class="mb-5 text-lg font-normal text-gray-500">
                    I hereby confirm that all information are true, complete,
                    and correct.
                    <p>and</p>
                    I understand that the One - Marketing placement cannot be change
                    once this application is processed
                </h3>
                <button
                    on:click={handleModalTermsAndConditionBtn}
                    id="acceptBtn"
                    type="button"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Accept
                </button>
            </div>
        </div>
    </div>
</div>

<div
    id="modalPrivacyPolicyElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full overflow-y-auto overflow-x-hidden p-4 md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md">
        <div
            class="border-custom-gold-1 relative rounded-lg border bg-white from-neutral-700 via-neutral-900 to-neutral-700 shadow dark:bg-gradient-to-tl"
        >
            <div class="p-6 text-center">
                <h3 class="mb-5 text-lg font-normal text-gray-500">
                    I hereby confirm that all information are true, complete,
                    and correct.
                    <p>and</p>
                    I understand that the One - Marketing placement cannot be change
                    once this application is processed
                </h3>
                <button
                    on:click={handleModalPrivacyPolicyBtn}
                    id="acceptBtn"
                    type="button"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Accept
                </button>
            </div>
        </div>
    </div>
</div>

<div
    id="modalAlertElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full overflow-y-auto overflow-x-hidden p-4 md:inset-0"
>
    <div class="relative max-h-full w-full max-w-lg">
        <div
            class="relative rounded-lg border border-gray-500 bg-white shadow dark:bg-gray-50"
        >
            <div class="flex justify-center p-6 text-center">
                <svg
                    class="h-12 w-12 text-gray-800"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
                    />
                </svg>
            </div>
            <div class="px-6">
                <h3 class="text-center text-lg font-normal text-gray-500">
                    {alertMessage}
                </h3>
            </div>
            <div class="flex justify-center p-6 text-center">
                <button
                    on:click={handleModalAlertBtn}
                    id="acceptBtn"
                    type="button"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 w-[87px] rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    OK
                </button>
            </div>
        </div>
    </div>
</div>
