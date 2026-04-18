'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PressureCrackTextProps {
    text: string;
    className?: string;
}

export default function PressureCrackText({ text, className = "" }: PressureCrackTextProps) {
    // We create multiple "shards" of the same text
    // Each shard is a specific polygon of the full text
    const shards = [
        "polygon(0% 0%, 50% 0%, 40% 50%, 0% 40%)",
        "polygon(50% 0%, 100% 0%, 100% 40%, 60% 50%)",
        "polygon(0% 40%, 40% 50%, 30% 100%, 0% 100%)",
        "polygon(40% 50%, 60% 50%, 70% 100%, 30% 100%)",
        "polygon(60% 50%, 100% 40%, 100% 100%, 70% 100%)",
        "polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)", // center shard
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const shardVariants = (index: number) => ({
        hidden: { 
            opacity: 0,
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotate: (Math.random() - 0.5) * 45,
            scale: 0.5,
            filter: "blur(10px)"
        },
        visible: { 
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring" as const,
                stiffness: 50,
                damping: 20,
                delay: index * 0.1
            }
        }
    });

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className={`relative inline-block ${className}`}
        >
            {/* The main text (invisible but provides structure) */}
            <span className="invisible select-none">{text}</span>

            {/* The animated shards */}
            {shards.map((clip, i) => (
                <motion.span
                    key={i}
                    custom={i}
                    variants={shardVariants(i)}
                    className="absolute inset-0 select-none pointer-events-none"
                    style={{ 
                        clipPath: clip,
                        WebkitClipPath: clip,
                    }}
                >
                    {text}
                </motion.span>
            ))}

            {/* Final solid text that appears at the end for clean rendering */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute inset-0"
            >
                {text}
            </motion.span>
        </motion.div>
    );
}
