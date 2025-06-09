/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx,md,mdx}",
      "./docs/**/*.{md,mdx}"
    ],
    theme: { extend: {} },
    plugins: [],
    darkMode: ["class", '[data-theme="dark"]'],
    corePlugins: { preflight: false }, // Prevents Tailwind from overriding Docusaurus defaults
    blocklist: ["container"], // Optional: disables Tailwind's container class
  };
  