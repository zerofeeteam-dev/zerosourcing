import type { SVGProps } from "react";

type AdminIconProps = SVGProps<SVGSVGElement> & {
  readonly size?: number;
};

function iconProps({ size = 18, ...props }: AdminIconProps) {
  return {
    "aria-hidden": true,
    fill: "none",
    focusable: false,
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: size,
    ...props,
  };
}

export function AdminSearchIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function AdminChevronDownIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AdminPlusIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function AdminUploadIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function AdminTrashIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M5 7h14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M8 7l1-3h6l1 3" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  );
}

export function AdminEditIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

export function AdminExternalLinkIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M14 4h6v6" />
      <path d="m10 14 10-10" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function AdminFileIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

export function AdminCloseIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}
