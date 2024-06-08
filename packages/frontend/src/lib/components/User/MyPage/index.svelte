<script lang="ts">
    import dayjs from 'dayjs'
    import { onMount } from 'svelte'

    import { goto } from '$app/navigation'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'
    import { getPublicImageDataURL } from '$lib/utilities'

    /* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

    ////////////////////
    // Initialization //
    ////////////////////

    // Custom Stores
    const sessionData = sessionDataStore()
    const trpcClient = trpcClientStoreLegacy()

    let treeLine: TRouterOutput['user']['getTreeLine'] = {
        sortedUpline: [],
        sortedDownline: [],
    }

    let sortedUpline = treeLine.sortedUpline

    let sortedDownline = treeLine.sortedDownline

    let imageData: Record<
        string,
        { data: string | null; type: string; name: string }
    > = {}

    const formData = {
        position: '',
        registerDate: '',
        oneMarketingPts: '',
        salesCommPts: '',
        TotalPoints: '',
        isNew: false,
    }

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    ////////////////////
    //// Lifecycle ////
    ///////////////////
    onMount(() => {
        getMemberProfile()
    })

    //////////////
    // Handlers //
    //////////////

    const getMemberProfile = async () => {
        const memberProfile = await $trpcClient.user.getProfile.query({
            userId: $sessionData?.userId!,
        })

        treeLine = await $trpcClient.user.getTreeLine.query({
            userId: $sessionData?.userId!,
            memberId: $sessionData?.memberId!,
        })

        const badges = await $trpcClient.utility.getUploadedImages.query({
            sessionId: $sessionData?.sessionId || '',
            userId: $sessionData?.userId!,
            uploadId: memberProfile.user.badgeId,
            uploadType: 'badge',
        })

        if (badges.length > 0) {
            badges.forEach((val) => {
                imageData[val.uploadedItemId] = {
                    data: null,
                    type: 'extension',
                    name: val.uploadedItemId,
                }
            })
            imageData = await getPublicImageDataURL(imageData)
        }

        sortedUpline = treeLine.sortedUpline
        sortedDownline = treeLine.sortedDownline

        formData.position = memberProfile.rank.name
        formData.registerDate = dayjs(memberProfile.user.createdAt)
            .toISOString()
            .split('T')[0]

        formData.salesCommPts = numberFormatter.format(
            Number(memberProfile.wallet.salesCommBalance),
        )
        formData.oneMarketingPts = numberFormatter.format(
            Number(memberProfile.wallet.oneMarketingBalance),
        )
        formData.TotalPoints = numberFormatter.format(
            !isNaN(Number(memberProfile.wallet.TotalPoints))
                ? memberProfile.wallet.TotalPoints
                : 0,
        )
        formData.isNew = memberProfile.user.isNewlyRegistered
    }

    const goToCashOutPage = (usedPts = '') => {
        goto(`/app/cashout?myPts=${usedPts}`)
    }

    const goToDonationPage = () => {
        goto('/app/donation')
    }
</script>

<div class="p-4">
    <div class="mx-auto mb-4 max-w-screen-md text-center">
        <h2
            class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
        >
            My Page
        </h2>
    </div>

    <div
        class="mb-4 rounded-lg border border-neutral-200 bg-white p-2 shadow dark:border-neutral-600 dark:bg-neutral-800"
    >
        <div class="flex flex-wrap items-center justify-between p-3">
            <div class="mx-auto flex-shrink-0 items-start lg:mx-0">
                <span
                    class="inline-flex text-2xl font-semibold leading-none text-neutral-900 dark:text-neutral-300"
                    >Position: {formData.isNew ? 'N/A' : formData.position}
                </span>
                <div>
                    <h3
                        class="text-xs font-normal text-neutral-900 sm:text-sm dark:text-neutral-300"
                    >
                        Registered at: {formData.registerDate}
                    </h3>
                </div>
            </div>
            <div class="mx-auto mt-5 flex-shrink-0 text-center lg:mx-0 lg:mt-0">
                <div class="grid grid-cols-1">
                    <div class="flex items-center justify-end space-x-4">
                        {#each Object.entries(imageData) as [key, val]}
                            <img
                                class="h-12 w-12 rounded-full lg:h-16 lg:w-16"
                                src={val.data}
                                alt="Badge"
                            />
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- component -->
    <div>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div
                class="relative overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100 px-4 pb-12 pt-5 shadow-lg sm:px-6 sm:pt-6 dark:border-neutral-600 dark:bg-neutral-800"
            >
                <dt>
                    <div
                        class="absolute rounded-md bg-orange-500 p-2 text-white shadow-lg shadow-orange-600/40"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            {...$$props}
                        >
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M9.854 9.854L9.5 9.5m5.004 5.004l-.354-.354m-4.65.35l5-5M9.713 3.64c.581-.495.872-.743 1.176-.888a2.577 2.577 0 0 1 2.222 0c.304.145.595.393 1.176.888c.599.51 1.207.768 2.007.831c.761.061 1.142.092 1.46.204c.734.26 1.312.837 1.571 1.572c.112.317.143.698.204 1.46c.063.8.32 1.407.83 2.006c.496.581.744.872.889 1.176c.336.703.336 1.52 0 2.222c-.145.304-.393.595-.888 1.176a3.306 3.306 0 0 0-.831 2.007c-.061.761-.092 1.142-.204 1.46a2.577 2.577 0 0 1-1.572 1.571c-.317.112-.698.143-1.46.204c-.8.063-1.407.32-2.006.83c-.581.496-.872.744-1.176.889a2.577 2.577 0 0 1-2.222 0c-.304-.145-.595-.393-1.176-.888a3.306 3.306 0 0 0-2.007-.831c-.761-.061-1.142-.092-1.46-.204a2.577 2.577 0 0 1-1.571-1.572c-.112-.317-.143-.698-.204-1.46a3.305 3.305 0 0 0-.83-2.006c-.496-.581-.744-.872-.89-1.176a2.577 2.577 0 0 1 .001-2.222c.145-.304.393-.595.888-1.176c.52-.611.769-1.223.831-2.007c.061-.761.092-1.142.204-1.46a2.577 2.577 0 0 1 1.572-1.571c.317-.112.698-.143 1.46-.204a3.305 3.305 0 0 0 2.006-.83"
                            />
                        </svg>
                    </div>
                    <p
                        class="ml-16 truncate text-sm font-medium text-neutral-600 dark:text-neutral-300"
                    >
                        Sales Commission
                    </p>
                </dt>
                <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p
                        class="text-2xl font-semibold text-neutral-600 dark:text-neutral-300"
                    >
                        {formData.salesCommPts}
                    </p>
                    <!-- <p
                        class="ml-2 flex items-baseline text-sm font-semibold text-green-400"
                    >
                        <svg
                            class="h-5 w-5 flex-shrink-0 self-center text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="sr-only"> Increased by </span>
                        122
                    </p> -->
                    <div
                        class="absolute inset-x-0 bottom-0 bg-neutral-50 px-4 py-4 sm:px-6 dark:bg-neutral-600"
                    >
                        <div class="text-sm">
                            <button
                                on:click={() => goToCashOutPage('salesComm')}
                                class="font-medium text-orange-400 hover:text-orange-500"
                                >Cash-out<span class="sr-only">
                                    Total Sales commission stats</span
                                ></button
                            >
                        </div>
                    </div>
                </dd>
            </div>
            <div
                class="relative overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100 px-4 pb-12 pt-5 shadow-lg sm:px-6 sm:pt-6 dark:border-neutral-600 dark:bg-neutral-800"
            >
                <dt>
                    <div
                        class="absolute rounded-md bg-orange-500 p-2 text-white shadow-lg shadow-orange-600/40"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            {...$$props}
                        >
                            <g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                color="currentColor"
                            >
                                <path
                                    d="M12 19c-1.332.622-3.083 1-5 1c-1.066 0-2.08-.117-3-.327c-.591-.136-.887-.203-1.241-.484a2.4 2.4 0 0 1-.565-.709C2 18.073 2 17.677 2 16.886V6.114c0-.985 1.04-1.661 2-1.441c.92.21 1.934.327 3 .327c1.917 0 3.668-.378 5-1s3.083-1 5-1c1.066 0 2.08.117 3 .327c.591.136.887.204 1.241.484c.202.16.454.476.565.709c.194.408.194.803.194 1.594V11.5M18.5 21v-7M15 17.5h7"
                                />
                                <path
                                    d="M14.5 11.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m-9 1v.009"
                                />
                            </g>
                        </svg>
                    </div>
                    <p
                        class="ml-16 truncate text-sm font-medium text-neutral-600 dark:text-neutral-300"
                    >
                        One-Marketing Shares
                    </p>
                </dt>
                <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p
                        class="text-2xl font-semibold text-neutral-600 dark:text-neutral-300"
                    >
                        {formData.oneMarketingPts}
                    </p>
                    <!-- <p
                        class="ml-2 flex items-baseline text-sm font-semibold text-green-400"
                    >
                        <svg
                            class="h-5 w-5 flex-shrink-0 self-center text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="sr-only"> Increased by </span>
                        100
                    </p> -->
                    <div
                        class="absolute inset-x-0 bottom-0 bg-neutral-50 px-4 py-4 sm:px-6 dark:bg-neutral-600"
                    >
                        <div class="text-sm">
                            <button
                                on:click={() => goToCashOutPage('oneMarketing')}
                                class="font-medium text-orange-400 hover:text-orange-500"
                                >Cash-out<span class="sr-only">
                                    Total One-Marketing stats</span
                                ></button
                            >
                        </div>
                    </div>
                </dd>
            </div>
            <div
                class="relative overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100 px-4 pb-12 pt-5 shadow-lg sm:px-6 sm:pt-6 dark:border-neutral-600 dark:bg-neutral-800"
            >
                <dt>
                    <div
                        class="absolute rounded-md bg-orange-500 p-2 text-white shadow-lg shadow-orange-600/40"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            {...$$props}
                        >
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m17.8 19.817l-2.172 1.138a.392.392 0 0 1-.568-.41l.415-2.411l-1.757-1.707a.389.389 0 0 1 .217-.665l2.428-.352l1.086-2.193a.392.392 0 0 1 .702 0l1.086 2.193l2.428.352a.39.39 0 0 1 .217.665l-1.757 1.707l.414 2.41a.39.39 0 0 1-.567.411zm-11.6 0l-2.172 1.138a.392.392 0 0 1-.568-.41l.415-2.411l-1.757-1.707a.389.389 0 0 1 .217-.665l2.428-.352l1.086-2.193a.392.392 0 0 1 .702 0l1.086 2.193l2.428.352a.39.39 0 0 1 .217.665l-1.757 1.707l.414 2.41a.39.39 0 0 1-.567.411zm5.8-10l-2.172 1.138a.392.392 0 0 1-.568-.41l.415-2.411l-1.757-1.707a.389.389 0 0 1 .217-.665l2.428-.352l1.086-2.193a.392.392 0 0 1 .702 0l1.086 2.193l2.428.352a.39.39 0 0 1 .217.665l-1.757 1.707l.414 2.41a.39.39 0 0 1-.567.411z"
                            />
                        </svg>
                    </div>
                    <p
                        class="ml-16 truncate text-sm font-medium text-neutral-600 dark:text-neutral-300"
                    >
                        Total Points
                    </p>
                </dt>
                <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p
                        class="text-2xl font-semibold text-neutral-600 dark:text-neutral-300"
                    >
                        {formData.TotalPoints}
                    </p>
                    <!-- <p
                        class="ml-2 flex items-baseline text-sm font-semibold text-green-400"
                    >
                        <svg
                            class="h-5 w-5 flex-shrink-0 self-center text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="sr-only"> Increased by </span>
                        222
                    </p> -->
                    <div
                        class="absolute inset-x-0 bottom-0 bg-neutral-50 px-4 py-4 sm:px-6 dark:bg-neutral-600"
                    >
                        <div class="flex justify-between text-sm">
                            <button
                                class="font-medium text-orange-400 hover:text-orange-500"
                                >Buy with points<span class="sr-only">
                                    Total Points stats</span
                                ></button
                            >
                            <button
                                type="button"
                                on:click={goToDonationPage}
                                class="font-medium text-orange-400 hover:text-orange-500"
                            >
                                Donation
                            </button>
                        </div>
                    </div>
                </dd>
            </div>
        </dl>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-4">
        <div
            class="mb-4 rounded-lg border border-neutral-200 bg-white p-4 shadow xl:mb-0 dark:border-neutral-600 dark:bg-neutral-800"
        >
            <div class="flex items-center justify-between">
                <h3
                    class="relative text-lg font-semibold text-neutral-900 dark:text-neutral-300"
                >
                    Tree Line
                </h3>
                <a
                    href="#"
                    class="text-primary-700 dark:text-primary-600 inline-flex items-center rounded-lg p-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    View all
                </a>
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
