import { NavLink, Outlet } from "react-router-dom";
import { routes } from "../router";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <header>
        <nav className="flex gap-5 px-6 py-4 bg-[#1a1a2e] border-b border-gray-700">
          {routes[0].children.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `text-white no-underline px-4 py-2 rounded-md transition-all duration-300 ${
                  isActive ? "bg-indigo-500" : "hover:bg-gray-700"
                }`
              }
            >
              {route.name}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
