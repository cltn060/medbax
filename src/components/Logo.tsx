import React from "react";

export const MedBaxLogo = ({
    size = 40,
    className = ""
}: {
    size?: number;
    className?: string;
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background Container - White Rounded Square */}
            <rect
                width="200"
                height="200"
                rx="40"
                fill="white"
                className="dark:fill-white"
            />

            {/* The Arrow Icon - Centered Black Navigation Pointer */}
            <path
                d="M100 45L160 165L100 135L40 165L100 45Z"
                fill="black"
                stroke="black"
                strokeWidth="10"
                strokeLinejoin="round"
                className="dark:fill-black dark:stroke-black"
            />
        </svg>
    );
};