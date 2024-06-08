import type { AppRouter } from '@trpc-subscription/backend/trpc/v1/router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { customAlphabet } from 'nanoid'
import superjson from 'superjson'

import { PUBLIC_API_ENDPOINT, PUBLIC_STORAGE_URL } from '$env/static/public'

/**
 * Debounce Function
 * https://www.freecodecamp.org/news/javascript-debounce-example
 * https://stackoverflow.com/questions/72205837/safe-type-debounce-function-in-typescript
 */

export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    interval = 1000,
) => {
    let timer: ReturnType<typeof setTimeout>
    return function (this: T, ...args: Parameters<T>) {
        clearTimeout(timer)
        timer = setTimeout(() => {
            callback.apply(this, args)
        }, interval)
    }
}

/**
 * Form Data to Object Converter
 */

export const formDataToObject = (
    formData: FormData,
    multiValueFieldKeys: string[] = [],
) => {
    const formDataEntries: Record<
        string,
        FormDataEntryValue | FormDataEntryValue[]
    > = Object.fromEntries(formData)

    Object.keys(formDataEntries).forEach((key) => {
        const data = formData.getAll(key)
        formDataEntries[key] = multiValueFieldKeys.includes(key)
            ? data
            : data[0]
    })

    return formDataEntries
}

/**
 * tRPC HTTP Client
 */

export const trpcClient = (sessionId: string = '') =>
    createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url: PUBLIC_API_ENDPOINT,
                transformer: superjson,
                headers: {
                    authorization: `Bearer ${sessionId}`,
                },
            }),
        ],
    })

export const getImageDataURL = async (
    imgRecord: Record<
        string,
        { data: string | null; type: string; name: string }
    >,
    userId: string,
    sharedAccessSignature: string,
) => {
    for (const image in imgRecord) {
        const { name } = imgRecord[image]

        // Build the request
        const requestHeaders = new Headers()
        requestHeaders.append('x-ms-blob-type', 'BlockBlob')

        const request: RequestInit = {
            mode: 'cors',
            method: 'GET',
            headers: requestHeaders,
            redirect: 'follow',
        }

        // Build the URL where we will store the resource
        const storageUrl = [
            `${PUBLIC_STORAGE_URL}/`,
            'private/',
            'users/',
            `${userId}/`,
            `${name}${sharedAccessSignature}`,
        ].join('')

        const fetchResponse = await fetch(storageUrl, request)
        const screenShotBlob = await fetchResponse.blob()
        imgRecord[image].data = URL.createObjectURL(screenShotBlob)
    }

    return imgRecord
}

export const getPublicImageDataURL = async (
    imgRecord: Record<
        string,
        { data: string | null; type: string; name: string }
    >,
) => {
    for (const image in imgRecord) {
        const { name } = imgRecord[image]
        // Build the request
        const requestHeaders = new Headers()
        requestHeaders.append('x-ms-blob-type', 'BlockBlob')

        const request: RequestInit = {
            mode: 'cors',
            method: 'GET',
            headers: requestHeaders,
            redirect: 'follow',
        }

        // Build the URL where we will store the resource
        const storageUrl = [
            `${PUBLIC_STORAGE_URL}/`,
            `public/`,
            `${name}`,
        ].join('')

        const fetchResponse = await fetch(storageUrl, request)
        const screenShotBlob = await fetchResponse.blob()
        imgRecord[image].data = URL.createObjectURL(screenShotBlob)
    }

    return imgRecord
}

export const postPublicImageDataURL = async (
    imgRecord: Record<
        string,
        { data: string | null; type: string; name: string }
    >,
    sharedAccessSignature: string,
) => {
    const uploadRequests: Promise<Response>[] = []

    for (const image in imgRecord) {
        const { data, type, name } = imgRecord[image]

        // Nothing to do...
        if (!data) continue

        // Convert the data as blob
        const imageData = await fetch(data)
        const imageBlob = await imageData.blob()

        // Build the request
        const requestHeaders = new Headers()
        requestHeaders.append('x-ms-blob-type', 'BlockBlob')
        requestHeaders.append('Content-Type', `image/${type}`)

        const request: RequestInit = {
            mode: 'cors',
            method: 'PUT',
            headers: requestHeaders,
            body: imageBlob,
            redirect: 'follow',
        }

        // Build the URL where we will store the resource
        const storageUrl = [
            `${PUBLIC_STORAGE_URL}/`,
            `public/`,
            `${name}${sharedAccessSignature}`,
        ].join('')

        // Promisify the fetch request
        uploadRequests.push(fetch(storageUrl, request))
    }

    // Process all requests simultaneously
    await Promise.all(uploadRequests)
}

export const postPublicVideoDataURL = async (
    videoRecord: Record<
        string,
        { data: string | null; type: string; name: string }
    >,
    sharedAccessSignature: string,
) => {
    const uploadRequests: Promise<Response>[] = []

    for (const video in videoRecord) {
        const { data, type, name } = videoRecord[video]

        // Nothing to do...
        if (!data) continue

        // Convert the data as blob
        const videoData = await fetch(data)
        const videoBlob = await videoData.blob()

        // Build the request
        const requestHeaders = new Headers()
        requestHeaders.append('x-ms-blob-type', 'BlockBlob')
        requestHeaders.append('Content-Type', `video/${type}`)

        const request: RequestInit = {
            mode: 'cors',
            method: 'PUT',
            headers: requestHeaders,
            body: videoBlob,
            redirect: 'follow',
        }

        // Build the URL where we will store the resource
        const storageUrl = [
            `${PUBLIC_STORAGE_URL}/`,
            `public/`,
            `${name}${sharedAccessSignature}`,
        ].join('')

        // Promisify the fetch request
        uploadRequests.push(fetch(storageUrl, request))
    }

    // Process all requests simultaneously
    await Promise.all(uploadRequests)
}

export const postImageDataURL = async (
    imgRecord: Record<
        string,
        { data: string | null; type: string; name: string }
    >,
    userId: string,
    sharedAccessSignature: string,
) => {
    const uploadRequests: Promise<Response>[] = []

    for (const image in imgRecord) {
        const { data, type, name } = imgRecord[image]

        // Nothing to do...
        if (!data) continue

        // Convert the data as blob
        const imageData = await fetch(data)
        const imageBlob = await imageData.blob()

        // Build the request
        const requestHeaders = new Headers()
        requestHeaders.append('x-ms-blob-type', 'BlockBlob')
        requestHeaders.append('Content-Type', `image/${type}`)

        const request: RequestInit = {
            mode: 'cors',
            method: 'PUT',
            headers: requestHeaders,
            body: imageBlob,
            redirect: 'follow',
        }

        // Build the URL where we will store the resource
        const storageUrl = [
            `${PUBLIC_STORAGE_URL}/`,
            'private/',
            'users/',
            `${userId}/`,
            `${name}${sharedAccessSignature}`,
        ].join('')

        // Promisify the fetch request
        uploadRequests.push(fetch(storageUrl, request))
    }

    // Process all requests simultaneously
    await Promise.all(uploadRequests)
}

export const postVideoDataURL = async (
    videoRecord: Record<
        string,
        { data: string | null; type: string; name: string }
    >,
    userId: string,
    sharedAccessSignature: string,
) => {
    const uploadRequests: Promise<Response>[] = []

    for (const video in videoRecord) {
        const { data, type, name } = videoRecord[video]

        // Nothing to do...
        if (!data) continue

        // Convert the data as blob
        const videoData = await fetch(data)
        const videoBlob = await videoData.blob()

        // Build the request
        const requestHeaders = new Headers()
        requestHeaders.append('x-ms-blob-type', 'BlockBlob')
        requestHeaders.append('Content-Type', `video/${type}`)

        const request: RequestInit = {
            mode: 'cors',
            method: 'PUT',
            headers: requestHeaders,
            body: videoBlob,
            redirect: 'follow',
        }

        // Build the URL where we will store the resource
        const storageUrl = [
            `${PUBLIC_STORAGE_URL}/`,
            'private/',
            'users/',
            `${userId}/`,
            `${name}${sharedAccessSignature}`,
        ].join('')

        // Promisify the fetch request
        uploadRequests.push(fetch(storageUrl, request))
    }

    // Process all requests simultaneously
    await Promise.all(uploadRequests)
}

export const nanoidCustom = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    12,
)
