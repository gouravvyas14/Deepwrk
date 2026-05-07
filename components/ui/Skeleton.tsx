import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn("skeleton", className)} style={style} />;
}

export function CardSkeleton() {
  return (
    <div
      style={{
        background: "#1a2236",
        borderRadius: 16,
        padding: 24,
        border: "1px solid #1e2d45",
      }}
    >
      <Skeleton style={{ height: 16, width: "60%", marginBottom: 16 }} />
      <Skeleton style={{ height: 32, width: "40%", marginBottom: 8 }} />
      <Skeleton style={{ height: 14, width: "80%" }} />
    </div>
  );
}

export function SessionRowSkeleton() {
  return (
    <div
      style={{
        background: "#1a2236",
        borderRadius: 12,
        padding: "16px 20px",
        border: "1px solid #1e2d45",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <Skeleton style={{ height: 16, flex: 1 }} />
      <Skeleton style={{ height: 16, width: 80 }} />
      <Skeleton style={{ height: 16, width: 60 }} />
      <Skeleton style={{ height: 16, width: 40 }} />
    </div>
  );
}
