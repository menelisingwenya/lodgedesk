import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.4" />
      <path d="m15.8 15.8 4 4" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13.5h4l1.4 2.4h5.2l1.4-2.4h4" />
      <path d="M5.6 5.5h12.8l1.6 8v4a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.5v-4z" />
    </>
  ),
  bed: (
    <>
      <path d="M3 19v-8h18v8M3 15.5h18" />
      <path d="M7.5 15.5V11h5.6a3.4 3.4 0 0 1 3.4 3.4v1.1" />
      <circle cx="6.4" cy="12.6" r="1.5" />
      <path d="M3 8v11M21 8v11" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V6.6L12 3l8 3.6V20" />
      <path d="M3 20h18M9.4 20v-5.2h5.2V20" />
      <path d="M8 9.2h1.4M14.6 9.2H16M8 12.4h1.4M14.6 12.4H16" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M6.5 20v-7.5M12 20V5M17.5 20v-11" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7.5h8.5M18.5 7.5H20M4 16.5h3.5M13.5 16.5H20" />
      <circle cx="15.6" cy="7.5" r="2" />
      <circle cx="10.6" cy="16.5" r="2" />
    </>
  ),
  filter: <path d="M4 6.5h16M7.5 12h9M10.5 17.5h3" />,
  "chevron-down": <path d="m7 9.5 5 5 5-5" />,
  "chevron-right": <path d="m9.5 6.5 5 5.5-5 5.5" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  send: <path d="M20.5 3.5 10 14M20.5 3.5 14 21l-4-7-7-4z" />,
  mic: (
    <>
      <rect x="9.2" y="3" width="5.6" height="10.8" rx="2.8" />
      <path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6V21" />
    </>
  ),
  audio: <path d="M4 10.5v3M8 7.5v9M12 4.5v15M16 8.5v7M20 11v2" />,
  bell: (
    <>
      <path d="M18 8.4a6 6 0 1 0-12 0c0 4.8-2 6.1-2 6.1h16s-2-1.3-2-6.1Z" />
      <path d="M10.3 19.4a2.1 2.1 0 0 0 3.4 0" />
    </>
  ),
  check: <path d="m5 12.5 4.4 4.5L19 7.5" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="m8.3 12.2 2.5 2.5 4.9-5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.8v4.6l3 1.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9.2" cy="8.6" r="3.2" />
      <path d="M3.6 19a5.6 5.6 0 0 1 11.2 0" />
      <path d="M16 5.9a3 3 0 0 1 0 5.7M17.6 19a5.6 5.6 0 0 0-2.7-4.7" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.2v4.2M12 16.6v4.2M3.2 12h4.2M16.6 12h4.2" />
      <path d="m5.8 5.8 3 3M15.2 15.2l3 3M18.2 5.8l-3 3M8.8 15.2l-3 3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.4" width="16" height="14.6" rx="2.2" />
      <path d="M8.2 3v4.2M15.8 3v4.2M4 10.4h16" />
    </>
  ),
  dollar: <path d="M12 3.2v17.6M16.4 7.6c0-1.9-2-3-4.4-3s-4.4 1.1-4.4 3 2 2.7 4.4 3.2 4.4 1.3 4.4 3.3-2 3-4.4 3-4.4-1.1-4.4-3" />,
  more: (
    <>
      <circle cx="6.4" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  phone: <path d="M6.2 3.8h3l1.4 3.5-2 1.4a11.6 11.6 0 0 0 5.7 5.7l1.4-2 3.5 1.4v3c0 1-.8 1.8-1.8 1.8A15.8 15.8 0 0 1 4.4 5.6c0-1 .8-1.8 1.8-1.8Z" />,
  mail: (
    <>
      <rect x="3" y="5.4" width="18" height="13.2" rx="2.2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8.6 8.6" />
      <path d="M18 14v5.2A1.8 1.8 0 0 1 16.2 21H4.8A1.8 1.8 0 0 1 3 19.2V7.8A1.8 1.8 0 0 1 4.8 6H10" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5.8A1.8 1.8 0 0 0 4 5.8v12.4A1.8 1.8 0 0 0 5.8 20H10" />
      <path d="M15 8l4 4-4 4M9.5 12H19" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  stroke = 1.6,
  className,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
