import type { CSSProperties } from 'react'

type PetalStyle = CSSProperties & {
  '--tx': string
  '--ty': string
  '--rot': string
  '--delay': string
}

const petals: { d: string; style: PetalStyle }[] = [
  {
    d: 'M50 9 C60 20, 61 26, 50 31 C39 26, 40 20, 50 9Z',
    style: { '--tx': '-8px', '--ty': '42px', '--rot': '95deg', '--delay': '0s' },
  },
  {
    d: 'M71 15 C73 30, 70 36, 59 37 C57 26, 61 20, 71 15Z',
    style: { '--tx': '18px', '--ty': '45px', '--rot': '150deg', '--delay': '0.22s' },
  },
  {
    d: 'M88 36 C75 45, 69 46, 64 37 C72 29, 79 30, 88 36Z',
    style: { '--tx': '30px', '--ty': '38px', '--rot': '210deg', '--delay': '0.44s' },
  },
  {
    d: 'M88 64 C73 63, 67 59, 68 48 C79 47, 84 53, 88 64Z',
    style: { '--tx': '26px', '--ty': '50px', '--rot': '260deg', '--delay': '0.66s' },
  },
  {
    d: 'M50 91 C40 80, 39 74, 50 69 C61 74, 60 80, 50 91Z',
    style: { '--tx': '6px', '--ty': '56px', '--rot': '320deg', '--delay': '0.88s' },
  },
  {
    d: 'M29 85 C27 70, 30 64, 41 63 C43 74, 39 80, 29 85Z',
    style: { '--tx': '-18px', '--ty': '48px', '--rot': '-210deg', '--delay': '1.1s' },
  },
  {
    d: 'M12 64 C25 55, 31 54, 36 63 C28 71, 21 70, 12 64Z',
    style: { '--tx': '-30px', '--ty': '40px', '--rot': '-150deg', '--delay': '1.32s' },
  },
  {
    d: 'M12 36 C27 37, 33 41, 32 52 C21 53, 16 47, 12 36Z',
    style: { '--tx': '-24px', '--ty': '50px', '--rot': '-95deg', '--delay': '1.54s' },
  },
  {
    d: 'M29 15 C42 22, 45 28, 39 37 C29 32, 25 25, 29 15Z',
    style: { '--tx': '-10px', '--ty': '44px', '--rot': '-260deg', '--delay': '1.76s' },
  },
]

export default function SunLogo() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="30"
      height="30"
      aria-hidden="true"
      className="sonyachna-sun-logo"
    >
      <defs>
        <radialGradient id="sonyachnaSunCore" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE8A8" />
          <stop offset="45%" stopColor="#E9B85B" />
          <stop offset="100%" stopColor="#B97922" />
        </radialGradient>

        <linearGradient id="sonyachnaPetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0B8" />
          <stop offset="45%" stopColor="#E8B354" />
          <stop offset="100%" stopColor="#A86D1D" />
        </linearGradient>
      </defs>

      <g className="sun-petals">
        {petals.map((petal, index) => (
          <path
            key={index}
            d={petal.d}
            fill="url(#sonyachnaPetal)"
            style={petal.style}
          />
        ))}
      </g>

      <circle
        className="sun-core"
        cx="50"
        cy="50"
        r="13"
        fill="url(#sonyachnaSunCore)"
      />

      <circle
        className="sun-core-highlight"
        cx="45"
        cy="44"
        r="4"
        fill="rgba(255,255,255,0.35)"
      />
    </svg>
  )
}