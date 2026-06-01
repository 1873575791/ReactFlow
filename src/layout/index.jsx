import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { routes } from "../router";

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = routes[0].children.filter((route) => route.name);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <header>
        <nav className="relative flex items-center justify-between px-4 py-4 bg-[#1a1a2e] border-b border-gray-700 sm:px-6">
          {/* 桌面端横向导航 */}
          <div className="hidden sm:flex sm:gap-5">
            {navItems.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                end
                className={({ isActive }) =>
                  `text-white no-underline px-4 py-2 rounded-md transition-all duration-300 ${
                    isActive ? "bg-indigo-500" : "hover:bg-gray-700"
                  }`
                }
              >
                {route.name}
              </NavLink>
            ))}
          </div>

          {/* 移动端品牌占位 */}
          <span className="text-white font-semibold sm:hidden">Demo</span>

          {/* 移动端汉堡按钮 */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="切换导航菜单"
            aria-expanded={isMenuOpen}
            className="flex items-center justify-center w-10 h-10 rounded-md text-white hover:bg-gray-700 transition-colors sm:hidden"
          >
            {isMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          {/* 移动端展开菜单 */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 z-50 flex flex-col gap-1 px-4 py-3 bg-[#1a1a2e] border-b border-gray-700 shadow-lg sm:hidden">
              {navItems.map((route) => (
                <NavLink
                  key={route.path}
                  to={route.path}
                  end
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `text-white no-underline px-4 py-3 rounded-md transition-all duration-300 ${
                      isActive ? "bg-indigo-500" : "hover:bg-gray-700"
                    }`
                  }
                >
                  {route.name}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </header>
      <main className="h-[calc(100vh-73px)]">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
