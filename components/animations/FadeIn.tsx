"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function FadeIn({
    children,
    delay = 0,
    direction = "none",
    className = "",
    fullWidth = false,
}: {
    children: ReactNode;
    delay?: number;
    direction?: "left" | "up" | "right" | "down" | "none";
    className?: string;
    fullWidth?: boolean;
}) {
    const directions = {
        left: { x: -40, y: 0 },
        right: { x: 40, y: 0 },
        up: { x: 0, y: 40 },
        down: { x: 0, y: -40 },
        none: { x: 0, y: 0 },
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directions[direction],
            }}
            whileInView={{
                opacity: 1,
                x: 0,
                y: 0,
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98] as const,
            }}
            className={fullWidth ? `w-full ${className}` : className}
        >
            {children}
        </motion.div>
    );
}

export function FadeInStagger({
    className = "",
    children,
    faster = false,
    ...props
}: {
    className?: string;
    children: ReactNode;
    faster?: boolean;
} & React.ComponentProps<typeof motion.div>) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ staggerChildren: faster ? 0.08 : 0.15 }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function FadeInStaggerItem({
    children,
    className = "",
    direction = "up",
}: {
    children: ReactNode;
    className?: string;
    direction?: "left" | "up" | "right" | "down" | "none";
}) {
    const directions = {
        left: { x: -40, y: 0 },
        right: { x: 40, y: 0 },
        up: { x: 0, y: 40 },
        down: { x: 0, y: -40 },
        none: { x: 0, y: 0 },
    };
    return (
        <motion.div
            variants={{
                hidden: {
                    opacity: 0,
                    ...directions[direction],
                },
                visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: {
                        duration: 0.8,
                        ease: [0.21, 0.47, 0.32, 0.98] as const,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
