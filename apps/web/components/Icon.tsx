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
  | "help-circle-contained"
  | "headphones"
  | "home-02"
  | "image-03"
  | "line-chart-up-02"
  | "loader-01"
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
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.9876 4.91669C13.9784 4.80986 13.74 4.60472 13.6391 4.56813C13.5379 4.53131 13.4247 4.55637 13.3486 4.63206L11.8222 6.15846L9.83956 4.17583L11.3965 2.62475C11.4727 2.54891 11.4976 2.43609 11.4609 2.3355C11.4238 2.2347 11.1793 2.02117 11.0719 2.01191C10.1263 1.93075 9.19985 2.26708 8.53002 2.93449C7.61261 3.84852 7.36966 5.18325 7.79987 6.32095C7.75285 6.36042 7.70645 6.40224 7.66069 6.44733L2.46362 11.3329C2.46179 11.3346 2.45998 11.3366 2.458 11.3383C1.84681 11.9473 1.84681 12.938 2.458 13.547C3.06929 14.1559 4.05652 14.1485 4.66761 13.5396C4.67025 13.5371 4.67266 13.5347 4.67507 13.532L9.53629 8.31415C9.5806 8.26981 9.62175 8.22341 9.66054 8.17579C10.8028 8.60515 12.1435 8.3637 13.0617 7.44907C13.7314 6.7816 14.0692 5.85855 13.9876 4.91669Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
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

function HelpCircleContainedIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
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
        d="M7.99935 11V11.0264M6.5 6.15333C6.5 5.30926 7.17157 4.625 8 4.625C8.82843 4.625 9.5 5.30926 9.5 6.15333C9.5 6.9974 8.82843 7.68166 8 7.68166C8 7.68166 7.99935 8.13783 7.99935 8.70055M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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
        d="M5.16667 11.4801V11.4286M8.16667 11.4801V11.4286M8.16667 8.68571V8.63415M10.8333 8.68571V8.63415M3.16667 5.94284H12.5M4.37302 2V3.02869M11.1667 2V3.02857M11.1667 3.02857H4.5C3.39543 3.02857 2.5 3.94958 2.5 5.0857V11.9429C2.5 13.079 3.39543 14 4.5 14H11.1667C12.2712 14 13.1667 13.079 13.1667 11.9429L13.1667 5.0857C13.1667 3.94958 12.2712 3.02857 11.1667 3.02857Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 4.00001H10M3.2 3.2V12.8C3.2 13.6837 3.91634 14.4 4.8 14.4H11.2C12.0837 14.4 12.8 13.6837 12.8 12.8V3.2C12.8 2.31635 12.0837 1.60001 11.2 1.6L4.8 1.6C3.91635 1.59999 3.2 2.31634 3.2 3.2ZM8 11.2H8.05667V11.2513H8V11.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.17123 6.68229C9.30669 7.07373 9.73382 7.28125 10.1253 7.1458C10.5167 7.01035 10.7242 6.58322 10.5888 6.19178L9.88 6.43704L9.17123 6.68229ZM8.8 5.62222L8.83295 4.87294C8.82197 4.87246 8.81099 4.87222 8.8 4.87222V5.62222ZM7.2 8.06666V8.81666V8.06666ZM8.8 10.5111V11.2611V10.5111ZM7.2 10.5111L7.16705 11.2604C7.17803 11.2609 7.18901 11.2611 7.2 11.2611V10.5111ZM6.82876 9.45104C6.69331 9.0596 6.26618 8.85208 5.87474 8.98753C5.4833 9.12298 5.27578 9.55011 5.41123 9.94155L6.12 9.69629L6.82876 9.45104ZM8.75 4.4C8.75 3.98579 8.41421 3.65 8 3.65C7.58579 3.65 7.25 3.98579 7.25 4.4H8H8.75ZM7.25 5.62222C7.25 6.03643 7.58579 6.37222 8 6.37222C8.41421 6.37222 8.75 6.03643 8.75 5.62222H8H7.25ZM8.75 10.5111C8.75 10.0969 8.41421 9.76111 8 9.76111C7.58579 9.76111 7.25 10.0969 7.25 10.5111H8H8.75ZM7.25 11.7333C7.25 12.1475 7.58579 12.4833 8 12.4833C8.41421 12.4833 8.75 12.1475 8.75 11.7333H8H7.25ZM9.88 6.43704L10.5888 6.19178C10.461 5.82244 10.2268 5.4983 9.91421 5.26246L9.46251 5.86118L9.0108 6.4599C9.08316 6.51449 9.1398 6.59146 9.17123 6.68229L9.88 6.43704ZM9.46251 5.86118L9.91421 5.26246C9.60145 5.0265 9.22492 4.89018 8.83295 4.87294L8.8 5.62222L8.76705 6.3715C8.85368 6.37531 8.93862 6.40544 9.0108 6.4599L9.46251 5.86118ZM8.8 5.62222V4.87222H7.2V5.62222V6.37222H8.8V5.62222ZM7.2 5.62222V4.87222C6.67834 4.87222 6.18089 5.08342 5.8163 5.45476L6.35147 5.9802L6.88664 6.50564C6.97214 6.41856 7.08514 6.37222 7.2 6.37222V5.62222ZM6.35147 5.9802L5.8163 5.45476C5.45216 5.82564 5.25 6.32577 5.25 6.84444H6H6.75C6.75 6.71481 6.80069 6.59319 6.88664 6.50564L6.35147 5.9802ZM6 6.84444H5.25C5.25 7.36311 5.45216 7.86325 5.8163 8.23413L6.35147 7.70868L6.88664 7.18324C6.80069 7.0957 6.75 6.97408 6.75 6.84444H6ZM6.35147 7.70868L5.8163 8.23413C6.18089 8.60547 6.67834 8.81666 7.2 8.81666V8.06666V7.31666C7.08514 7.31666 6.97214 7.27032 6.88664 7.18324L6.35147 7.70868ZM7.2 8.06666V8.81666H8.8V8.06666V7.31666H7.2V8.06666ZM8.8 8.06666V8.81666C8.91486 8.81666 9.02786 8.86301 9.11335 8.95009L9.64853 8.42464L10.1837 7.8992C9.81911 7.52786 9.32166 7.31666 8.8 7.31666V8.06666ZM9.64853 8.42464L9.11335 8.95009C9.19931 9.03763 9.25 9.15925 9.25 9.28889H10H10.75C10.75 8.77022 10.5478 8.27008 10.1837 7.8992L9.64853 8.42464ZM10 9.28889H9.25C9.25 9.41852 9.19931 9.54014 9.11335 9.62768L9.64853 10.1531L10.1837 10.6786C10.5478 10.3077 10.75 9.80756 10.75 9.28889H10ZM9.64853 10.1531L9.11335 9.62768C9.02786 9.71476 8.91486 9.76111 8.8 9.76111V10.5111V11.2611C9.32166 11.2611 9.81911 11.0499 10.1837 10.6786L9.64853 10.1531ZM8.8 10.5111V9.76111H7.2V10.5111V11.2611H8.8V10.5111ZM7.2 10.5111L7.23295 9.76183C7.14631 9.75802 7.06138 9.72789 6.9892 9.67343L6.53749 10.2721L6.08578 10.8709C6.39854 11.1068 6.77508 11.2431 7.16705 11.2604L7.2 10.5111ZM6.53749 10.2721L6.9892 9.67343C6.91684 9.61884 6.8602 9.54187 6.82876 9.45104L6.12 9.69629L5.41123 9.94155C5.53904 10.3109 5.7732 10.635 6.08578 10.8709L6.53749 10.2721ZM8 4.4H7.25V5.62222H8H8.75V4.4H8ZM8 10.5111H7.25V11.7333H8H8.75V10.5111H8ZM14.4 8H13.65C13.65 11.1204 11.1204 13.65 8 13.65V14.4V15.15C11.9488 15.15 15.15 11.9488 15.15 8H14.4ZM8 14.4V13.65C4.87959 13.65 2.35 11.1204 2.35 8H1.6H0.85C0.85 11.9488 4.05116 15.15 8 15.15V14.4ZM1.6 8H2.35C2.35 4.87959 4.87959 2.35 8 2.35V1.6V0.85C4.05116 0.85 0.85 4.05116 0.85 8H1.6ZM8 1.6V2.35C11.1204 2.35 13.65 4.87959 13.65 8H14.4H15.15C15.15 4.05116 11.9488 0.85 8 0.85V1.6Z"
        fill="currentColor"
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
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.00007 10.7303V8.39987M8.00007 8.39987L5.20007 6.79987M8.00007 8.39987L10.8001 6.79987M8 1.6L13.5426 4.8V11.2L8 14.4L2.45744 11.2V4.8L8 1.6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5 11.375H11M7.53638 2.14078L2.33638 5.65735C2.12534 5.80007 2 6.0311 2 6.27737V12.8588C2 13.4891 2.53726 14 3.2 14H12.8C13.4627 14 14 13.4891 14 12.8588V6.27737C14 6.0311 13.8747 5.80007 13.6636 5.65735L8.46362 2.14078C8.18605 1.95307 7.81395 1.95307 7.53638 2.14078Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Loader01Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
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
        d="M8 4.74286V2M8 14V11.2571M11.2571 8H14M2 8H4.74286M10.3034 5.69697L12.2429 3.75748M3.75694 12.2427L5.69643 10.3032M10.3034 10.303L12.2429 12.2425M3.75694 3.75727L5.69643 5.69676"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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
  "help-circle-contained": HelpCircleContainedIcon,
  headphones: HeadphonesIcon,
  "home-02": Home02Icon,
  "image-03": Image03Icon,
  "line-chart-up-02": LineChartUp02Icon,
  "loader-01": Loader01Icon,
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
