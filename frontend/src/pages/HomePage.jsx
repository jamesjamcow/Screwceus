import { ChevronRightIcon, FolderIcon } from "../components/home/HomeIcons";
import HomeSidebar from "../components/home/HomeSidebar";
import HomeTopNav from "../components/home/HomeTopNav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 md:grid-cols-[240px_1fr]">
        <HomeSidebar />

        <section className="px-4 py-7 md:px-6">
          <div className="inline-flex items-center gap-1 text-[1.35rem] leading-none text-[#141414] md:text-[1.8rem]">
            <ChevronRightIcon className="h-4 w-4 md:h-5 md:w-5" />
            <FolderIcon className="h-[19px] w-[19px]" />
            <span>Folders</span>
          </div>

          <div className="mt-1 w-full max-w-[1040px] border-b border-[#b8b0a5]" />

          <h2 className="mb-3 mt-14 text-[1.4rem] font-medium text-[#141414] md:text-[2rem]">Files</h2>

          <div className="grid w-full max-w-[1040px] grid-cols-2 gap-x-3 gap-y-2 border-b border-[#b8b0a5] px-2 pb-2 text-sm text-[#171717] md:grid-cols-[1.6fr_0.28fr_0.65fr_0.65fr] md:gap-6 md:text-[0.98rem]">
            <span>Named</span>
            <span>Time</span>
            <span>Modified By</span>
            <span>Owned By</span>
          </div>
        </section>
      </div>
    </div>
  );
}
