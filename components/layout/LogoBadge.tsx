import Image from "next/image";

interface LogoBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function LogoBadge({ size = "md", showText = false }: LogoBadgeProps) {
  const sizeMap = {
    sm: { width: 32, height: 32, imageSize: 32, textSize: "text-sm", className: "w-8 h-8" },
    md: { width: 36, height: 36, imageSize: 36, textSize: "text-base", className: "w-9 h-9" },
    lg: { width: 80, height: 80, imageSize: 80, textSize: "text-2xl", className: "w-20 h-20" },
  };

  const config = sizeMap[size];

  return (
    <div className={`flex items-center ${showText ? "gap-3 px-3" : ""}`}>
      <Image
        src="/logo.png"
        alt="Vizly AI Logo"
        width={config.imageSize}
        height={config.imageSize}
        className={`${config.className} rounded-xl shadow-lg shadow-blue-500/20 object-cover`}
      />
      {showText && (
        <div>
          <h1 className={`${config.textSize} font-bold tracking-tight text-gray-900 dark:text-gray-50`}>
            Vizly AI
          </h1>
          <p className="text-[10px] text-gray-400 -mt-0.5 uppercase tracking-wider font-medium">
            Conversational BI
          </p>
        </div>
      )}
    </div>
  );
}
