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
    <svg {...iconProps(props)} strokeWidth={1.5} viewBox="0 0 20 20">
      <path d="M14.1057 14.2 17 17" />
      <path d="M9.5 6a3 3 0 0 1 3 3" />
      <path d="M16.0667 9.53333a6.53334 6.53334 0 1 1-13.0667 0 6.53334 6.53334 0 0 1 13.0667 0Z" />
    </svg>
  );
}

export function AdminChevronDownIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)} strokeWidth={2}>
      <path d="M7 10 12.0008 14.58 17 10" />
    </svg>
  );
}

export function AdminCheckIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)} strokeWidth={2}>
      <path d="M16.8 8.4 9.64048 15.6 7.2 13.1457" />
    </svg>
  );
}

export function AdminArrowRightIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)} strokeWidth={1.5} viewBox="0 0 16 16">
      <path d="M8.88889 12.6667 13.3333 8 8.88889 3.33333M13.3333 8 2.66667 8" />
    </svg>
  );
}

export function AdminCalendarIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)} strokeWidth={2}>
      <path d="M7.75 17.2202v-.0774M12.25 17.2202v-.0774M12.25 13.0286v-.0774M16.25 13.0286v-.0774M4.75 8.91425h14M6.55952 3v1.54304M16.75 3v1.54285M16.75 4.54285h-10c-1.65685 0-3 1.38151-3 3.0857V17.9143C3.75 19.6185 5.09315 21 6.75 21h10c1.6569 0 3-1.3815 3-3.0857V7.62855c0-1.70419-1.3431-3.0857-3-3.0857Z" />
    </svg>
  );
}

export function AdminFolderUpIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)} strokeWidth={2} viewBox="0 0 20 20">
      <path d="M11.6883 16.4264H3.97815c-1.10458 0-2-.8955-2-2l.00008-7.60366c0-.7616-.00028-1.84638-.00052-2.63183-.00017-.55243.44761-.99975 1.00004-.99975h4.76517l2.30418 2.46137h6.9303c.5523 0 1 .44771 1 1v2.65631M18.0223 13.7523l-1.9548-1.9435-2.0452 2.0355M16.0675 11.8088v5" />
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

export function AdminPackageIcon(props: AdminIconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="M4 7.5v9L12 21l8-4.5v-9" />
      <path d="M12 12v9" />
      <path d="m8 5.25 8 4.5" />
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
