import { Workspace } from "@/components/workspace";

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="font-bold text-xl tracking-tight">resumate</div>
        <button className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
          Optimize Resume
        </button>
      </header>

      {/* Main Content Workspace */}
      <Workspace />
    </div>
  );
}
