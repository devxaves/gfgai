"use client";

import Hero from "@/components/ui/animated-shader-hero";

const HeroDemo: React.FC = () => {
  const handlePrimaryClick = () => {
    console.log("Open dashboard clicked");
  };

  const handleSecondaryClick = () => {
    console.log("Explore features clicked");
  };

  return (
    <div className="w-full">
      <Hero
        trustBadge={{
          text: "Built for modern data teams.",
          icons: ["✨", "📊", "⚡"],
        }}
        headline={{
          line1: "Analyze Data",
          line2: "With Confidence",
        }}
        subtitle="Upload datasets, ask natural-language questions, and get instant AI-assisted insights in one clean workspace."
        buttons={{
          primary: {
            text: "Open Dashboard",
            onClick: handlePrimaryClick,
          },
          secondary: {
            text: "Explore Features",
            onClick: handleSecondaryClick,
          },
        }}
      />
    </div>
  );
};

export default HeroDemo;
