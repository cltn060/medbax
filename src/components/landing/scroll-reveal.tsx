"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        const currentElement = domRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }
        return () => {
            if (currentElement) observer.unobserve(currentElement);
        };
    }, []);

    return (
        <div
            ref={domRef}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-1000 cubic-bezier(0.17, 0.55, 0.55, 1) transform ${isVisible
                    ? "opacity-100 translate-y-0 scale-100 blur-0"
                    : "opacity-0 translate-y-12 scale-95 blur-sm"
                } ${className}`}
        >
            {children}
        </div>
    );
}
