/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['cdn.sanity.io']
    },
    // async headers() {
    //     return [
    //         {
    //             // Apply these headers to all routes in your application.
    //             source: '/(.*)',
    //             headers: [
    //                 {
    //                     key: 'Cache-Control',
    //                     value: 'no-store, must-revalidate',
    //                 },
    //             ],
    //         },
    //     ]
    // },
}

module.exports = nextConfig
