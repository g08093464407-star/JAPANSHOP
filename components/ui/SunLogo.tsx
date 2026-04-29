export default function SunLogo() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="28"
      height="28"
    >
      {/* CORE */}
      <g className="sun-core">
        <circle cx="50" cy="50" r="12" fill="#E6B85C" />
      </g>

      {/* PETALS */}
      <g className="sun-petals" fill="#E6B85C">
        <path d="M50 10 C60 25, 60 25, 50 30 C40 25, 40 25, 50 10Z"/>
        <path d="M85 50 C70 60, 70 60, 65 50 C70 40, 70 40, 85 50Z"/>
        <path d="M50 90 C40 75, 40 75, 50 70 C60 75, 60 75, 50 90Z"/>
        <path d="M15 50 C30 40, 30 40, 35 50 C30 60, 30 60, 15 50Z"/>

        <path d="M75 25 C65 35, 65 35, 60 30 C65 20, 65 20, 75 25Z"/>
        <path d="M75 75 C65 65, 65 65, 60 70 C65 80, 65 80, 75 75Z"/>
        <path d="M25 75 C35 65, 35 65, 40 70 C35 80, 35 80, 25 75Z"/>
        <path d="M25 25 C35 35, 35 35, 40 30 C35 20, 35 20, 25 25Z"/>
      </g>
    </svg>
  )
}