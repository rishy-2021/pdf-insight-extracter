import { useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TbNotes } from "react-icons/tb";
import { FaPlus, FaLock, FaRecycle } from "react-icons/fa";
import { usePathname } from "next/navigation";
import {
  useWorkspaceChatContext,
  Workspace,
} from "@/lib/hooks/workspace-chat-context";
import { Tooltip } from "./tooltip";

const Sidenav: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { workspaces } = useWorkspaceChatContext();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const sortedChats = workspaces
    .slice()
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  return (
    <div className="flex flex-col md:flex-row lg:flex-row w-fit !overflow-x-visible z-[100]">
      <div
        className={`md:bg-white md:p-4 px-4 pt-5 transition-all duration-500 ease-in-out border-r-1 md:shadow-lg !overflow-x-visible
        ${isCollapsed ? "md:w-16 w-96 h-16 max-w-[470px] md:h-full" : "max-w-[470px] w-96 md:w-[300px] h-[280px] md:h-full"}
        overflow-y-scroll no-scrollbar`}
      >
        <div
          className={`flex mb-3 md:mb-10 items-baseline justify-between ${isCollapsed ? "md:flex-col gap-2" : "md:flex-row"}`}
        >
          <div
            className={`flex items-center min-w-fit text-black no-underline rounded mb-2
            ${isCollapsed ? "justify-center" : "justify-start"}`}
          >
            <Link
              href={"/"}
              className={`hover:bg-gray-100 hover:text-gray-900
              transition-all flex items-center duration-300 justify-center py-2 px-2 rounded`}
            >
              <FaRecycle
                className={`${isCollapsed ? "" : "mr-1"}`}
                size={"22"}
              />
            </Link>
            <span
              className={`${isCollapsed ? "md:hidden" : "inline font-medium"}`}
            >
              Pdf Insights Extracter
            </span>
          </div>
          <ul className="block md:hidden">
            <SidenavItem
              title="Create Workspace"
              href="/"
              isActive={isActive("/")}
              isCollapsed={isCollapsed}
              icon={
                <FaPlus
                  className={`${isCollapsed ? "" : "scale-75"} ${isActive("/") ? "text-white" : "text-[#1C17FF]"}`}
                />
              }
              animatedBorder
            />
          </ul>
        </div>

        <div>
          <ul className="h-48 md:h-full overflow-scroll md:overflow-hidden md:mb-5 border md:border-none p-3 rounded-lg md:rounded-none md:p-0">
            {sortedChats.map((workspace: Workspace) => {
              if (!workspace) return null;
              return (
                <SidenavItem
                  key={workspace.id}
                  title={workspace.name}
                  href={`/workspace/${workspace.id}`}
                  isActive={isActive(`/workspace/${workspace.id}`)}
                  isCollapsed={isCollapsed}
                />
              );
            })}
          </ul>
          <ul className="hidden md:block">
            <SidenavItem
              title="Create Workspace"
              href="/"
              isActive={isActive("/")}
              isCollapsed={isCollapsed}
              icon={
                <FaPlus
                  className={`${isCollapsed ? "" : "scale-75"} ${isActive("/") ? "text-white" : "text-[#1C17FF]"}`}
                />
              }
              animatedBorder
            />
          </ul>
        </div>
      </div>
      <button
        onClick={toggleSidebar}
        className="relative mb-4 w-fit my-4 ml-2 rounded-lg px-2 hover:bg-slate-50 z-0
        justify-end items-center bg-transparent border-none text-xl cursor-pointer hidden md:flex"
        aria-expanded={!isCollapsed}
      >
        <div className="scale-125 text-black">
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </div>
      </button>
    </div>
  );
};

interface SidenavItemProps {
  title: string;
  href: string;
  isActive: boolean;
  isCollapsed: boolean;
  icon?: React.ReactNode;
  locked?: boolean;
  animatedBorder?: boolean;
}

const SidenavItem: React.FC<SidenavItemProps> = ({
  title,
  href,
  isActive,
  isCollapsed,
  icon,
  locked,
  animatedBorder,
}) => {
  return (
    <li>
      {isCollapsed ? (
        <Tooltip
          text={
            <span>
              {title}
              {locked && <span className="ml-2">(Read-Only)</span>}
            </span>
          }
        >
          <Link
            href={href}
            className={`flex items-center text-gray-800 no-underline rounded mb-1
            ${
              isActive
                ? "bg-[#1C17FF] text-white transition-colors duration-0"
                : "hover:bg-gray-100 hover:text-gray-900 border"
            } transition-all duration-100 justify-center py-4 ${animatedBorder ? "border-glow" : ""}`}
          >
            <div className="relative">
              {icon || <TbNotes />}
              {locked && (
                <span className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 scale-75">
                  <FaLock />
                </span>
              )}
            </div>
          </Link>
        </Tooltip>
      ) : (
        <Link
          href={href}
          className={`flex items-center text-gray-800 no-underline rounded mb-1
          ${
            isActive
              ? "bg-[#1C17FF] text-white transition-colors duration-0"
              : "hover:bg-gray-200 bg-gray-100 hover:text-gray-900"
          } transition-all duration-100 justify-start px-4 py-4 ${animatedBorder ? "border-glow" : ""}`}
        >
          {<div className="mr-2">{icon}</div> || <TbNotes className="mr-2" />}
          <span className={`${title === 'Create Workspace' && 'hidden md:block'}`}>{title}</span>
          {locked && (
            <span className="ml-2 scale-75">
              <Tooltip text={<span className="">Read-Only</span>}>
                <FaLock />
              </Tooltip>
            </span>
          )}
        </Link>
      )}
    </li>
  );
};

export default Sidenav;
