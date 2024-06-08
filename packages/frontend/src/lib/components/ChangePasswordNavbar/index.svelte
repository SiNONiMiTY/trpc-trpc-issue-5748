<script lang="ts">
    import { updatePasswordInputSchema } from '@trpc-subscription/validator/trpc/v1/user'
    import type { TRPCError } from '@trpc/server'
    import { Modal } from 'flowbite'
    import { createEventDispatcher, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { ZodIssue } from 'zod'

    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'

    ////////////////////
    // Initialization //
    ////////////////////

    const dispatch = createEventDispatcher()
    const closeModal = () => dispatch('close')

    // Custom Stores
    const sessionData = sessionDataStore()
    const trpcClient = trpcClientStoreLegacy()

    // Modal
    let confirmModalPasswordNavbar: Modal
    let successModalPassword: Modal

    // Form Data
    export const formData = {
        userId: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    }

    let validatedPasswordData: TRouterInput['user']['updatePassword']
    let showOldPassword = false
    let showNewPassword = false
    let showConPassword = false
    let showValidateMessage: Record<string, string> = {}
    let alertMessage = ''
    const isWeb = true
    const isAdmin = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////

    onMount(() => {
        confirmModalPasswordNavbar = new Modal(
            document.getElementById(
                `confirmModalPasswordNavbarElem${formData.userId}`,
            ),
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

        successModalPassword = new Modal(
            document.getElementById(
                `successModalPasswordElem${formData.userId}`,
            ),
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
    })

    //////////////
    // Handlers //
    //////////////

    const handleOldPasswordChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.oldPassword = event.currentTarget.value

        if (formData.oldPassword) {
            const elemId = document.getElementById(
                'newPassword',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.oldPassword = ''
        }
    }

    const handlePasswordChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.newPassword = event.currentTarget.value

        if (formData.newPassword) {
            const elemId = document.getElementById(
                'newPassword',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.newPassword = ''
        }
    }

    const handleConfirmPasswordChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        formData.confirmPassword = event.currentTarget.value

        if (formData.confirmPassword) {
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

    const handleUpdateBtn1 = async () => {
        const validatorPassword = await updatePasswordInputSchema
            .refine(
                (schema) =>
                    schema.newPassword !== ''
                        ? schema.newPassword === formData.confirmPassword
                        : true,
                {
                    message: 'Passwords must match.',
                    path: ['confirmPassword'],
                },
            )
            .safeParseAsync({
                ...formData,
            })

        if (validatorPassword.success) {
            validatedPasswordData = validatorPassword.data
            confirmModalPasswordNavbar.show()
        } else {
            showValidateMessage = {}
            validatorPassword.error.issues.forEach((key, index) => {
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

    const handleConfirmYesBtn = async () => {
        try {
            const response = await $trpcClient.user.updatePassword.mutate(
                validatedPasswordData,
            )

            if (response) {
                alertMessage = 'You have successfully change password.'
                clearInput()
            } else {
                alertMessage = 'Something went wrong. Please try again.'
            }

            successModalPassword.show()
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

    export function clearInput() {
        formData.oldPassword = ''
        formData.newPassword = ''
        formData.confirmPassword = ''
        showValidateMessage = {}
    }

    const handleSuccessContinueBtn = () => {
        closeModal()
        confirmModalPasswordNavbar.hide()
        successModalPassword.hide()
    }
</script>

<div>
    <form
        class="mt-4 space-y-4 md:space-y-5 lg:mt-5"
        action="post"
        on:submit|preventDefault={handleUpdateBtn1}
    >
        <div>
            <label
                for="oldPassword"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
            >
                Current Password
            </label>
            <div class="relative">
                <input
                    type={showOldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    id="oldPassword"
                    value={formData.oldPassword}
                    on:input={handleOldPasswordChange}
                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                    maxLength={32}
                />
                <button
                    type="button"
                    class="pointer-events-auto absolute bottom-2.5 right-2.5"
                    on:click={() => (showOldPassword = !showOldPassword)}
                >
                    {#if showOldPassword}
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
        </div>
        <div>
            <label
                for="newPassword"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
            >
                New Password
            </label>
            <div class="relative">
                <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    id="newPassword"
                    value={formData.newPassword}
                    on:input={handlePasswordChange}
                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                    maxLength={32}
                />
                <button
                    type="button"
                    class="pointer-events-auto absolute bottom-2.5 right-2.5"
                    on:click={() => (showNewPassword = !showNewPassword)}
                >
                    {#if showNewPassword}
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
            {#if showValidateMessage.newPassword}
                <div class="mt-1 flex items-center justify-start">
                    <span class="text-sm font-bold text-red-500"
                        >{showValidateMessage.newPassword}</span
                    >
                </div>
            {:else}
                <div>
                    <span class="text-xs font-bold dark:text-gray-400"
                        >Password must be minimum of 12 characters and should
                        contain numbers, lowercase & UPPERCASE letters.</span
                    >
                </div>
            {/if}
        </div>
        <div>
            <label
                for="confirmPassword"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
            >
                Re-type new Password
            </label>
            <div class="relative">
                <input
                    type={showConPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    on:input={handleConfirmPasswordChange}
                    class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-50 dark:text-gray-900 dark:placeholder-gray-400"
                    maxLength={32}
                />
                <button
                    type="button"
                    class="pointer-events-auto absolute bottom-2.5 right-2.5"
                    on:click={() => (showConPassword = !showConPassword)}
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
        <button
            type="submit"
            class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 w-full rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
            >Save new password</button
        >
    </form>
</div>

<div
    id="confirmModalPasswordNavbarElem{formData.userId}"
    tabindex="-1"
    class="modal modal fixed left-0 right-0 top-0 hidden h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
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
                    Are you sure you want to save new password?
                </h3>
                <button
                    on:click={handleConfirmYesBtn}
                    type="button"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmModalPasswordNavbar.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="successModalPasswordElem{formData.userId}"
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
    .modal {
        z-index: 1200 !important;
    }
</style>
