<script lang="ts">
    import { signUpInputSchema } from '@trpc-subscription/validator/trpc/v1/user'
    import type { TRPCError } from '@trpc/server'
    import dayjs from 'dayjs'
    import { initDropdowns, Modal, Tabs } from 'flowbite'
    import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { ZodIssue } from 'zod'

    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'

    ////////////////////
    // Initialization //
    ////////////////////

    export let isAdd: boolean
    const dispatch = createEventDispatcher()
    const closeModal = () => dispatch('close')

    // Modal
    let confirmModal: Modal
    let successModal: Modal
    let deleteModal: Modal

    // Form Data
    const formData = {
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
        placerId: '',
        modeOfPayment: '',
        acquisitionMethod: '',
        productImages: [] as string[],
    }

    let validatedFormData: TRouterInput['user']['signUp']
    let confirmPassword = ''
    let showPassword = false
    let showConPassword = false
    let imageIdList: string[] = []
    let imageBankDetailsList: string[] = []
    let validateIdPictureType = ''
    let validateBankDetailsPictureType = ''
    let showValidateMessage: Record<string, string> = {}
    let isDelete = false
    const isWeb = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////
    afterUpdate(() => {
        initDropdowns()
    })

    onMount(() => {
        confirmModal = new Modal(document.getElementById('confirmModalElem'), {
            placement: 'bottom-right',
            backdrop: 'dynamic',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

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

        successModal = new Modal(document.getElementById('successModalElem'), {
            placement: 'bottom-right',
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })
    })

    //////////////
    // Handlers //
    //////////////

    const handleProductImgFile: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
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
                    formData.productImages = [
                        ...formData.productImages,
                        fileReader.result as string,
                    ]
                })
                fileReader.readAsDataURL(files.item(i)!)

                imageIdList = [
                    ...imageIdList,
                    fileName,
                ]
            }
        }
    }

    const handleDeleteImg = (index: number) => {
        formData.productImages.splice(index, 1)
        const newList = formData.productImages
        formData.productImages = newList
    }
</script>

{#if isWeb}
    <div class="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
            <label
                for="name"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >Name</label
            >
            <input
                type="text"
                name="name"
                id="name"
                class="focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Type product name"
                required
            />
        </div>
        <div>
            <label
                for="category"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >Category</label
            >
            <select
                id="category"
                name="category"
                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            >
                <option
                    value=""
                    disabled
                    selected>Category</option
                >
                <option value="PC">PC</option>
            </select>
        </div>
        <div>
            <label
                for="brand"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >Brand</label
            >
            <input
                type="text"
                name="brand"
                id="brand"
                class="focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder=""
                readonly
            />
        </div>
        <div>
            <label
                for="price"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >Price</label
            >
            <input
                type="text"
                name="price"
                id="price"
                class="focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="0"
                required
            />
        </div>
        <div class="sm:col-span-2">
            <label
                for="description"
                class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >Description</label
            >
            <textarea
                id="description"
                name="description"
                rows="4"
                class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Write product description here"
            ></textarea>
        </div>
    </div>
    <div class="mb-4">
        <label
            for="newsPromotionImgs"
            class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        >
            Product Images
        </label>
        {#if formData.productImages.length > 0}
            <div class="mb-2">
                <div class="rounded-lg border border-gray-200 p-2 pt-2 shadow">
                    <div class="flex flex-row gap-2 overflow-x-auto">
                        {#each formData.productImages as imgSrc, i}
                            <div
                                class="border-0.5 relative h-32 w-32 rounded-lg bg-neutral-100"
                            >
                                {#if imgSrc}
                                    <img
                                        src={imgSrc}
                                        class="h-full w-full rounded-lg"
                                    />
                                    <button
                                        class="absolute right-0.5 top-0.5 rounded-full bg-white p-1"
                                        type="button"
                                        on:click={() => handleDeleteImg(i)}
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
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
        <div class="flex w-full items-center justify-center">
            <label
                class="dark:hover:bg-bray-800 flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-100 dark:bg-gray-700"
                for="newsPromotionImgs"
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
                    <p class="mb-1 text-sm text-[#6B7280] dark:text-white">
                        <span class="font-semibold">Click to upload</span>
                        or drag and drop
                    </p>
                    <p class="text-xs text-[#6B7280] dark:text-white">
                        PNG, JPG, JPEG (MAX. 800x400px)
                    </p>

                    <input
                        id="newsPromotionImgs"
                        name="newsPromotionImgs"
                        class="hidden"
                        type="file"
                        accept="image/jpeg, image/jpg, image/png"
                        multiple
                        on:change={handleProductImgFile}
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
        {/if}
    </div>
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
            <button
                type="button"
                on:click={() => {
                    isDelete = false
                    confirmModal.show()
                }}
                class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
            >
                {isAdd ? 'Add new product' : 'Update product'}
            </button>

            <button
                type="button"
                on:click={() => {
                    isDelete = true
                    deleteModal.show()
                }}
                class="{isAdd
                    ? 'hidden'
                    : ''} inline-flex items-center rounded-lg border border-red-600 px-5 py-2.5 text-center text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
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
                Delete
            </button>
        </div>
        <div>
            <button
                on:click={closeModal}
                type="button"
                class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                >Cancel</button
            >
        </div>
    </div>
{/if}

<div
    id="confirmModalElem"
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
                    Are you sure you want to {isAdd ? 'add' : 'update'} this product?
                </h3>
                <button
                    on:click={() => successModal.show()}
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
            class="relative rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-gray-800"
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
            <p class="mb-4 text-gray-500 dark:text-gray-300">
                Are you sure you want to delete this product?
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
    id="successModalElem"
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
                {#if isDelete}
                    Product successfully deleted.
                {:else}
                    Product successfully {isAdd ? 'added' : 'updated'}.
                {/if}
            </p>
            <button
                type="button"
                on:click={() => {
                    closeModal()
                    confirmModal.hide()
                    deleteModal.hide()
                    successModal.hide()
                }}
                class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:focus:ring-primary-900 rounded-lg px-3 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
            >
                Continue
            </button>
        </div>
    </div>
</div>
