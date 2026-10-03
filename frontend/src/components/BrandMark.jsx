import { Stethoscope } from "lucide-react";

// The KF LearnSmart mark: the stethoscope logo in an accent tile.
export default function BrandMark({ size = 34 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-s-accent text-s-on-accent"
      style={{ width: size, height: size }}
    >
      <Stethoscope size={Math.round(size * 0.55)} strokeWidth={2.25} />
    </span>
  );
}
