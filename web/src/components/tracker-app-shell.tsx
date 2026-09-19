"use client";

import dynamic from "next/dynamic";

const TrackerApp = dynamic(() => import("@/components/tracker-app").then((module) => module.TrackerApp), {
  ssr: false,
});

export function TrackerAppShell() {
  return <TrackerApp />;
}