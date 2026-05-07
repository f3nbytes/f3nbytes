import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient
                    id="f3n-silver"
                    x1="15"
                    x2="63"
                    y1="34"
                    y2="89"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#ffffff" />
                    <stop offset="0.52" stopColor="#b7d7f5" />
                    <stop offset="1" stopColor="#55789d" />
                </linearGradient>
                <linearGradient
                    id="f3n-cyan"
                    x1="52"
                    x2="111"
                    y1="36"
                    y2="92"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#72f7ff" />
                    <stop offset="0.5" stopColor="#15c9f4" />
                    <stop offset="1" stopColor="#0275c7" />
                </linearGradient>
                <linearGradient
                    id="f3n-swoosh"
                    x1="27"
                    x2="111"
                    y1="98"
                    y2="76"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#f8fbff" />
                    <stop offset="0.55" stopColor="#18d8ff" />
                    <stop offset="1" stopColor="#0063c7" />
                </linearGradient>
                <filter
                    id="f3n-glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                    colorInterpolationFilters="sRGB"
                >
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feColorMatrix
                        in="blur"
                        type="matrix"
                        values="0 0 0 0 0.02 0 0 0 0 0.75 0 0 0 0 1 0 0 0 0.48 0"
                    />
                    <feBlend in="SourceGraphic" />
                </filter>
            </defs>
            <path
                d="M20 36H74C67.8 39.3 63.5 43.6 61.1 49H37.1L34.9 57.2H58.6C58 60.1 58 63 58.6 65.8H32.5L24.3 96L13.3 82.7L25.9 42.4L20 36Z"
                fill="url(#f3n-silver)"
            />
            <path
                d="M53.5 49C56.2 40.8 64.6 36 76.4 36H91.3C104.7 36 112.2 42.6 110.3 53.3C109.3 58.5 106.2 62.7 101.8 65.1C107.2 67.2 109.6 72.2 108.4 78.2C106.5 89 96.8 96 82.8 96H29.8L39.3 83.1H83.6C88.5 83.1 91.7 80.8 92.4 76.9C93.1 73.1 90.7 70.9 85.8 70.9H39.4L42.8 58H88.8C93.2 58 96.1 55.9 96.8 52.4C97.4 48.9 95.2 46.9 90.8 46.9H58.8L53.5 49Z"
                fill="url(#f3n-cyan)"
                filter="url(#f3n-glow)"
            />
            <path
                d="M30 102C49.7 87.7 75.8 84 103.4 86.1C77.2 94 53.8 101.3 30 102Z"
                fill="url(#f3n-swoosh)"
                opacity="0.92"
            />
            <path
                d="M34 108C55.7 99.8 76.7 99.4 97.1 103.3C75.9 108.1 55 111 34 108Z"
                fill="#22d3ee"
                opacity="0.35"
            />
            <path
                d="M102 28H109V35H102V28ZM114 35H121V42H114V35ZM95 43H101V49H95V43ZM108 49H114V55H108V49ZM118 58H124V64H118V58ZM101 61H106V66H101V61ZM112 70H117V75H112V70Z"
                fill="#20e6ff"
                filter="url(#f3n-glow)"
            />
            <path
                d="M22.5 37.6H71.5M36.2 60.7H58.7M42.2 85.4H83.3"
                stroke="white"
                strokeOpacity="0.45"
                strokeWidth="2"
            />
        </svg>
    );
}
