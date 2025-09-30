import React, { useEffect, useState, memo } from "react";

const CircleProgress = memo(function CircleProgress({ percentage, label, className = "" }) {
  const strokeWidth = 2.5;
  const defaultRadius = 12;
  const radius = defaultRadius;
  const circumference = 2 * Math.PI * radius;

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // Start with empty circle (0%)
    setOffset(circumference - (0 / 100) * circumference);

    // Animate to actual percentage after a brief delay
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const getStrokeColor = () => {
    if (percentage > 80) return "#71F170";
    else if (percentage >= 70) return "#FFC008";
    else return "#DF212B";
  };

  return (
    <svg
      className={`w-[60px] h-[60px] ${className}`}
      viewBox="0 0 40 40"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="rotate(-90 20 20)">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="transparent"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          className="transition-all duration-1000 ease-out"
        />
      </g>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-[11px] max-[375px]:text-[10px] fill-white dark:fill-black font-medium"
      >
        {label ?? percentage}
      </text>
    </svg>
  );
});

export default CircleProgress;
