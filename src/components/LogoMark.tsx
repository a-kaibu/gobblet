interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 38 }: LogoMarkProps) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="13"
        fill="#0d1814"
        stroke="rgba(217, 184, 108, 0.38)"
      />
      <ellipse cx="24" cy="34" rx="15" ry="6.5" fill="#c9a86a" opacity="0.16" />
      <circle cx="24" cy="30" r="14" fill="#1b2422" stroke="#d9b86c" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="10" fill="#efe4cd" stroke="#a8834e" strokeWidth="1.2" />
      <circle cx="24" cy="19" r="6" fill="#232b29" stroke="#d9b86c" strokeWidth="1.1" />
      <ellipse cx="21" cy="27" rx="3" ry="2" fill="#fffdf5" opacity="0.5" />
      <ellipse cx="22" cy="22" rx="2" ry="1.4" fill="#ffffff" opacity="0.2" />
    </svg>
  );
}
