import { Metadata } from "next";
import { Workspace } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Master Resume & Templates | Resumate",
  description: "Create, edit, and manage your master LaTeX resume and cover letter templates.",
};

export default function EditorPage() {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-950">
      <Workspace />
    </div>
  );
}
