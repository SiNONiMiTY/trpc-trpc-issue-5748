// PostCSS Configuration Format
// https://github.com/postcss/postcss-load-config

/** @type {import('postcss-load-config').Config} */
const config = {
    // Plugin execution order is determined by declaration in the plugins section (top-down)
    // https://github.com/postcss/postcss-load-config#ordering
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        cssnano: {
            preset: 'default',
        },
    },
}

export default config
