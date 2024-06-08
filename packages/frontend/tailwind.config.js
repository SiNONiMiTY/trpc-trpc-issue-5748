import flowbitePlugin from 'flowbite/plugin'
import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        './node_modules/flowbite/**/*.js', // Flowbite
    ],
    darkMode: 'class',
    plugins: [flowbitePlugin],
    theme: {
        extend: {
            colors: {
                primary: {
                    // Flowbite Svelte Primary Color Palette
                    // https://flowbite-svelte.com/docs/pages/colors#Primary_color_in_tailwind.config.cjs
                    50: '#FFF5F2',
                    100: '#FFF1EE',
                    200: '#FFE4DE',
                    300: '#FFD5CC',
                    400: '#FFBCAD',
                    500: '#FE795D',
                    600: '#EF562F',
                    700: '#EB4F27',
                    800: '#CC4522',
                    900: '#A5371B',
                },
            },
        },
        fontFamily: {
            sans: [
                'Inter',
                ...defaultTheme.fontFamily.sans,
            ],
        },
    },
}

export default config
