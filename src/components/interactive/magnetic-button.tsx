"use client";

import { useRef, useState, useCallback } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  as?: React.ElementType;
  [key: string]: unknown;
}

/**
 * Magnetic Button — cursor pulls the button toward it.
 * Creates a living, tactile feel. Pure React.
 */
export default function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  as: Tag = "button",
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      setOffset({ x: deltaX, y: deltaY });
    },
    [strength],
  );

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0
          ? "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
          : "transform 0.15s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Tag>
  );
}
