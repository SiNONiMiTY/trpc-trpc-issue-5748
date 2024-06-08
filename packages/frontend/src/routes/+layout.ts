import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

import { PUBLIC_APP_HOME } from '$env/static/public'
import type { LayoutLoad } from './$types.js'

export const prerender = true
export const ssr = false

export const load = (() => {
    /**
     * Capacitor API
     * https://capacitorjs.com/docs/apis/app#addlistenerbackbutton-
     *
     * Instead of closing the app, go back to the previous
     * page when the hardware back button is pressed.
     */

    if (Capacitor.isNativePlatform()) {
        CapacitorApp.removeAllListeners()
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack || window.location.pathname === PUBLIC_APP_HOME) {
                confirm('Exit the application?')
                    ? CapacitorApp.exitApp()
                    : false
            } else {
                window.history.back()
            }
        })
    }
}) satisfies LayoutLoad
