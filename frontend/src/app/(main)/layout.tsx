import { RightRail } from "@/components/layout/RightRail";
import { MobileTabBar, Sidebar } from "@/components/layout/Sidebar";
import { StatsBar } from "@/components/layout/StatsBar";

/**
 * App shell for every non-lesson screen:
 *   phone   -> top stats bar + bottom tab bar
 *   tablet  -> icon sidebar
 *   desktop -> labelled sidebar + content + right rail
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="md:pl-[88px] xl:pl-64">
        <div className="sticky top-0 z-20 border-b-2 border-line bg-bg px-4 py-2 lg:hidden">
          <StatsBar />
        </div>
        <div className="mx-auto flex max-w-[1056px] justify-center gap-12 px-4 pb-24 md:px-6 md:pb-10">
          <main className="w-full max-w-[600px] min-w-0 pt-6">{children}</main>
          <RightRail />
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}
