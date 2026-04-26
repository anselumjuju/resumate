import { Metadata } from "next";
import { Workspace } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Master Template | Resumate",
  description: "Edit and manage your master LaTeX resume template.",
};

export default function EditorPage() {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-950">
      <Workspace />
    </div>
  );
}
