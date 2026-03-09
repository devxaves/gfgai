"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChartSpline,
  Clock3,
  Database,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Hero from "@/components/ui/animated-shader-hero";
import { LogoBadge } from "@/components/layout/LogoBadge";
import { useAuthStore } from "@/store/useAuthStore";

const features = [
  {
    title: "Ask in Plain English",
    description:
      "Skip SQL-heavy workflows. Ask natural questions and get AI-generated answers with clear context.",
    icon: Sparkles,
  },
  {
    title: "Fast Dataset Upload",
    description:
      "Bring CSV data into your workspace quickly and start exploring without setup overhead.",
    icon: Database,
  },
  {
    title: "Visual Insights Instantly",
    description:
      "Get KPI cards and charts that make your trends and outliers obvious at a glance.",
    icon: ChartSpline,
  },
  {
    title: "Reliable Local History",
    description:
      "Review past analysis runs and keep your team aligned on decisions and discoveries.",
    icon: Clock3,
  },
  {
    title: "Secure-by-Design Flow",
    description:
      "A focused interface with practical controls so teams can move fast while staying in control.",
    icon: ShieldCheck,
  },
  {
    title: "One Unified Workspace",
    description:
      "Connect your data, insights, and actions in one place built for day-to-day execution.",
    icon: Workflow,
  },
];

const LandingPage: React.FC = () => {
  const router = useRouter();
  const { setDemoUser, isAuthenticated } = useAuthStore();

  const handleDemoAccess = () => {
    setDemoUser();
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="fixed top-6 min-w-sm  left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-black/20 backdrop-blur-lg border-3 border-blue-300 rounded-2xl shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            <div className="mr-12 my-1 text-white">
                      <LogoBadge size="md" showText />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <span className="text-white font-medium">Signed in</span>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth")}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-300 hover:bg-white/10 rounded-lg backdrop-blur-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/auth")}
                  className="cursor-pointer px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500/80 to-cyan-500/80 hover:from-indigo-400 hover:to-cyan-400 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 transform backdrop-blur-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <Hero
        trustBadge={{
          text: "Trusted by analysts, operators, and founders.",
          icons: ["✦", "⬢", "✧"],
        }}
        headline={{
          line1: "Turn Raw Data Into",
          line2: "Instant Decisions",
        }}
        subtitle="Viz.ai helps your team upload datasets, run AI-powered analysis, and convert noisy data into clear next steps—faster than traditional BI flows."
        buttons={{
          primary: {
            text: isAuthenticated ? "Open workspace" : "Get Started",
            onClick: () =>
              router.push(isAuthenticated ? "/dashboard" : "/auth"),
          },
          secondary: {
            text: "Explore more",
            onClick: handleDemoAccess,
          },
        }}
      />

      <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="mb-10 text-center">
          <p className="mb-3 inline-block rounded-full bg-sky-100 px-4 py-1 text-sm font-medium text-sky-700">
            Built for practical analytics
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Everything you need for day-one insights
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-blue-950/70 md:text-lg">
            From upload to action, every surface is designed to shorten your
            decision loop.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-linear-to-br from-sky-100 to-blue-100 p-3">
                  <Icon className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-blue-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-2 md:px-10">
        <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
          <img
            src="https://vision-advertising.com/wp-content/uploads/Marketing-Department.jpg"
            alt="Team analyzing dashboards"
            className="h-56 w-full object-cover"
            loading="lazy"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold text-blue-950">
              From questions to clarity
            </h3>
            <p className="mt-2 text-slate-600">
              Ask high-impact questions and transform ambiguous datasets into
              understandable trends.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
            alt="Modern analytics workspace"
            className="h-56 w-full object-cover"
            loading="lazy"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold text-blue-950">
              Built for fast-moving teams
            </h3>
            <p className="mt-2 text-slate-600">
              Keep decisions grounded with reusable insights, chart-ready
              outputs, and a focused workflow.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div className="rounded-3xl border border-sky-200 bg-linear-to-r from-sky-100 via-blue-100 to-indigo-100 p-8 text-center md:p-12">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
            Ready to start?
          </p>
          <h3 className="mt-3 text-2xl font-bold text-blue-950 md:text-4xl">
            Launch your first insight in minutes
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-blue-900/80">
            Sign up to save your work and access your chats from anywhere. Or
            try our demo to explore features instantly.
          </p>
          <div className="flex items-center justify-center gap-4 mt-7">
            <button
              onClick={() => router.push("/auth")}
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-sky-500 to-blue-700 px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleDemoAccess}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-700 border border-blue-300 shadow-md transition hover:bg-blue-50"
            >
              Try Demo
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
