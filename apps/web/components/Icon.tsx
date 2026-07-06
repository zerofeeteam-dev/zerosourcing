import type { ReactElement, SVGProps } from "react";
import {
  SavedArrowCurveLeftDownIcon,
  SavedArrowCurveLeftRightIcon,
  SavedArrowCurveLeftUpIcon,
  SavedArrowCurveRightUpIcon,
  SavedArrowCurveUpLeftIcon,
  SavedArrowDownLeftIcon,
  SavedArrowDownSquareContainedIcon,
  SavedArrowLeftSquareContainedIcon,
  SavedArrowRightSquareContainedIcon,
  SavedArrowUpSquareContainedIcon,
} from "./icons";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "arrow-right-banner"
  | "arrow-refresh-04"
  | "bell-02"
  | "calendar-02"
  | "camera-lens"
  | "card-02"
  | "check"
  | "chevron-right"
  | "code-02"
  | "component"
  | "chevron-down"
  | "currency-coin-dollar"
  | "device-mobile"
  | "edit-03"
  | "file-edit-02"
  | "headphones"
  | "home-02"
  | "image-03"
  | "line-chart-up-02"
  | "map-02"
  | "menu-01"
  | "message-typing"
  | "package-02"
  | "pen-tool-03"
  | "quote-left"
  | "share"
  | "stars"
  | "user-profile-03"
  | "webcam"
  | "wrench"
  | "x-03"
  | "arrow-curve-left-down"
  | "arrow-curve-left-right"
  | "arrow-curve-left-up"
  | "arrow-down-left"
  | "arrow-curve-up-left"
  | "arrow-curve-right-up"
  | "arrow-left-square-contained"
  | "arrow-right-square-contained"
  | "arrow-up-square-contained"
  | "arrow-down-square-contained";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  size?: number;
};
type IconComponentProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
};
type IconComponent = (props: IconComponentProps) => ReactElement;

function ArrowLeftIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.11088 3.33333L2.66644 8L7.11088 12.6667M2.66644 8L13.3331 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArrowRightIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.88889 12.6667L13.3333 8L8.88889 3.33333M13.3333 8L2.66667 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArrowRightBannerIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.9167 17L17.5 12L12.9167 7M17.5 12L6.5 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronRightIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 7L15 12L10 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HeadphonesIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 13V12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12V13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6 13H8V19H6C4.89543 19 4 18.1046 4 17V15C4 13.8954 4.89543 13 6 13ZM18 13H16V19H18C19.1046 19 20 18.1046 20 17V15C20 13.8954 19.1046 13 18 13Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FileEdit02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 3.5V8C14 8.55228 14.4477 9 15 9H19.5M13 20.5H6C5.17157 20.5 4.5 19.8284 4.5 19V5C4.5 4.17157 5.17157 3.5 6 3.5H14.25L19.5 8.75V12"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14.5 19.5L15 17L19.75 12.25C20.1642 11.8358 20.8358 11.8358 21.25 12.25C21.6642 12.6642 21.6642 13.3358 21.25 13.75L16.5 18.5L14.5 19.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WrenchIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.7 6.3C15.8 5.2 17.4 4.9 18.8 5.3L16.5 7.6L16.4 9.5L18.3 9.4L20.6 7.1C21 8.5 20.7 10.1 19.6 11.2C18.4 12.4 16.7 12.7 15.2 12.2L8.2 19.2C7.4 20 6.1 20 5.3 19.2C4.5 18.4 4.5 17.1 5.3 16.3L12.3 9.3C11.8 7.8 12.1 6.1 14.7 6.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CheckIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 12 12"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 6.1L5 8.5L9.5 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function Calendar02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.33333 2V4M10.6667 2V4M2.66667 6.16667H13.3333M4 3.16667H12C12.7364 3.16667 13.3333 3.76362 13.3333 4.5V12C13.3333 12.7364 12.7364 13.3333 12 13.3333H4C3.26362 13.3333 2.66667 12.7364 2.66667 12V4.5C2.66667 3.76362 3.26362 3.16667 4 3.16667Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function ComponentIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 3.5L20.5 8.25L12 13L3.5 8.25L12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4 12L12 16.5L20 12M4 15.75L12 20.25L20 15.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Bell02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 17.5H16M10 19.5C10.4 20.1 11.1 20.5 12 20.5C12.9 20.5 13.6 20.1 14 19.5M6.5 17.5C7.4 16.7 8 15.7 8 14.4V10.5C8 8.3 9.8 6.5 12 6.5C14.2 6.5 16 8.3 16 10.5V14.4C16 15.7 16.6 16.7 17.5 17.5H6.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Card02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.5 7.5C4.5 6.7 5.2 6 6 6H18C18.8 6 19.5 6.7 19.5 7.5V16.5C19.5 17.3 18.8 18 18 18H6C5.2 18 4.5 17.3 4.5 16.5V7.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.8 10H19.2M7.5 14.5H11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Map02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 18.5L4.5 20V6L8 4.5M8 18.5V4.5M8 18.5L16 20M8 4.5L16 6M16 20L19.5 18.5V4.5L16 6M16 20V6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14 10.5C14 11.6 13.1 12.5 12 12.5C10.9 12.5 10 11.6 10 10.5C10 9.4 10.9 8.5 12 8.5C13.1 8.5 14 9.4 14 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CameraLensIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 20.5C16.7 20.5 20.5 16.7 20.5 12C20.5 7.3 16.7 3.5 12 3.5C7.3 3.5 3.5 7.3 3.5 12C3.5 16.7 7.3 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8L16 15H8L12 8ZM6.4 11.5H17.6M9 5.4L15 18.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WebcamIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 8.5C9 6.84315 10.3431 5.5 12 5.5C13.6569 5.5 15 6.84315 15 8.5V12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12V8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5V12C6.5 15.0376 8.96243 17.5 12 17.5M17.5 11.5V12C17.5 15.0376 15.0376 17.5 12 17.5M12 17.5V20M9.5 20H14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserProfile03Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.5 8.5C15.5 10.433 13.933 12 12 12C10.067 12 8.5 10.433 8.5 8.5C8.5 6.567 10.067 5 12 5C13.933 5 15.5 6.567 15.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 19C6.6 16.8 8.9 15.5 12 15.5C15.1 15.5 17.4 16.8 18.5 19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Image03Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5 6.5C5 5.7 5.7 5 6.5 5H17.5C18.3 5 19 5.7 19 6.5V17.5C19 18.3 18.3 19 17.5 19H6.5C5.7 19 5 18.3 5 17.5V6.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8 15L10.6 12.4L13 14.7L14.4 13.3L17 16M8.5 9H8.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShareIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.5 8.5L12 4M12 4L7.5 8.5M12 4V15M6 12.5V18C6 18.8 6.7 19.5 7.5 19.5H16.5C17.3 19.5 18 18.8 18 18V12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ArrowRefresh04Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 19.3688C5.60879 17.9836 4 15.3947 4 12.4295C4 9.06753 6.06817 6.18925 9 5.00085M9 16.9357V20.9412H5M16 5.57241C18.3912 6.95754 20 9.54646 20 12.5117C20 15.8736 17.9318 18.7519 15 19.9403M15 8.00548V3.99999H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function Code02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 8L5 12L9 16M15 8L19 12L15 16M13.5 5.5L10.5 18.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CurrencyCoinDollarIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M14.5 9.5C14.1 8.7 13.2 8 12 8C10.6 8 9.5 8.8 9.5 10C9.5 11.2 10.6 11.6 12 12C13.4 12.4 14.5 12.8 14.5 14C14.5 15.2 13.4 16 12 16C10.8 16 9.9 15.3 9.5 14.5M12 6.5V8M12 16V17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function LineChartUp02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 19H20M6 16L10 12L13 15L19 8M19 8V13M19 8H14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Edit03Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.8 19.5516H19.8M4.20003 19.5516L8.56602 18.6719C8.79779 18.6252 9.01061 18.511 9.17775 18.3438L18.9514 8.56478C19.42 8.09592 19.4197 7.33593 18.9507 6.86747L16.8803 4.7994C16.4115 4.33113 15.6519 4.33145 15.1835 4.80011L5.40879 14.5802C5.24198 14.7471 5.12808 14.9594 5.08133 15.1907L4.20003 19.5516Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PenTool03Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 4L19.5 11.5L15.2 18.8L12 20L8.8 18.8L4.5 11.5L12 4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 4V10.5M12 10.5L9.5 17.5M12 10.5L14.5 17.5M9.5 17.5H14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MessageTypingIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.49957 12.0846V12M11.9991 12.0846V12M16.4987 12.0846V12M20.9983 12C20.9983 13.2938 20.7253 14.5238 20.2338 15.6356L21 20.9991L16.4039 19.85C15.1019 20.5823 13.5993 21 11.9991 21C7.02906 21 3 16.9706 3 12C3 7.02944 7.02906 3 11.9991 3C16.9692 3 20.9983 7.02944 20.9983 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function Menu01Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function X03Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function StarsIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.5 4.5L10.9 8.1L14.5 9.5L10.9 10.9L9.5 14.5L8.1 10.9L4.5 9.5L8.1 8.1L9.5 4.5ZM16.5 12L17.4 14.1L19.5 15L17.4 15.9L16.5 18L15.6 15.9L13.5 15L15.6 14.1L16.5 12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Package02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 8L12 12.25L19.5 8M12 12.25V20.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DeviceMobileIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 3.5H16C17.1046 3.5 18 4.39543 18 5.5V18.5C18 19.6046 17.1046 20.5 16 20.5H8C6.89543 20.5 6 19.6046 6 18.5V5.5C6 4.39543 6.89543 3.5 8 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 6.5H14M11.5 17.5H12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Home02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 10.75L12 4L20 10.75V19C20 19.5523 19.5523 20 19 20H15V14H9V20H5C4.44772 20 4 19.5523 4 19V10.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function QuoteLeftIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 9 8"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0.5 7.88281C0.223857 7.88281 0 7.65896 0 7.38281V4.59923C0 2.43069 1.28666 0.640787 3.43203 0.0187124C3.73122 -0.068043 4.01439 0.169105 4.01439 0.480625V1.16462C4.01439 1.3938 3.85696 1.58988 3.64154 1.66808C2.60833 2.04313 2.00838 2.80907 1.87421 3.92093C1.84113 4.19509 2.06918 4.42013 2.34532 4.42013H3.19065C3.46679 4.42013 3.69065 4.64398 3.69065 4.92013V7.38281C3.69065 7.65895 3.46679 7.88281 3.19065 7.88281H0.5ZM5.48561 7.88281C5.20947 7.88281 4.98561 7.65896 4.98561 7.38281V4.59923C4.98561 2.43069 6.27227 0.640787 8.41764 0.0187124C8.71684 -0.068043 9 0.169105 9 0.480625V1.16462C9 1.3938 8.84257 1.58988 8.62715 1.66808C7.59394 2.04313 6.99399 2.80907 6.85982 3.92093C6.82674 4.19509 7.05479 4.42013 7.33093 4.42013H8.17626C8.4524 4.42013 8.67626 4.64398 8.67626 4.92013V7.38281C8.67626 7.65895 8.4524 7.88281 8.17626 7.88281H5.48561Z"
        fill="currentColor"
      />
    </svg>
  );
}

const icons = {
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-right-banner": ArrowRightBannerIcon,
  "arrow-refresh-04": ArrowRefresh04Icon,
  "bell-02": Bell02Icon,
  "calendar-02": Calendar02Icon,
  "camera-lens": CameraLensIcon,
  "card-02": Card02Icon,
  check: CheckIcon,
  "chevron-right": ChevronRightIcon,
  "code-02": Code02Icon,
  component: ComponentIcon,
  "chevron-down": ChevronDownIcon,
  "currency-coin-dollar": CurrencyCoinDollarIcon,
  "device-mobile": DeviceMobileIcon,
  "edit-03": Edit03Icon,
  "file-edit-02": FileEdit02Icon,
  headphones: HeadphonesIcon,
  "home-02": Home02Icon,
  "image-03": Image03Icon,
  "line-chart-up-02": LineChartUp02Icon,
  "map-02": Map02Icon,
  "menu-01": Menu01Icon,
  "message-typing": MessageTypingIcon,
  "package-02": Package02Icon,
  "pen-tool-03": PenTool03Icon,
  "quote-left": QuoteLeftIcon,
  share: ShareIcon,
  stars: StarsIcon,
  "user-profile-03": UserProfile03Icon,
  webcam: WebcamIcon,
  wrench: WrenchIcon,
  "x-03": X03Icon,
  "arrow-curve-left-down": SavedArrowCurveLeftDownIcon,
  "arrow-curve-left-right": SavedArrowCurveLeftRightIcon,
  "arrow-curve-left-up": SavedArrowCurveLeftUpIcon,
  "arrow-down-left": SavedArrowDownLeftIcon,
  "arrow-curve-up-left": SavedArrowCurveUpLeftIcon,
  "arrow-curve-right-up": SavedArrowCurveRightUpIcon,
  "arrow-left-square-contained": SavedArrowLeftSquareContainedIcon,
  "arrow-right-square-contained": SavedArrowRightSquareContainedIcon,
  "arrow-up-square-contained": SavedArrowUpSquareContainedIcon,
  "arrow-down-square-contained": SavedArrowDownSquareContainedIcon,
} satisfies Record<IconName, IconComponent>;

export function Icon({ name, size = 24, ...props }: IconProps) {
  const IconComponent = icons[name];

  return (
    <IconComponent
      aria-hidden="true"
      focusable="false"
      size={size}
      {...props}
    />
  );
}
