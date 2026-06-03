/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cockpit: { black:'#060810', deep:'#0A0F1C', panel:'#0F1828', border:'#1A2840', dim:'#1E3050' },
        cyan:  { DEFAULT:'#00D4FF', dim:'#0099BB' },
        amber: { DEFAULT:'#FFB800', dim:'#CC9200' },
        lime:  { DEFAULT:'#00FF88', dim:'#00CC6A' },
        alert: { DEFAULT:'#FF3B3B', dim:'#CC2F2F' },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
        mono: ['"JetBrains Mono"','"Courier New"','monospace'],
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-in-out',
        'slide-down':'slideDown 0.3s ease-out',
        'blink':     'blink 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%':{opacity:0},'100%':{opacity:1} },
        slideDown: { '0%':{opacity:0,transform:'translateY(-8px)'},'100%':{opacity:1,transform:'translateY(0)'} },
        blink:     { '0%,100%':{opacity:1},'50%':{opacity:0.3} },
      },
    },
  },
  plugins: [],
}
