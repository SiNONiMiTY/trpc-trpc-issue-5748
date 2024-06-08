<script lang="ts">
    import { Modal, initDropdowns, type Drawer } from 'flowbite'
    import { onMount } from 'svelte'

    import { goto } from '$app/navigation'
    import ChangePasswordNavbar from '$lib/components/ChangePasswordNavbar/index.svelte'
    import {
        sessionDataStore,
        trpcClientStore,
        trpcClientStoreLegacy,
    } from '$lib/stores.js'

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const sessionData = sessionDataStore()
    const trpcClient = trpcClientStoreLegacy()

    // Properties
    export let drawerElement: Drawer

    // Generic
    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    let totalWallet = '0.00'
    let isWeb = true
    let changePasswordModal: Modal
    let changePass: ChangePasswordNavbar

    ///////////////
    // Lifecycle //
    ///////////////

    onMount(async () => {
        initDropdowns()

        changePasswordModal = new Modal(
            document.getElementById('changePasswordModalElem'),
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

        totalWallet = numberFormatter.format(
            (
                await $trpcClient.wallet.getWalletBalance.query({
                    userId: $sessionData?.userId || '',
                })
            ).TotalPoints,
        )
    })

    //////////////
    // Handlers //
    //////////////

    const showDropDownList = () => {
        const elemId = document.getElementById(
            'user-menu-dropdown',
        ) as HTMLElement

        if (elemId) {
            elemId.classList.remove('hidden')
        }
    }

    const hideDropDownList = () => {
        const elemId = document.getElementById(
            'user-menu-dropdown',
        ) as HTMLElement

        if (elemId) {
            elemId.classList.add('hidden')
        }
    }

    const handleSignOutClick = async () => {
        try {
            await $trpcClientStore.user.signOut.mutate({
                sessionId: $sessionData?.sessionId || '',
            })
        } catch (err) {
            /* EMPTY */
        }

        localStorage.removeItem('session_data')

        setTimeout(() => {
            goto('/sign-in', { replaceState: true })
        }, 1000)
    }

    const handleThemeToggleClick = () => {
        switch (localStorage.getItem('color-theme')?.toLowerCase()) {
            case 'light': {
                document.documentElement.classList.add('dark')
                localStorage.setItem('color-theme', 'dark')
                break
            }
            default: {
                document.documentElement.classList.remove('dark')
                localStorage.setItem('color-theme', 'light')
            }
        }
    }

    const changePassword = () => {
        changePass.formData.userId = `${$sessionData?.userId}`
        changePass.clearInput()
        hideDropDownList()
        changePasswordModal.show()
    }
</script>

{#if isWeb}
    {#if !$sessionData?.isVerified && [0, 8].includes(Number($sessionData?.rbacFlag))}
        <div
            id="sticky-banner"
            tabindex="-1"
            class="fixed top-0 z-50 flex w-full justify-between border-b border-neutral-300 bg-gray-50 p-4 dark:border-neutral-600 dark:bg-neutral-700"
        >
            <div class="mx-auto flex flex-wrap items-center">
                <div
                    class="flex items-center text-center text-base text-xs font-medium text-neutral-800 lg:text-left lg:text-base dark:text-neutral-300"
                >
                    <span
                        class="me-3 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 p-1 dark:bg-gray-600"
                    >
                        <svg
                            class="h-3 w-3 text-gray-500 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 18 19"
                        >
                            <path
                                d="M15 1.943v12.114a1 1 0 0 1-1.581.814L8 11V5l5.419-3.871A1 1 0 0 1 15 1.943ZM7 4H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V4ZM4 17v-5h1v5H4ZM16 5.183v5.634a2.984 2.984 0 0 0 0-5.634Z"
                            />
                        </svg>
                        <span class="sr-only">Light bulb</span>
                    </span>
                    <span
                        >Please upload proof of payment and valid ID to verify
                        your account.
                        <a
                            href="/app/user-settings"
                            class="decoration-600 dark:decoration-500 inline font-medium text-blue-600 underline decoration-solid underline-offset-2 hover:no-underline dark:text-blue-600"
                            >Click Here</a
                        ></span
                    >
                </div>
            </div>
        </div>
    {/if}
    <nav
        class="{$sessionData?.isVerified
            ? 'mt-0'
            : 'mt-[57px]'} fixed z-50 w-full border-b border-neutral-300 bg-white px-4 py-2.5 lg:px-6 dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="flex flex-wrap items-center justify-between">
            <div class="flex items-center justify-between">
                <button
                    on:click={() => drawerElement.toggle()}
                    aria-controls="logo-sidebar"
                    type="button"
                    class="dark:text-sveltekit-sh5 dark:hover:bg-sveltekit-sh1 dark:focus:ring-sveltekit-sh1 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden"
                >
                    <span class="sr-only">Open sidebar</span>
                    <svg
                        class="h-6 w-6"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                        >
                        </path>
                    </svg>
                </button>

                <a
                    href="https://flowbite.com"
                    class="flex hidden lg:inline-flex"
                >
                    <div
                        class="h-8 w-36 bg-[url('/image/navbar-logo.png')] bg-cover bg-center bg-no-repeat bg-blend-multiply dark:bg-[url('/image/navbar-logo-dark.png')]"
                    ></div>
                    <!-- <img
                        src="/image/navbar-logo.png"
                        class="h-10 w-56"
                        alt="trpc-subscription Header"
                    /> -->
                </a>
            </div>
            <div class="flex items-center lg:order-2">
                <div class="flex px-6 py-0.5">
                    <h1
                        class="text-center text-sm font-bold text-neutral-600 dark:text-neutral-300"
                    >
                        {$sessionData?.rbacFlag === 1 ? 'Wallet' : 'Points'} :
                        <span id="navwalletplayer">
                            {totalWallet}
                        </span>
                    </h1>
                </div>
                <!-- Notifications -->
                <!-- <button
                    type="button"
                    data-dropdown-toggle="notification-dropdown"
                    class="mr-2 p-0.5 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-600 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-zinc-300"
                >
                    <span class="sr-only">View notifications</span>
                    <svg
                        class="h-5 w-5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 14 20"
                        ><path
                            d="M12.133 10.632v-1.8A5.406 5.406 0 0 0 7.979 3.57.946.946 0 0 0 8 3.464V1.1a1 1 0 0 0-2 0v2.364a.946.946 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C1.867 13.018 0 13.614 0 14.807 0 15.4 0 16 .538 16h12.924C14 16 14 15.4 14 14.807c0-1.193-1.867-1.789-1.867-4.175ZM3.823 17a3.453 3.453 0 0 0 6.354 0H3.823Z"
                        /></svg
                    >
                </button> -->
                <!-- Dropdown menu -->
                <!-- <div
                    class="hidden overflow-hidden z-50 my-4 max-w-sm text-base list-none bg-white rounded divide-y divide-gray-100 shadow-lg"
                    id="notification-dropdown"
                >
                    <div
                        class="block py-2 px-4 text-base font-medium text-center text-gray-700 bg-gray-50 dark:text-gray-400"
                    >
                        Notifications
                    </div>
                    <div>
                        <a
                            href="#"
                            class="flex py-3 px-4 border-b hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <div class="flex-shrink-0">
                                <img
                                    class="h-11 w-11 rounded-full"
                                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/bonnie-green.png"
                                    alt="Bonnie Green avatar"
                                />
                                <div
                                    class="bg-primary-700 absolute -mt-5 ml-6 flex h-5 w-5 items-center justify-center rounded-full border border-white dark:border-gray-700"
                                >
                                    <svg
                                        class="h-2 w-2 text-white"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 18 18"
                                        ><path
                                            d="M15.977.783A1 1 0 0 0 15 0H3a1 1 0 0 0-.977.783L.2 9h4.239a2.99 2.99 0 0 1 2.742 1.8 1.977 1.977 0 0 0 3.638 0A2.99 2.99 0 0 1 13.561 9H17.8L15.977.783ZM6 2h6a1 1 0 1 1 0 2H6a1 1 0 0 1 0-2Zm7 5H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Z"
                                        /><path
                                            d="M1 18h16a1 1 0 0 0 1-1v-6h-4.439a.99.99 0 0 0-.908.6 3.978 3.978 0 0 1-7.306 0 .99.99 0 0 0-.908-.6H0v6a1 1 0 0 0 1 1Z"
                                        /></svg
                                    >
                                </div>
                            </div>
                            <div class="w-full pl-3">
                                <div
                                    class="mb-1.5 text-sm font-normal text-gray-500 dark:text-gray-400"
                                >
                                    New message from <span
                                        class="font-semibold text-gray-900 dark:text-white"
                                        >Bonnie Green</span
                                    >: "Hey, what's up? All set for the
                                    presentation?"
                                </div>
                                <div
                                    class="text-primary-700 dark:text-primary-400 text-xs font-medium"
                                >
                                    a few moments ago
                                </div>
                            </div>
                        </a>
                        <a
                            href="#"
                            class="flex py-3 px-4 border-b hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <div class="flex-shrink-0">
                                <img
                                    class="h-11 w-11 rounded-full"
                                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/jese-leos.png"
                                    alt="Jese Leos avatar"
                                />
                                <div
                                    class="absolute -mt-5 ml-6 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-gray-900 dark:border-gray-700"
                                >
                                    <svg
                                        class="h-2 w-2 text-white"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 20 18"
                                        ><path
                                            d="M6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Zm11-3h-2V5a1 1 0 0 0-2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 0 0 2 0V9h2a1 1 0 1 0 0-2Z"
                                        /></svg
                                    >
                                </div>
                            </div>
                            <div class="w-full pl-3">
                                <div
                                    class="mb-1.5 text-sm font-normal text-gray-500 dark:text-gray-400"
                                >
                                    <span
                                        class="font-semibold text-gray-900 dark:text-white"
                                        >Jese leos</span
                                    >
                                    and
                                    <span
                                        class="font-medium text-gray-900 dark:text-white"
                                        >5 others</span
                                    > started following you.
                                </div>
                                <div
                                    class="text-primary-700 dark:text-primary-400 text-xs font-medium"
                                >
                                    10 minutes ago
                                </div>
                            </div>
                        </a>
                        <a
                            href="#"
                            class="flex py-3 px-4 border-b hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <div class="flex-shrink-0">
                                <img
                                    class="h-11 w-11 rounded-full"
                                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/joseph-mcfall.png"
                                    alt="Joseph McFall avatar"
                                />
                                <div
                                    class="absolute -mt-5 ml-6 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-red-600 dark:border-gray-700"
                                >
                                    <svg
                                        class="h-2 w-2 text-white"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 20 18"
                                    >
                                        <path
                                            d="M17.947 2.053a5.209 5.209 0 0 0-3.793-1.53A6.414 6.414 0 0 0 10 2.311 6.482 6.482 0 0 0 5.824.5a5.2 5.2 0 0 0-3.8 1.521c-1.915 1.916-2.315 5.392.625 8.333l7 7a.5.5 0 0 0 .708 0l7-7a6.6 6.6 0 0 0 2.123-4.508 5.179 5.179 0 0 0-1.533-3.793Z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div class="w-full pl-3">
                                <div
                                    class="mb-1.5 text-sm font-normal text-gray-500 dark:text-gray-400"
                                >
                                    <span
                                        class="font-semibold text-gray-900 dark:text-white"
                                        >Joseph Mcfall</span
                                    >
                                    and
                                    <span
                                        class="font-medium text-gray-900 dark:text-white"
                                        >141 others</span
                                    > love your story. See it and view more stories.
                                </div>
                                <div
                                    class="text-primary-700 dark:text-primary-400 text-xs font-medium"
                                >
                                    44 minutes ago
                                </div>
                            </div>
                        </a>
                        <a
                            href="#"
                            class="flex py-3 px-4 border-b hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <div class="flex-shrink-0">
                                <img
                                    class="h-11 w-11 rounded-full"
                                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/roberta-casas.png"
                                    alt="Roberta Casas image"
                                />
                                <div
                                    class="absolute -mt-5 ml-6 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-green-400 dark:border-gray-700"
                                >
                                    <svg
                                        class="h-2 w-2 text-white"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 20 18"
                                        ><path
                                            d="M18 0H2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2v4a1 1 0 0 0 1.707.707L10.414 13H18a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5 4h2a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2ZM5 4h5a1 1 0 1 1 0 2H5a1 1 0 0 1 0-2Zm2 5H5a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Zm9 0h-6a1 1 0 0 1 0-2h6a1 1 0 1 1 0 2Z"
                                        /></svg
                                    >
                                </div>
                            </div>
                            <div class="w-full pl-3">
                                <div
                                    class="mb-1.5 text-sm font-normal text-gray-500 dark:text-gray-400"
                                >
                                    <span
                                        class="font-semibold text-gray-900 dark:text-white"
                                        >Leslie Livingston</span
                                    >
                                    mentioned you in a comment:
                                    <span
                                        class="text-primary-700 dark:text-primary-500 font-medium"
                                        >@bonnie.green</span
                                    > what do you say?
                                </div>
                                <div
                                    class="text-primary-700 dark:text-primary-400 text-xs font-medium"
                                >
                                    1 hour ago
                                </div>
                            </div>
                        </a>
                        <a
                            href="#"
                            class="flex px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <div class="flex-shrink-0">
                                <img
                                    class="h-11 w-11 rounded-full"
                                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/robert-brown.png"
                                    alt="Robert image"
                                />
                                <div
                                    class="absolute -mt-5 ml-6 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-purple-500 dark:border-gray-700"
                                >
                                    <svg
                                        class="h-2 w-2 text-white"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 20 14"
                                        ><path
                                            d="M11 0H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm8.585 1.189a.994.994 0 0 0-.9-.138l-2.965.983a1 1 0 0 0-.685.949v8a1 1 0 0 0 .675.946l2.965 1.02a1.013 1.013 0 0 0 1.032-.242A1 1 0 0 0 20 12V2a1 1 0 0 0-.415-.811Z"
                                        /></svg
                                    >
                                </div>
                            </div>
                            <div class="w-full pl-3">
                                <div
                                    class="mb-1.5 text-sm font-normal text-gray-500 dark:text-gray-400"
                                >
                                    <span
                                        class="font-semibold text-gray-900 dark:text-white"
                                        >Robert Brown</span
                                    > posted a new video: Glassmorphism - learn how
                                    to implement the new design trend.
                                </div>
                                <div
                                    class="text-primary-700 dark:text-primary-400 text-xs font-medium"
                                >
                                    3 hours ago
                                </div>
                            </div>
                        </a>
                    </div>
                    <a
                        href="#"
                        class="block py-2 text-base font-medium text-center text-gray-900 bg-gray-50 hover:bg-gray-100"
                    >
                        <div class="inline-flex items-center">
                            <svg
                                aria-hidden="true"
                                class="mr-2 h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"
                                ></path><path
                                    fill-rule="evenodd"
                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clip-rule="evenodd"
                                ></path></svg
                            >
                            View all
                        </div>
                    </a>
                </div> -->
                <!-- <button
                    id="theme-toggle"
                    data-tooltip-target="tooltip-toggle"
                    type="button"
                    class="rounded-lg p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-4 focus:ring-gray-300 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-zinc-300"
                    on:click={handleThemeToggleClick}
                >
                    <svg
                        id="theme-toggle-dark-icon"
                        class="h-5 w-5 dark:hidden"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        ><path
                            d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                        ></path></svg
                    >
                    <svg
                        id="theme-toggle-light-icon"
                        class="hidden h-5 w-5 dark:block"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        ><path
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                        ></path></svg
                    >
                </button>
                <div
                    id="tooltip-toggle"
                    role="tooltip"
                    class="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300"
                >
                    Toggle dark mode
                    <div
                        class="tooltip-arrow"
                        data-popper-arrow
                    ></div>
                </div> -->
                <button
                    type="button"
                    class="mx-3 flex rounded-full bg-gray-800 text-sm focus:ring-4 focus:ring-gray-300 md:mr-0 dark:focus:ring-zinc-300"
                    id="user-menu-button"
                    data-dropdown-toggle="user-menu-dropdown"
                >
                    <span class="sr-only">Open user menu</span>
                    <img
                        class="h-8 w-8 rounded-full"
                        src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                        alt="user photo"
                    />
                </button>
                <!-- Dropdown menu -->
                <div
                    class="z-50 my-4 hidden w-56 list-none divide-y divide-neutral-100 rounded border border-neutral-300 bg-white text-base shadow dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-800"
                    id="user-menu-dropdown"
                >
                    <div class="px-4 py-3">
                        <span
                            class="block text-sm font-semibold text-neutral-900 dark:text-white"
                            >{$sessionData?.fullName}</span
                        >
                        <span
                            class="block truncate text-sm text-gray-500 dark:text-neutral-300"
                            >{$sessionData?.rankName}</span
                        >
                    </div>
                    {#if $sessionData?.isVerified && [0, 8].includes(Number($sessionData?.rbacFlag))}
                        <ul
                            class="py-1 text-gray-500 dark:text-gray-600"
                            aria-labelledby="user-menu-button"
                        >
                            <li>
                                <a
                                    href="/app/user-page"
                                    on:click={hideDropDownList}
                                    class="block px-4 py-2 text-sm hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-zinc-300 dark:hover:text-gray-900"
                                    >My profile</a
                                >
                            </li>
                            <li>
                                <a
                                    href="/app/user-settings"
                                    on:click={hideDropDownList}
                                    class="block px-4 py-2 text-sm hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-zinc-300 dark:hover:text-gray-900"
                                    >Account settings</a
                                >
                            </li>
                        </ul>
                    {/if}
                    <ul
                        class="py-2 text-gray-500 dark:text-gray-600"
                        aria-labelledby="user-menu-button"
                    >
                        <li class="flex justify-between px-4 py-2">
                            <div>
                                <p
                                    class="text-sm text-neutral-900 dark:text-neutral-300"
                                >
                                    Dark mode
                                </p>
                            </div>
                            <div class="flex items-center justify-end">
                                <label
                                    for="themeSwitcher"
                                    class="inline-flex cursor-pointer items-center"
                                    aria-label="themeSwitcher"
                                >
                                    <label
                                        class="relative inline-flex cursor-pointer items-center"
                                    >
                                        <input
                                            on:click={handleThemeToggleClick}
                                            id="switch"
                                            type="checkbox"
                                            class="peer sr-only"
                                        />
                                        <label
                                            for="switch"
                                            class="hidden"
                                        ></label>
                                        <div
                                            class="peer h-6 w-11 rounded-full border bg-neutral-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-blue-300"
                                        ></div>
                                    </label>
                                </label>
                            </div>
                        </li>
                        <li>
                            <a
                                href="#"
                                type="button"
                                on:click={changePassword}
                                class="block px-4 py-2 text-sm text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-zinc-300 dark:hover:text-gray-900"
                                >Change password</a
                            >
                        </li>
                    </ul>
                    <ul
                        class="py-1 text-gray-500 dark:text-gray-600"
                        aria-labelledby="user-menu-button"
                    >
                        <li>
                            <a
                                href="#"
                                on:click={handleSignOutClick}
                                class="block px-4 py-2 text-sm text-neutral-900 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-zinc-300 dark:hover:text-gray-900"
                                >Sign out</a
                            >
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
{:else}
    <nav class="fixed z-50 w-full px-4 py-2.5 lg:px-6 dark:bg-gray-800">
        <div class="mb-4 flex items-center justify-between">
            <a
                href="https://flowbite.com"
                class="mr-4 flex inline-flex"
            >
                <img
                    src="https://flowbite.s3.amazonaws.com/logo.svg"
                    class="mr-3 h-8"
                    alt="FlowBite Logo"
                />
                <span
                    class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
                    >Hello Lindjunne!</span
                >
            </a>
        </div>

        <div class="bg-primary-600 rounded p-2 px-3">
            <p class="mb-0.5 text-xs text-gray-300">WALLET BALANCE</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
                P 200,000.00
            </p>
        </div>
    </nav>
{/if}

<div
    id="changePasswordModalElem"
    tabindex="-1"
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
                    on:click={() => changePasswordModal.hide()}
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

            <ChangePasswordNavbar
                bind:this={changePass}
                on:close={() => changePasswordModal.hide()}
            />
        </div>
    </div>
</div>
