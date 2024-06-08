<script lang="ts">
    import {
        addNoticeInputSchema,
        addRankInputSchema,
        updateNoticeInputSchema,
        updateRankInputSchema,
    } from '@trpc-subscription/validator/trpc/v1/user'
    import { saveUploadIdInputSchema } from '@trpc-subscription/validator/trpc/v1/utility'
    import type { TRPCError } from '@trpc/server'
    import { Modal, Tabs } from 'flowbite'
    import { getContext, onMount } from 'svelte'
    import type { FormEventHandler } from 'svelte/elements'
    import type { Readable } from 'svelte/store'
    import type { ZodIssue } from 'zod'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import PageNavbar from '$lib/layouts/PageNavbar.svelte'
    import { sessionDataStore, trpcClientStoreLegacy } from '$lib/stores.js'
    import {
        getPublicImageDataURL,
        nanoidCustom,
        postPublicImageDataURL,
        postPublicVideoDataURL,
    } from '$lib/utilities.js'

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

    let validatedAddNoticeData: TRouterInput['setting']['addNotice']
    let validatedUpdateNoticeData: TRouterInput['setting']['updateNotice']
    let validatedAddRankData: TRouterInput['setting']['addRank']
    let validatedUpdateRankData: TRouterInput['setting']['updateRank']
    let documentSetting: TRouterOutput['setting']['getDocument']

    // Modal
    let noticeModal: Modal
    let rankModal: Modal
    let confirmAdminSettingsModal: Modal
    let successAdminSettingsModal: Modal
    let noticeImageModal: Modal
    let noticeVideoModal: Modal

    // Tab
    let panelTab: Tabs

    // Pagination & Search
    let notices: TRouterOutput['setting']['getNotice'] = {
        paginatedNotice: [],
        totalNumberOfNotice: 0,
    }

    let paginatedNotice = notices.paginatedNotice

    let ranks: TRouterOutput['setting']['getRanks'] = {
        paginatedRank: [],
        totalNumberOfRank: 0,
    }
    let paginatedRank = ranks.paginatedRank

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

    // Form Data
    const noticeFormData = {
        noticeId: '',
        noticeType: '',
        noticeImageId: '',
        noticeImage: [] as string[],
        noticeVideoId: '',
        noticeVideo: '',
        contentMessage: '',
    }

    let imageData: Record<
        string,
        { data: string | null; type: string; name: string }
    > = {}

    let videoData: Record<
        string,
        { data: string | null; type: string; name: string }
    > = {
        video: {
            data: null,
            type: '',
            name: '',
        },
    }

    let validatedImageVideoData: Record<string, { uploadId: string | null }> = {
        img: {
            uploadId: null,
        },
        vid: {
            uploadId: null,
        },
    }

    const documentFormData = {
        facebookLink: '',
        youtubeLink: '',
        websiteLink: '',
        privacyPolicy: '',
        termsAndCondition: '',
        totalSalesMultiplier: '',
        dealerOMDMultiplier: '',
        teamLeaderOMDMultiplier: '',
        managerOMDMultiplier: '',
        directorOMDMultiplier: '',
        execPartnerMultiplier: '',
        corporateMultiplier: '5',
    }

    const rankFormData = {
        rankId: '',
        name: '',
        promotionThreshold: '',
        commissionPercentage: '',
    }

    const actionBtn = {
        isAddnotice: false,
        isAddRank: false,
    }

    const confirmFilterMessageList: Record<string, string> = {
        notice: 'notice',
        commercialads: 'commercial ads',
        newspromotion: 'news and promotion',
        distribution: 'distribution',
        officiallink: 'official link',
        privacypolicy: 'privacy policy',
        termsandcondition: 'terms and condition',
    }

    let imageIdList: string[] = []
    let validateIdPictureType = ''
    let showValidateMessage: Record<string, string> = {}
    let confirmFilterMessage = ''
    let activeTab = ''
    let isAdd = false
    let isDelete = false
    let alertMessage = ''
    const isWeb = true

    ////////////////////
    //// Lifecycle ////
    ///////////////////
    onMount(() => {
        noticeModal = new Modal(document.getElementById('noticeModalElem'), {
            placement: 'bottom-right',
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

        rankModal = new Modal(document.getElementById('rankModalElem'), {
            placement: 'bottom-right',
            backdrop: 'static',
            backdropClasses:
                'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {},
            onShow: () => {},
            onToggle: () => {},
        })

        confirmAdminSettingsModal = new Modal(
            document.getElementById('confirmAdminSettingsModalElem'),
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

        successAdminSettingsModal = new Modal(
            document.getElementById('successAdminSettingsModalElem'),
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

        noticeImageModal = new Modal(
            document.getElementById('noticeImageModalElem'),
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

        noticeVideoModal = new Modal(
            document.getElementById('noticeVideoModalElem'),
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

        const tabsElement = document.getElementById('panel-tab')
        const tabElements = [
            {
                id: 'notice',
                triggerEl: document.querySelector('#notice-tab') as HTMLElement,
                targetEl: document.querySelector(
                    '#notice-content',
                ) as HTMLElement,
            },
            {
                id: 'rank',
                triggerEl: document.querySelector('#rank-tab') as HTMLElement,
                targetEl: document.querySelector(
                    '#rank-content',
                ) as HTMLElement,
            },
            {
                id: 'distribution',
                triggerEl: document.querySelector(
                    '#distribution-tab',
                ) as HTMLElement,
                targetEl: document.querySelector(
                    '#distribution-content',
                ) as HTMLElement,
            },
            {
                id: 'officiallink',
                triggerEl: document.querySelector(
                    '#officiallink-tab',
                ) as HTMLElement,
                targetEl: document.querySelector(
                    '#officiallink-content',
                ) as HTMLElement,
            },
            {
                id: 'privacypolicy',
                triggerEl: document.querySelector(
                    '#privacypolicy-tab',
                ) as HTMLElement,
                targetEl: document.querySelector(
                    '#privacypolicy-content',
                ) as HTMLElement,
            },
            {
                id: 'termsandcondition',
                triggerEl: document.querySelector(
                    '#termsandcondition-tab',
                ) as HTMLElement,
                targetEl: document.querySelector(
                    '#termsandcondition-content',
                ) as HTMLElement,
            },
        ]

        const options = {
            defaultTabId: 'notice',
            activeClasses: 'border-b border-primary-700 text-primary-700',
            inactiveClasses:
                'text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300',
            onShow: () => {},
        }

        panelTab = new Tabs(tabsElement, tabElements, options)
        showTab('notice')
    })

    ////////////////////
    ///// Handlers /////
    ////////////////////

    const showTab = async (id: string) => {
        panelTab.show(id)
        activeTab = panelTab._activeTab.id

        let url = new URL($page.url)

        pageNumber = 1
        rowsPerPage = 10
        searchFilter = ''

        if (panelTab._activeTab.id === 'notice') {
            await getNoticeListTableData(pageNumber, rowsPerPage, searchFilter)
        } else if (panelTab._activeTab.id === 'rank') {
            await getRankListTableData(pageNumber, rowsPerPage, searchFilter)
        } else {
            url.searchParams.delete('pageNumber')
            url.searchParams.delete('rowsPerPage')
            url.searchParams.delete('searchFilter')

            await getDocumentData()
        }

        goto(url, {
            noScroll: true,
            keepFocus: true,
        })
    }

    const getNoticeListTableData = async (
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

        await getNoticeList()
    }

    const getNoticeList = async () => {
        notices = await $trpcClient.setting.getNotice.query({
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
        })

        if (notices) {
            paginatedNotice = notices.paginatedNotice
            totalItems = notices.totalNumberOfNotice
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const getRankListTableData = async (
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

        await getRankList()
    }

    const getRankList = async () => {
        ranks = await $trpcClient.setting.getRanks.query({
            limit: rowsPerPage,
            offset: rowsPerPage * (pageNumber - 1),
            searchFilter,
        })

        if (ranks) {
            paginatedRank = ranks.paginatedRank
            totalItems = ranks.totalNumberOfRank
            totalPages = Math.ceil(totalItems / rowsPerPage)
            fromPage = totalItems > 0 ? (pageNumber - 1) * rowsPerPage + 1 : 0
            toPage =
                totalItems < fromPage + (rowsPerPage - 1)
                    ? totalItems
                    : fromPage + (rowsPerPage - 1)
        }
    }

    const getDocumentData = async () => {
        documentSetting = await $trpcClient.setting.getDocument.query({
            keySetting: `SETTING#${panelTab._activeTab.id}`,
        })

        documentFormData.totalSalesMultiplier = documentSetting?.value
            ?.totalSalesMultiplier
            ? (documentSetting.value.totalSalesMultiplier as string)
            : ''
        documentFormData.dealerOMDMultiplier = documentSetting?.value
            ?.dealerOMDMultiplier
            ? (documentSetting.value.dealerOMDMultiplier as string)
            : ''
        documentFormData.teamLeaderOMDMultiplier = documentSetting?.value
            ?.teamLeaderOMDMultiplier
            ? (documentSetting.value.teamLeaderOMDMultiplier as string)
            : ''
        documentFormData.managerOMDMultiplier = documentSetting?.value
            ?.managerOMDMultiplier
            ? (documentSetting.value.managerOMDMultiplier as string)
            : ''
        documentFormData.directorOMDMultiplier = documentSetting?.value
            ?.directorOMDMultiplier
            ? (documentSetting.value.directorOMDMultiplier as string)
            : ''
        documentFormData.execPartnerMultiplier = documentSetting?.value
            ?.execPartnerMultiplier
            ? (documentSetting.value.execPartnerMultiplier as string)
            : ''

        documentFormData.facebookLink = documentSetting?.value?.facebook
            ? (documentSetting.value.facebook as string)
            : ''
        documentFormData.youtubeLink = documentSetting?.value?.youtube
            ? (documentSetting.value.youtube as string)
            : ''
        documentFormData.websiteLink = documentSetting?.value?.website
            ? (documentSetting.value.website as string)
            : ''
        documentFormData.privacyPolicy = documentSetting?.value?.message
            ? (documentSetting.value.message as string)
            : ''
        documentFormData.termsAndCondition = documentSetting?.value?.message
            ? (documentSetting.value.message as string)
            : ''
    }

    const handleAddActionBtn = () => {
        if (panelTab._activeTab.id === 'notice') {
            actionBtn.isAddnotice = true
            clearNoticeInput()
            noticeModal.show()
        } else if (panelTab._activeTab.id === 'rank') {
            actionBtn.isAddRank = true
            clearRankInput()
            const rank = [
                'name',
                'promotionThreshold',
                'commissionPercentage',
            ]
            rank.forEach((val) => {
                const elemId = document.getElementById(
                    `${val}`,
                ) as HTMLInputElement
                if (elemId) {
                    elemId.classList.remove(
                        'border-red-700',
                        'dark:border-red-700',
                        'border-2',
                    )
                }
            })
            rankModal.show()
        }
        showValidateMessage = {}
    }

    const handleNoticeTypeChange = () => {
        if (noticeFormData.noticeType) {
            const elemId = document.getElementById(
                'noticeType',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.noticeType = ''
        }
    }

    const handleNoticeImgFile: FormEventHandler<HTMLInputElement> = (event) => {
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
                imageIdList.push(fileName)
            }
        }
    }

    const handleDeleteImg = (index: string) => {
        delete imageData[index]
        const newList = imageData
        imageData = newList
    }

    const handleNoticeVideo: FormEventHandler<HTMLInputElement> = async (
        event,
    ) => {
        const files = event.currentTarget.files
        const imageName: string[] = []

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files.item(0)!
                const name = file.name
                const extension = name.substring(name.lastIndexOf('.') + 1)
                const size = Math.round(file.size / 1024)

                if (!/^mp4$/.test(extension) || size > 8192) {
                    videoData.video.data = ''
                    event.currentTarget.value = ''
                    return
                }

                const fileReader = new FileReader()
                const fileName = nanoidCustom()
                fileReader.addEventListener('load', async () => {
                    videoData.video.data = fileReader.result as string
                    videoData.video.type = extension
                    videoData.video.name = fileName

                    await postPublicVideoDataURL(
                        videoData,
                        `${$sessionData?.sharedAccessSignature}`,
                    )
                })
                fileReader.readAsDataURL(file)
                imageName.push(fileName)
            }

            const validator = await saveUploadIdInputSchema.safeParseAsync({
                uploadId: nanoidCustom(),
                fileName: imageName,
            })

            if (validator.success) {
                const result =
                    await $trpcClient.utility.saveUploadedFileId.mutate(
                        validator.data,
                    )
                validatedImageVideoData.vid.uploadId = result
            }
        }
    }

    const handleDeleteVid = () => {
        const videoElemId = document.getElementById(
            'noticeVideo',
        ) as HTMLInputElement
        videoElemId.value = ''
        videoData.video.data = null
        videoData.video.name = ''
    }

    const handleNameChange = () => {
        if (rankFormData.name) {
            const elemId = document.getElementById('name') as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.name = ''
        }
    }

    const handleCodesChange: FormEventHandler<HTMLInputElement> = (event) => {
        rankFormData.promotionThreshold = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (rankFormData.promotionThreshold) {
            const elemId = document.getElementById(
                'promotionThreshold',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.promotionThreshold = ''
        }
    }

    const handleCommissionChange: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        rankFormData.commissionPercentage = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '')
            : ''

        if (rankFormData.commissionPercentage) {
            const elemId = document.getElementById(
                'commissionPercentage',
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
            showValidateMessage.commissionPercentage = ''
        }
    }

    const handleSalesMultiplier: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        documentFormData.totalSalesMultiplier = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '').replace('.', '')
            : ''
    }

    const handleDealerMultiplier: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        documentFormData.dealerOMDMultiplier = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '').replace('.', '')
            : ''
    }

    const handleTeamLeaderMultiplier: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        documentFormData.teamLeaderOMDMultiplier = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '').replace('.', '')
            : ''
    }

    const handleManagerMultiplier: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        documentFormData.managerOMDMultiplier = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '').replace('.', '')
            : ''
    }

    const handleDirectorMultiplier: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        documentFormData.directorOMDMultiplier = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '').replace('.', '')
            : ''
    }

    const handleExecPartnerMultiplier: FormEventHandler<HTMLInputElement> = (
        event,
    ) => {
        documentFormData.execPartnerMultiplier = !isNaN(
            Number(event.currentTarget.value),
        )
            ? event.currentTarget.value.replace(/\s+/g, '').replace('.', '')
            : ''
    }

    const handleEditNotice = (
        id: string,
        category: string,
        imageId: string | null,
        videoId: string | null,
    ) => {
        getImageVideo(id)
        actionBtn.isAddnotice = false
        noticeFormData.noticeId = id
        noticeFormData.noticeType = category
        noticeFormData.noticeImageId = `${imageId}`
        noticeFormData.noticeVideoId = `${videoId}`
        noticeModal.show()
    }

    const handleEditRank = async (rankId: number) => {
        actionBtn.isAddRank = false
        const rank = await $trpcClient.user.getRanks.query({
            rankId,
        })

        rankFormData.rankId = String(rank[0].rankId)
        rankFormData.name = String(rank[0].rankName)
        rankFormData.promotionThreshold = String(rank[0].rankPromotion)
        rankFormData.commissionPercentage = rank[0].rankCommission
        showValidateMessage = {}
        rank.forEach((val) => {
            const elemId = document.getElementById(
                `${val.rankName ? 'name' : val}`,
            ) as HTMLInputElement
            if (elemId) {
                elemId.classList.remove(
                    'border-red-700',
                    'dark:border-red-700',
                    'border-2',
                )
            }
        })
        rankModal.show()
    }

    const noticeInputSchema = async () => {
        isDelete = false
        confirmFilterMessage = confirmFilterMessageList[panelTab._activeTab.id]

        if (actionBtn.isAddnotice) {
            const validator = await addNoticeInputSchema
                .superRefine(async (schema, ctx) => {
                    const fields = [{ name: 'Notice Type', path: 'noticeType' }]

                    const result = await Promise.all([
                        $trpcClient.setting.isDataExisting.query({
                            tableName: 'notice',
                            addValue: schema.noticeType,
                            updateValue: '',
                        }),
                    ]).catch((err) => {
                        alertMessage = `Something went wrong: ${err.message}`
                        successAdminSettingsModal.show()
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
                                    message: `${fields[i].name} already exists.`,
                                    path: [fields[i].path],
                                })
                            }
                        }
                    }
                })
                .safeParseAsync({
                    ...noticeFormData,
                    noticeImageId: validatedImageVideoData.img.uploadId,
                    noticeVideoId: validatedImageVideoData.vid.uploadId,
                })

            if (validator.success) {
                validatedAddNoticeData = validator.data
                confirmAdminSettingsModal.show()
            } else {
                showValidateMessage = {}
                validator.error.issues.forEach((key, index) => {
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
        } else {
            const validator = await updateNoticeInputSchema.safeParseAsync({
                ...noticeFormData,
                noticeImageId: validatedImageVideoData.img.uploadId,
                noticeVideoId: validatedImageVideoData.vid.uploadId,
            })

            if (validator.success) {
                validatedUpdateNoticeData = validator.data
                confirmAdminSettingsModal.show()
            } else {
                showValidateMessage = {}
                validator.error.issues.forEach((key, index) => {
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
    }

    const rankInputSchema = async () => {
        isDelete = false
        confirmFilterMessage = confirmFilterMessageList[panelTab._activeTab.id]
        if (actionBtn.isAddRank) {
            const validator = await addRankInputSchema
                .superRefine(async (schema, ctx) => {
                    const fields = [{ name: 'Rank Name', path: 'name' }]

                    const result = await Promise.all([
                        $trpcClient.setting.isDataExisting.query({
                            tableName: 'rank',
                            addValue: schema.name,
                            updateValue: '',
                        }),
                    ]).catch((err) => {
                        alertMessage = `Something went wrong: ${err.message}`
                        successAdminSettingsModal.show()
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
                                    message: `${fields[i].name} already exists.`,
                                    path: [fields[i].path],
                                })
                            }
                        }
                    }
                })
                .safeParseAsync({
                    name: rankFormData.name || undefined,
                    promotionThreshold:
                        Number(rankFormData.promotionThreshold) || undefined,
                    commissionPercentage:
                        rankFormData.commissionPercentage || undefined,
                })

            if (validator.success) {
                validatedAddRankData = validator.data
                confirmAdminSettingsModal.show()
            } else {
                showValidateMessage = {}
                validator.error.issues.forEach((key, index) => {
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
        } else {
            const validator = await updateRankInputSchema
                .superRefine(async (schema, ctx) => {
                    const fields = [{ name: 'Rank Name', path: 'name' }]

                    const result = await Promise.all([
                        $trpcClient.setting.isDataExisting.query({
                            tableName: 'rank',
                            addValue: '',
                            updateValue: String(schema.name),
                            recordId: String(schema.rankId),
                        }),
                    ]).catch((err) => {
                        alertMessage = `Something went wrong: ${err.message}`
                        successAdminSettingsModal.show()
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
                    rankId: Number(rankFormData.rankId),
                    name: rankFormData.name || undefined,
                    promotionThreshold:
                        Number(rankFormData.promotionThreshold) || undefined,
                    commissionPercentage:
                        rankFormData.commissionPercentage || undefined,
                })

            if (validator.success) {
                validatedUpdateRankData = validator.data
                confirmAdminSettingsModal.show()
            } else {
                showValidateMessage = {}
                validator.error.issues.forEach((key, index) => {
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
    }

    const handleAddUpdateBtn = async () => {
        if (panelTab._activeTab.id === 'notice') {
            await noticeInputSchema()
            const validator = await saveUploadIdInputSchema.safeParseAsync({
                uploadId: nanoidCustom(),
                fileName: imageIdList,
            })

            if (validator.success) {
                const result =
                    await $trpcClient.utility.saveUploadedFileId.mutate(
                        validator.data,
                    )
                validatedImageVideoData.img.uploadId = result
            }
        } else if (panelTab._activeTab.id === 'rank') {
            await rankInputSchema()
        }
    }

    const handleConfirmYesBtn = async () => {
        let response
        try {
            if (panelTab._activeTab.id === 'notice') {
                if (actionBtn.isAddnotice) {
                    response = await $trpcClient.setting.addNotice.mutate(
                        validatedAddNoticeData,
                    )
                } else {
                    response = await $trpcClient.setting.updateNotice.mutate(
                        validatedUpdateNoticeData,
                    )
                }

                if (response) {
                    confirmFilterMessage = 'notice'
                }
            } else if (panelTab._activeTab.id === 'rank') {
                if (actionBtn.isAddRank) {
                    response =
                        await $trpcClient.setting.addRank.mutate(
                            validatedAddRankData,
                        )
                } else {
                    response = await $trpcClient.setting.updateRank.mutate(
                        validatedUpdateRankData,
                    )
                }

                if (response) {
                    confirmFilterMessage = 'rank'
                }
            } else if (panelTab._activeTab.id === 'distribution') {
                response = await $trpcClient.setting.saveDocument.mutate({
                    keySetting: 'SETTING#distribution',
                    valueSetting: {
                        totalSalesMultiplier:
                            documentFormData.totalSalesMultiplier,
                        dealerOMDMultiplier:
                            documentFormData.dealerOMDMultiplier,
                        teamLeaderOMDMultiplier:
                            documentFormData.teamLeaderOMDMultiplier,
                        managerOMDMultiplier:
                            documentFormData.managerOMDMultiplier,
                        directorOMDMultiplier:
                            documentFormData.directorOMDMultiplier,
                        execPartnerMultiplier:
                            documentFormData.execPartnerMultiplier,
                        corporateMultiplier:
                            documentFormData.corporateMultiplier,
                    },
                })
            } else if (panelTab._activeTab.id === 'officiallink') {
                response = await $trpcClient.setting.saveDocument.mutate({
                    keySetting: 'SETTING#officiallink',
                    valueSetting: {
                        facebook: documentFormData.facebookLink,
                        youtube: documentFormData.youtubeLink,
                        website: documentFormData.websiteLink,
                    },
                })
            } else if (panelTab._activeTab.id === 'privacypolicy') {
                response = await $trpcClient.setting.saveDocument.mutate({
                    keySetting: 'SETTING#privacypolicy',
                    valueSetting: {
                        message: documentFormData.privacyPolicy,
                    },
                })
            } else if (panelTab._activeTab.id === 'termsandcondition') {
                response = await $trpcClient.setting.saveDocument.mutate({
                    keySetting: 'SETTING#termsandcondition',
                    valueSetting: {
                        message: documentFormData.termsAndCondition,
                    },
                })
            }

            if (!response) {
                alertMessage = 'Something went wrong. Please try again.'
            }

            confirmAdminSettingsModal.hide()
            successAdminSettingsModal.show()
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

    const clearNoticeInput = () => {
        noticeFormData.noticeId = ''
        noticeFormData.noticeType = ''
        noticeFormData.noticeImageId = ''
        noticeFormData.noticeImage = []
        noticeFormData.noticeVideoId = ''
        noticeFormData.noticeVideo = ''
        noticeFormData.contentMessage = ''
        imageData = {}
        videoData = {
            video: {
                data: null,
                type: '',
                name: '',
            },
        }
        const videoElemId = document.getElementById(
            'noticeVideo',
        ) as HTMLInputElement
        videoElemId.value = ''
    }

    const clearRankInput = () => {
        rankFormData.rankId = ''
        rankFormData.name = ''
        rankFormData.promotionThreshold = ''
        rankFormData.commissionPercentage = ''
    }

    const handleSaveBtn = () => {
        confirmFilterMessage = confirmFilterMessageList[panelTab._activeTab.id]
        confirmAdminSettingsModal.show()
    }

    const handleSuccessContinueBtn = async () => {
        if (panelTab._activeTab.id === 'notice') {
            await getNoticeListTableData(pageNumber, rowsPerPage, searchFilter)
            noticeModal.hide()
        } else if (panelTab._activeTab.id === 'rank') {
            await getRankListTableData(pageNumber, rowsPerPage, searchFilter)
            rankModal.hide()
        } else {
            await getDocumentData()
        }
        confirmAdminSettingsModal.hide()
        successAdminSettingsModal.hide()
    }

    const getImageVideo = async (noticeId: string) => {
        const uploaded = await $trpcClient.setting.getImageVideo.query({
            noticeId,
        })

        imageData = {}
        videoData = {
            video: {
                data: null,
                type: '',
                name: '',
            },
        }

        if (uploaded.uploadedImg.length > 0) {
            uploaded.uploadedImg.forEach((val) => {
                imageData[val.upload_item.id] = {
                    data: null,
                    type: 'extension',
                    name: val.upload_item.id,
                }
            })
            imageData = await getPublicImageDataURL(imageData)

            validatedImageVideoData.img.uploadId =
                uploaded.uploadedImg[0].notice.image
        }

        if (uploaded.uploadedVid.length > 0) {
            uploaded.uploadedVid.forEach((val) => {
                videoData.video.name = val.upload_item.id
            })

            // videoData.video.name = uploaded.uploadedVid[0].upload_item.id
            videoData = await getPublicImageDataURL(videoData)

            validatedImageVideoData.vid.uploadId =
                uploaded.uploadedVid[0].notice.video
        }
    }

    const handleImageVideoViewBtn = (id: string, isImage: boolean) => {
        getImageVideo(id)
        isImage ? noticeImageModal.show() : noticeVideoModal.show()
    }
</script>

{#if isWeb}
    <div class="p-4">
        <div class="mx-auto mb-4 max-w-screen-2xl text-center">
            <h2
                class="text-xl font-extrabold tracking-[0.4rem] text-neutral-900 dark:text-neutral-300"
            >
                Settings
            </h2>
        </div>

        <div class="mb-4 mt-2">
            <ul
                class=" flex justify-start overflow-x-auto text-sm font-bold lg:justify-center dark:text-neutral-300"
                id="panel-tab"
                role="tablist"
            >
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block flex items-center justify-center px-3 py-2"
                        id="notice-tab"
                        type="button"
                        on:click={() => showTab('notice')}
                        role="tab">Notice</button
                    >
                </li>
                <!-- <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block py-2 px-3 flex justify-center items-center"
                        id="commercialads-tab"
                        type="button"
                        on:click={() => showTab('commercialads')}
                        role="tab">Commercial Ads</button
                    >
                </li>
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block py-2 px-3 flex justify-center items-center"
                        id="newspromotion-tab"
                        type="button"
                        on:click={() => showTab('newspromotion')}
                        role="tab">News and Promotion</button
                    >
                </li> -->
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block flex items-center justify-center px-3 py-2"
                        id="rank-tab"
                        type="button"
                        on:click={() => showTab('rank')}
                        role="tab">Rank</button
                    >
                </li>
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="{$sessionData?.rbacFlag === 1
                            ? ''
                            : 'hidden'} inline-block flex items-center justify-center px-3 py-2"
                        id="distribution-tab"
                        type="button"
                        on:click={() => showTab('distribution')}
                        role="tab">Distribution</button
                    >
                </li>
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block flex items-center justify-center px-3 py-2"
                        id="officiallink-tab"
                        type="button"
                        on:click={() => showTab('officiallink')}
                        role="tab">Official Link</button
                    >
                </li>
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block flex items-center justify-center px-3 py-2"
                        id="privacypolicy-tab"
                        type="button"
                        on:click={() => showTab('privacypolicy')}
                        role="tab">Privacy Policy</button
                    >
                </li>
                <li
                    class="me-2"
                    role="presentation"
                >
                    <button
                        class="inline-block flex items-center justify-center px-3 py-2"
                        id="termsandcondition-tab"
                        type="button"
                        on:click={() => showTab('termsandcondition')}
                        role="tab">Terms and Condition</button
                    >
                </li>
            </ul>
        </div>

        <div
            id="default-tab-content"
            class="p-2"
        >
            <div
                class="hidden"
                id="notice-content"
                role="tabpanel"
            >
                <div class=" shadow-lg">
                    <div
                        class="flex flex-col items-center justify-between space-y-3 p-4 md:flex-row md:space-y-0"
                    >
                        <div class="w-full md:w-1/4">
                            <!-- <form class="flex items-center">
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
                                    />
                                </div>
                            </form> -->
                        </div>

                        <div
                            class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-3 md:space-y-0"
                        >
                            <button
                                on:click={handleAddActionBtn}
                                type="button"
                                class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-4"
                            >
                                <svg
                                    class="mr-2 h-3.5 w-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        clip-rule="evenodd"
                                        fill-rule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    />
                                </svg>
                                Add Notice
                            </button>
                            <!-- <label
                                class="text-sm font-normal dark:text-white"
                                for="rows">Rows per page</label
                            >
                            <select
                                id="rows"
                                bind:value={rowsPerPage}
                                on:change={() => {
                                    getNoticeListTableData(
                                        pageNumber,
                                        rowsPerPage,
                                        searchFilter,
                                    )
                                }}
                                class="border-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 ml-2 mr-2 block rounded-lg py-1.5 pl-3.5 pr-6 text-sm dark:bg-gray-600 dark:text-white"
                            >
                                {#each $rowPerPageStore as row}
                                    <option value={row.value}>{row.name}</option
                                    >
                                {/each}
                            </select>
                            <span
                                class="mr-1 text-sm font-normal text-gray-500 dark:text-gray-400"
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
                                    getNoticeListTableData(
                                        pageNumber - 1,
                                        rowsPerPage,
                                        searchFilter,
                                    )}
                                class="inline-flex cursor-pointer justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
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
                                    getNoticeListTableData(
                                        pageNumber + 1,
                                        rowsPerPage,
                                        searchFilter,
                                    )}
                                class="hover:bg-gray-100 inline-flex cursor-pointer justify-end rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
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
                            </a> -->
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
                                                    class="px-4 py-3 text-center"
                                                    >Category</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >Image</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >Video</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >Content</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody
                                            class="divide-y divide-neutral-300 bg-neutral-50 dark:divide-neutral-500 dark:bg-neutral-600"
                                        >
                                            {#each paginatedNotice as row}
                                                <tr
                                                    class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                                >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                                        >{row.type}</td
                                                    >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                                        >{#if row.image}
                                                            <button
                                                                on:click={() =>
                                                                    handleImageVideoViewBtn(
                                                                        row.id,
                                                                        true,
                                                                    )}
                                                                class="font-medium text-orange-400 hover:underline dark:text-orange-400"
                                                                >View</button
                                                            >
                                                        {/if}
                                                    </td>
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-white"
                                                        >{#if row.video}
                                                            <button
                                                                on:click={() =>
                                                                    handleImageVideoViewBtn(
                                                                        row.id,
                                                                        false,
                                                                    )}
                                                                class="font-medium text-orange-400 hover:underline dark:text-orange-400"
                                                                >View</button
                                                            >
                                                        {/if}
                                                    </td>
                                                    <td
                                                        class="truncate px-4 py-3 text-center text-black dark:text-white"
                                                        >{row.description}</td
                                                    >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center"
                                                    >
                                                        <div
                                                            class="flex items-center justify-center space-x-2"
                                                        >
                                                            <button
                                                                on:click={() =>
                                                                    handleEditNotice(
                                                                        row.id,
                                                                        row.type,
                                                                        row.image,
                                                                        row.video,
                                                                    )}
                                                                type="button"
                                                                class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
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
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                                <div
                                    class="sticky bottom-0 right-0 items-center border-t border-neutral-200 bg-neutral-100 p-4 sm:flex sm:justify-between dark:border-neutral-500 dark:bg-neutral-700"
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
                                                    getNoticeListTableData(
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
                                                on:click={() =>
                                                    getNoticeListTableData(
                                                        pageNumber - 1,
                                                        rowsPerPage,
                                                        searchFilter,
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
                                                    getNoticeListTableData(
                                                        pageNumber + 1,
                                                        rowsPerPage,
                                                        searchFilter,
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
                </div>
            </div>
            <div
                class="hidden"
                id="rank-content"
                role="tabpanel"
            >
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
                                    />
                                </div>
                            </form>
                        </div>

                        <div
                            class="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-x-3 md:space-y-0 lg:w-3/4"
                        >
                            <div
                                class="flex w-full justify-center lg:justify-end"
                            >
                                <button
                                    on:click={handleAddActionBtn}
                                    type="button"
                                    class=" bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-4 lg:w-48"
                                >
                                    <svg
                                        class="mr-2 h-3.5 w-3.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path
                                            clip-rule="evenodd"
                                            fill-rule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        />
                                    </svg>
                                    Add Rank
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col">
                        <div class="">
                            <div class="inline-block w-full align-middle">
                                <div class="overflow-x-auto">
                                    <table
                                        class="w-full text-left text-xs text-neutral-500 dark:text-neutral-600"
                                    >
                                        <thead
                                            class="bg-neutral-100 text-xs uppercase text-gray-700 dark:bg-neutral-700 dark:text-neutral-200"
                                        >
                                            <tr>
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >ID</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >Name</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >Codes</th
                                                >
                                                <th
                                                    scope="col"
                                                    class="px-4 py-3 text-center"
                                                    >Commission(%)</th
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
                                            {#each paginatedRank as row}
                                                <tr
                                                    class="hover:bg-neutral-100 dark:hover:bg-neutral-500"
                                                >
                                                    <td
                                                        class="px-4 py-3 text-center text-sm text-black dark:text-neutral-300"
                                                        >{row.rankId}</td
                                                    >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                                        >{row.rankName}</td
                                                    >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                                        >{row.rankPromotion}</td
                                                    >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center text-black dark:text-neutral-300"
                                                        >{row.rankCommission}</td
                                                    >
                                                    <td
                                                        class="whitespace-nowrap px-4 py-3 text-center"
                                                    >
                                                        <div
                                                            class="flex items-center justify-center space-x-2"
                                                        >
                                                            <button
                                                                on:click={() =>
                                                                    handleEditRank(
                                                                        row.rankId,
                                                                    )}
                                                                type="button"
                                                                class=" bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-4"
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
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                                <div
                                    class="sticky bottom-0 right-0 items-center border-t border-neutral-200 bg-neutral-100 p-4 sm:flex sm:justify-between dark:border-neutral-500 dark:bg-neutral-700"
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
            <div
                class="hidden rounded-md border border-neutral-300 bg-white p-4 shadow 2xl:mx-80 dark:border-neutral-600 dark:bg-neutral-800"
                id="distribution-content"
                role="tabpanel"
            >
                <div class="mb-4">
                    <label
                        for="tsmultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Total Sales x %
                    </label>
                    <input
                        type="text"
                        name="tsmultiplier"
                        id="tsmultiplier"
                        bind:value={documentFormData.totalSalesMultiplier}
                        on:input={handleSalesMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="dealermultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        OMD x % (Dealer)
                    </label>
                    <input
                        type="text"
                        name="dealermultiplier"
                        id="dealermultiplier"
                        bind:value={documentFormData.dealerOMDMultiplier}
                        on:input={handleDealerMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="tlmultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        OMD x % (Team Leader)
                    </label>
                    <input
                        type="text"
                        name="tlmultiplier"
                        id="tlmultiplier"
                        bind:value={documentFormData.teamLeaderOMDMultiplier}
                        on:input={handleTeamLeaderMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="managermultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        OMD x % (Manager)
                    </label>
                    <input
                        type="text"
                        name="managermultiplier"
                        id="managermultiplier"
                        bind:value={documentFormData.managerOMDMultiplier}
                        on:input={handleManagerMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="directormultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        OMD x % (Director)
                    </label>
                    <input
                        type="text"
                        name="directormultiplier"
                        id="directormultiplier"
                        bind:value={documentFormData.directorOMDMultiplier}
                        on:input={handleDirectorMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="execpartnermultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        OMD x % (Executive Partner)
                    </label>
                    <input
                        type="text"
                        name="execpartnermultiplier"
                        id="execpartnermultiplier"
                        bind:value={documentFormData.execPartnerMultiplier}
                        on:input={handleExecPartnerMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div>
                <!-- <div class="mb-4">
                    <label
                        for="corporatemultiplier"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        OMD x % (Corporate)
                    </label>
                    <input
                        type="text"
                        name="corporatemultiplier"
                        id="corporatemultiplier"
                        bind:value={documentFormData.corporateMultiplier}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        placeholder=""
                    />
                </div> -->
            </div>
            <div
                class="hidden rounded-md border border-neutral-300 bg-white p-4 shadow 2xl:mx-80 dark:border-neutral-600 dark:bg-neutral-800"
                id="officiallink-content"
                role="tabpanel"
            >
                <div class="mb-4">
                    <label
                        for="fbLink"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Facebook
                    </label>
                    <input
                        type="text"
                        name="fbLink"
                        id="fbLink"
                        bind:value={documentFormData.facebookLink}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="ytLink"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Youtube
                    </label>
                    <input
                        type="text"
                        name="ytLink"
                        id="ytLink"
                        bind:value={documentFormData.youtubeLink}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder=""
                    />
                </div>
                <div class="mb-4">
                    <label
                        for="webLink"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Website
                    </label>
                    <input
                        type="text"
                        name="webLink"
                        id="webLink"
                        bind:value={documentFormData.websiteLink}
                        class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder=""
                    />
                </div>
            </div>

            <div
                class="hidden 2xl:px-80"
                id="privacypolicy-content"
                role="tabpanel"
            >
                <div class="">
                    <label
                        for="message"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                        >Content</label
                    >
                    <textarea
                        id="message"
                        rows="24"
                        bind:value={documentFormData.privacyPolicy}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        placeholder="Write your content here..."
                    ></textarea>
                </div>
            </div>

            <div
                class="hidden 2xl:px-80"
                id="termsandcondition-content"
                role="tabpanel"
            >
                <div class="">
                    <label
                        for="message"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                        >Content</label
                    >
                    <textarea
                        id="message"
                        rows="24"
                        bind:value={documentFormData.termsAndCondition}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        placeholder="Write your content here..."
                    ></textarea>
                </div>
            </div>
        </div>
    </div>
    {#if !['notice', 'rank', ''].includes(activeTab)}
        <footer
            class="flex w-full justify-center pb-4 2xl:absolute 2xl:bottom-32 2xl:p-4"
        >
            <div class="flex items-center justify-center space-x-4">
                <button
                    type="button"
                    on:click={handleSaveBtn}
                    class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Save
                </button>
            </div>
        </footer>
    {/if}
{:else}
    <PageNavbar titleHeader={'Settings'} />

    <div class="p-4">
        <div class="mt-12 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
            <div class="mb-8">
                <div class="mb-3 flex items-center">
                    <h3
                        class="text-xs font-medium uppercase text-gray-900 dark:text-gray-400"
                    >
                        setup
                    </h3>
                </div>

                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M11 9H5a1 1 0 0 0-1 1v4c0 .6.4 1 1 1h6m0-6v6m0-6 5.4-3.9A1 1 0 0 1 18 6v12.2a1 1 0 0 1-1.6.8L11 15m7 0a3 3 0 0 0 0-6M6 15h3v5H6v-5Z"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Announcement
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M14 6H4a1 1 0 0 0-1 1v10c0 .6.4 1 1 1h10c.6 0 1-.4 1-1V7c0-.6-.4-1-1-1Zm7 11-6-2V9l6-2v10Z"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Commercial ads
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M19 7h1v12c0 .6-.4 1-1 1h-2a1 1 0 0 1-1-1V5c0-.6-.4-1-1-1H5a1 1 0 0 0-1 1v14c0 .6.4 1 1 1h11.5M7 14h6m-6 3h6m0-10h.5m-.5 3h.5M7 7h3v3H7V7Z"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                News and promotion
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13.2 9.8a3.4 3.4 0 0 0-4.8 0L5 13.2A3.4 3.4 0 0 0 9.8 18l.3-.3m-.3-4.5a3.4 3.4 0 0 0 4.8 0L18 9.8A3.4 3.4 0 0 0 13.2 5l-1 1"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Offical link
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9.5 11.5 11 13l4-3.5M12 20A16.4 16.4 0 0 1 5 6.7L12 4l7 2.7A16.7 16.7 0 0 1 12 20Z"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Privacy policy
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M10 3v4c0 .6-.4 1-1 1H5m4 8h6m-6-4h6m4-8v16c0 .6-.4 1-1 1H6a1 1 0 0 1-1-1V8c0-.4.1-.6.3-.8l4-4 .6-.2H18c.6 0 1 .4 1 1Z"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Terms and condition
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
            </div>

            <div class="mb-4">
                <div class="mb-3 flex items-center">
                    <h3
                        class="text-xs font-medium uppercase text-gray-900 dark:text-gray-400"
                    >
                        privacy and security
                    </h3>
                </div>

                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M5 4c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Zm12 12V5H7v11h10Zm-5 1a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Screen lock login
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
                <a href="#">
                    <div class="mb-5 flex items-center justify-between pr-1">
                        <div class="flex">
                            <div class="mr-3 inline-flex items-center">
                                <svg
                                    class="h-6 w-6 text-gray-800 dark:text-white"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 14v3m-3-6V7a3 3 0 1 1 6 0v4m-8 0h10c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1H7a1 1 0 0 1-1-1v-7c0-.6.4-1 1-1Z"
                                    />
                                </svg>
                            </div>
                            <h3
                                class="flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Change password
                            </h3>
                        </div>

                        <svg
                            class="h-4 w-4 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m9 5 7 7-7 7"
                            />
                        </svg>
                    </div>
                </a>
            </div>
        </div>
    </div>
{/if}

<div
    id="noticeModalElem"
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
                    {actionBtn.isAddnotice ? 'Add' : 'Update'} Notice
                </h3>
                <button
                    type="button"
                    on:click={() => {
                        noticeModal.hide()
                        clearNoticeInput()
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
                on:submit|preventDefault={handleAddUpdateBtn}
            >
                <div class="mb-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            for="noticeType"
                            class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                            >Category</label
                        >
                        <select
                            id="noticeType"
                            name="noticeType"
                            bind:value={noticeFormData.noticeType}
                            on:change={handleNoticeTypeChange}
                            disabled={!actionBtn.isAddnotice}
                            class="focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        >
                            <option
                                value=""
                                disabled
                                selected>Category</option
                            >
                            <option value="ADVERTISEMENT">Advertisement</option>
                            <option value="ANNOUNCEMENT">Announcement</option>
                            <option value="PROMOTION">News and Promotion</option
                            >
                        </select>
                        {#if showValidateMessage.noticeType}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.noticeType}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

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
                            for="noticeImage"
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
                                    id="noticeImage"
                                    name="noticeImage"
                                    class="hidden"
                                    type="file"
                                    accept="image/jpeg, image/jpg, image/png"
                                    multiple
                                    on:change={handleNoticeImgFile}
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

                <div
                    class={Object.entries(videoData).length > 0
                        ? 'mb-2'
                        : 'mb-4'}
                >
                    <label
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                        for="noticeVideo">Upload Video</label
                    >
                    <input
                        class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
                        aria-describedby="file_input_help"
                        id="noticeVideo"
                        type="file"
                        accept="video/mp4"
                        on:change={handleNoticeVideo}
                    />
                    {#if videoData.video.data === null}
                        <p
                            class="mt-1 text-sm text-gray-500 dark:text-gray-600"
                            id="file_input_help"
                        >
                            MP4 (MAX 8MB).
                        </p>
                    {:else if videoData.video.data === ''}
                        <div class="mt-1 flex items-center justify-start">
                            <span
                                class="text-sm font-bold text-red-500 dark:text-red-600"
                                >Supported formats is mp4 & size must be 8MB or
                                less.</span
                            >
                        </div>
                    {:else}
                        <div class="mt-1 flex items-center justify-start">
                            <span
                                class="text-sm font-bold text-green-500 dark:text-green-700"
                                >Video is valid.</span
                            >
                        </div>
                    {/if}
                </div>

                {#if videoData.video.data !== null}
                    <div class="mb-4">
                        <div
                            class="rounded-lg border border-gray-200 p-2 pt-2 shadow"
                        >
                            <div class="flex flex-row gap-2 overflow-x-auto">
                                <div
                                    class="border-0.5 relative h-20 w-20 rounded-lg bg-neutral-100"
                                >
                                    <video
                                        src={videoData.video.data}
                                        class="h-full w-full rounded-lg"
                                    />
                                    <button
                                        class="absolute right-0.5 top-0.5 rounded-full bg-white p-1"
                                        type="button"
                                        on:click={() => handleDeleteVid()}
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
                            </div>
                        </div>
                    </div>
                {/if}

                <div class="mb-4">
                    <label
                        for="message"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                        >Content message</label
                    >
                    <textarea
                        id="message"
                        rows="2"
                        bind:value={noticeFormData.contentMessage}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        placeholder="Write your content here..."
                    ></textarea>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <button
                            type="submit"
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                        >
                            {actionBtn.isAddnotice ? 'Add new' : 'Update'} notice
                        </button>

                        <button
                            type="button"
                            on:click={() => {
                                isDelete = true
                                handleSaveBtn()
                            }}
                            class="{actionBtn.isAddnotice
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
                            on:click={() => noticeModal.hide()}
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
    id="rankModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="relative h-full w-full max-w-md p-4 sm:h-auto">
        <div
            class="relative rounded-lg bg-white p-4 shadow sm:p-5 dark:bg-gray-800"
        >
            <div
                class="mb-2 flex items-center justify-between rounded-t border-b pb-2 dark:border-gray-600"
            >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {actionBtn.isAddRank ? 'Add' : 'Update'} Rank
                </h3>
                <button
                    type="button"
                    on:click={() => {
                        rankModal.hide()
                        clearRankInput()
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
                on:submit|preventDefault={handleAddUpdateBtn}
            >
                <div class="mb-4">
                    <label
                        for="name"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Name
                    </label>
                    <div>
                        <div class="flex items-center justify-between">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                bind:value={rankFormData.name}
                                on:input={handleNameChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                placeholder=""
                            />
                        </div>
                        {#if showValidateMessage.name}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.name}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="mb-4">
                    <label
                        for="promotionThreshold"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Codes
                    </label>
                    <div>
                        <div class="flex items-center justify-between">
                            <input
                                type="text"
                                name="promotionThreshold"
                                id="promotionThreshold"
                                maxlength="10"
                                bind:value={rankFormData.promotionThreshold}
                                on:input={handleCodesChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                placeholder=""
                            />
                        </div>
                        {#if showValidateMessage.promotionThreshold}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.promotionThreshold}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="mb-4">
                    <label
                        for="commissionPercentage"
                        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Commission
                    </label>
                    <div>
                        <div class="flex items-center justify-between">
                            <input
                                type="text"
                                name="commissionPercentage"
                                id="commissionPercentage"
                                maxlength="10"
                                bind:value={rankFormData.commissionPercentage}
                                on:input={handleCommissionChange}
                                class="dark:focus:ring-primary-500 dark:focus:border-primary-500 block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                placeholder=""
                            />
                        </div>
                        {#if showValidateMessage.commissionPercentage}
                            <div class="mt-1 flex items-center justify-start">
                                <span class="text-sm font-bold text-red-500"
                                    >{showValidateMessage.commissionPercentage}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <button
                            type="submit"
                            class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                        >
                            {actionBtn.isAddRank ? 'Add new' : 'Update'} rank
                        </button>

                        <button
                            type="button"
                            on:click={() => {
                                isDelete = true
                                handleSaveBtn()
                            }}
                            class="{actionBtn.isAddRank
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
                            on:click={() => rankModal.hide()}
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
    id="confirmAdminSettingsModalElem"
    tabindex="-1"
    class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
>
    <div class="relative max-h-full w-full max-w-md p-4">
        <div class="relative rounded-lg bg-white shadow dark:bg-gray-700">
            <div class="p-4 text-center md:p-5">
                {#if isDelete}
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
                {:else}
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
                {/if}
                <h3
                    class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"
                >
                    Are you sure you want to
                    {#if ['notice', 'rank', ''].includes(activeTab)}
                        {#if isDelete}
                            delete
                        {:else if actionBtn.isAddnotice || actionBtn.isAddRank}
                            add
                        {:else}
                            update
                        {/if}
                    {:else}
                        save
                    {/if}
                    this {confirmFilterMessage}?
                </h3>
                <button
                    on:click={handleConfirmYesBtn}
                    type="submit"
                    class="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-800 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
                >
                    Yes
                </button>
                <button
                    on:click={() => confirmAdminSettingsModal.hide()}
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                    >No</button
                >
            </div>
        </div>
    </div>
</div>

<div
    id="successAdminSettingsModalElem"
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
                {#if alertMessage}
                    <svg
                        class="h-12 w-12 text-gray-800 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
                        />
                    </svg>
                {:else}
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
                {/if}
                <span class="sr-only">Success</span>
            </div>
            <p class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {#if alertMessage}
                    {alertMessage}
                {:else}
                    {`${confirmFilterMessage.charAt(0).toUpperCase()}${confirmFilterMessage.slice(1)}`}
                    {#if ['notice', ''].includes(activeTab)}
                        {#if isDelete}
                            deleted
                        {:else if actionBtn.isAddnotice || actionBtn.isAddRank}
                            added
                        {:else}
                            updated
                        {/if}
                    {:else}
                        saved
                    {/if}
                    successfully.
                {/if}
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

<div
    id="noticeImageModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="md:max-w-auto relative h-full w-full max-w-2xl p-4 md:h-auto">
        <div
            class="relative justify-between rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-[#666666]"
        >
            <div class="flex items-center justify-between">
                <button
                    type="button"
                    class="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                    on:click={() => noticeImageModal.hide()}
                >
                    <svg
                        class="h-3 w-3 text-gray-700"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 14"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                        />
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <div class="mt-2">
                <div class="flex items-center justify-center">
                    <div
                        class="border-0.5 relative h-auto w-auto rounded-lg bg-neutral-100"
                    >
                        <div
                            class="{Object.entries(imageData).length > 1
                                ? 'grid-cols-2'
                                : ''} grid gap-2"
                        >
                            {#each Object.entries(imageData) as [key, val]}
                                <div>
                                    <img
                                        class="h-auto max-w-full rounded-lg"
                                        src={val.data}
                                        alt=""
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div
    id="noticeVideoModalElem"
    tabindex="-1"
    aria-hidden="true"
    class="h-modal fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
>
    <div class="md:max-w-auto relative h-full w-full max-w-2xl p-4 md:h-auto">
        <div
            class="relative justify-between rounded-lg bg-white p-4 text-center shadow sm:p-5 dark:bg-[#666666]"
        >
            <div class="flex items-center justify-between">
                <button
                    type="button"
                    class="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                    on:click={() => noticeVideoModal.hide()}
                >
                    <svg
                        class="h-3 w-3 text-gray-700"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 14"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                        />
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <div>
                <div class="flex items-center justify-center">
                    <video
                        class="mt-2 aspect-video rounded-lg"
                        controls
                        src={videoData.video.data}
                        autoplay
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
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
