/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1d4ed8", // The HealNexus Blue
                secondary: "#0ea5e9",
            }
        },
    },
    plugins: [],
}