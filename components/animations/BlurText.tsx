"use client";

import { motion } from "framer-motion";

export function BlurText({
    text,
    className = "",
    delay = 0,
}: {
    text: string;
    className?: string;
    delay?: number;
}) {
    const words = text.split(" ");

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: delay },
        },
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98] as const,
            }
        },
        hidden: {
            opacity: 0,
            y: 10,
            x: -10,
        },
    };

    return (
        <motion.span
            className={className}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            style={{ display: "inline-block" }}
        >
            {words.map((word, index) => (
                <motion.span
                    variants={child}
                    key={index}
                    style={{ display: "inline-block", marginRight: "0.25em" }}
                >
                    {word}
                </motion.span>
            ))}
        </motion.span>
    );
}
