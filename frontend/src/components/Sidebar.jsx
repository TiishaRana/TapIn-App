import { Link, useLocation } from "react-router-dom"; // Changed to react-router-dom
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, HomeIcon, ShipWheelIcon, UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next"; // Import useTranslation

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0 shadow-lg">
      <div className="p-5 border-b border-base-300 flex items-center justify-start gap-2">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            TapIn
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base lg:text-lg h-12 rounded-lg transition-all duration-200
            ${
              currentPath === "/" ? "btn-active bg-primary/20 text-primary" : "hover:bg-base-300"
            }`}
        >
          <HomeIcon className="size-6" />
          <span>{t("home")}</span>
        </Link>

        <Link
          to="/friends"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base lg:text-lg h-12 rounded-lg transition-all duration-200
            ${
              currentPath === "/friends" ? "btn-active bg-primary/20 text-primary" : "hover:bg-base-300"
            }`}
        >
          <UsersIcon className="size-6" />
          <span>{t("friends")}</span>
        </Link>

        <Link
          to="/notifications"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base lg:text-lg h-12 rounded-lg transition-all duration-200
            ${
              currentPath === "/notifications" ? "btn-active bg-primary/20 text-primary" : "hover:bg-base-300"
            }`}
        >
          <BellIcon className="size-6" />
          <span>{t("notifications")}</span>
        </Link>
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-base-300 mt-auto bg-base-300/50">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base truncate">{authUser?.fullName}</p>
            <p className="text-sm text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              {t("online")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
