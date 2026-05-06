interface Props {
  size?: number;
  className?: string;
}

export function Logo({ size = 26, className }: Props) {
  const inner = size * 0.55;
  const radius = Math.round(size * 0.27);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "#3f3d8a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 3 5-5" />
      </svg>
    </div>
  );
}
