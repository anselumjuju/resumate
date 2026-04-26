import { TransformWorkspace } from "@/components/transform-workspace";

export default function WorkspacePage() {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-950">
      <TransformWorkspace />
    </div>
  );
}
