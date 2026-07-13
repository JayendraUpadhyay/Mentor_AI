import { useRef, useState } from "react";

/**
 * Wraps children in a card that subtly tilts toward the cursor (mouse-tracked
 * 3D perspective tilt) and gets a soft directional glow. Updates are throttled
 * to one per animation frame so multiple cards on screen don't cause repaint
 * jank (which can look like the card briefly "blanking out").
 */
export default function TiltCard({ children, className = "", glow = "cyan", maxTilt = 8 }) {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const [style, setStyle] = useState({});

  const glowColor = { cyan: "62,233,255", violet: "155,92,255", magenta: "255,62,165" }[glow] || "62,233,255";

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) return; // already have a frame queued, skip
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;

      setStyle({
        transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015,1.015,1.015)`,
        backgroundImage: `radial-gradient(500px circle at ${px * 100}% ${py * 100}%, rgba(${glowColor},0.10), transparent 60%)`,
      });
    });
  }

  function handleMouseLeave() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
      backgroundImage: "none",
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.15s ease-out, background-image 0.15s ease-out",
        backfaceVisibility: "hidden",
        willChange: "transform",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}