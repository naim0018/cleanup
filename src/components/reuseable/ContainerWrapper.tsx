import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function ContainerWrapper({
  children,
  className,
}: ContainerWrapperProps) {
  return (
    <div className={cn("max-w-4xl mx-auto w-full px-4 lg:px-8", className)}>
      {children}
    </div>
  );
}
