import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  imgClassName?: string;
  collapsed?: boolean;
  subtext?: string;
  showText?: boolean;
}

const Logo = ({ className, imgClassName, collapsed }: LogoProps) => {
  return (
    <div className={cn("flex items-center justify-center select-none", className)}>
      <img
        src="/BaseKit.png"
        alt="BaseKit Logo"
        className={cn(collapsed ? "w-11/12" : "w-3/4", "mx-auto object-contain shrink-0", imgClassName)}
      />
    </div>
  );
};

export default Logo;
