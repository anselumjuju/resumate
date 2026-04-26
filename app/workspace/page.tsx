import { Metadata } from "next";
import { TransformWorkspace } from "@/components/transform-workspace";

export const metadata: Metadata = {
  title: "Job Transformer | Resumate",
  description: "AI-powered resume and cover letter optimization for specific job roles.",
};

export default function WorkspacePage() {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-950">
      <TransformWorkspace />
    </div>
  );
}
