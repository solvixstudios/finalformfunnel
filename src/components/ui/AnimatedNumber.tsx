import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    format?: (n: number) => string;
    className?: string;
}

export function AnimatedNumber({
    value,
    duration = 800,
    format = (n) => n.toLocaleString(),
    className,
}: AnimatedNumberProps) {
    const [display, setDisplay] = useState(0);
    const prevValue = useRef(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const start = prevValue.current;
        const diff = value - start;
        if (diff === 0) return;

        const startTime = performance.now();

        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + diff * eased;

            setDisplay(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
            } else {
                prevValue.current = value;
            }
        };

        frameRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameRef.current);
    }, [value, duration]);

    return <span className={className}>{format(Math.round(display))}</span>;
}
