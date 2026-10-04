interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-8 h-8" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-label="Disce! Logo"
    >
      <rect width="512" height="512" rx="128" fill="#22c55e" />
      <text
        x="46%"
        y="50%"
        textAnchor="middle"
        dy=".32em"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="280"
        fill="#ffffff"
      >
        D!
      </text>
    </svg>
  );
}
