import { Metadata } from "next";
import { TransformWorkspace } from "@/components/transform-workspace";

export const metadata: Metadata = {
  title: "Tailor Resume | Resumate",
  description: "AI-guided resume and cover letter tailoring for specific job opportunities.",
};

export default function WorkspacePage() {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-950">
      <TransformWorkspace />
    </div>
  );
}
