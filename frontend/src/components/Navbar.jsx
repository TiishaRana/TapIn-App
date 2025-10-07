import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import { UserIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import LanguageSwitcher from "./LanguageSwitcher";
import useLogout from "../hooks/useLogout";
import { useTranslation } from "react-i18next"; // Import useTranslation

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { t } = useTranslation(); // Initialize useTranslation

  const { logoutMutation } = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutMutation();
      navigate("/login", { replace: true });
    } catch {}
  };

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="">
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/img/logo.png" alt="TapIn logo" className="h-9 w-9 rounded" />
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  {t("streamify")}
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-80" />
              </button>
            </Link>

            <Link to={"/profile"}>
              <button className="btn btn-ghost btn-circle">
                <UserIcon className="h-6 w-6 text-base-content opacity-80" />
              </button>
            </Link>

            {/* Theme Selector */}
            <ThemeSelector />

            {/* Language Switcher */}
            <LanguageSwitcher />

            <div className="avatar">
              <div className="w-9 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={authUser?.profilePic} alt="User Avatar" rel="noreferrer" />
              </div>
            </div>

            {/* Logout button */}
            <button className="btn btn-ghost btn-circle tooltip tooltip-bottom" data-tip={t("logout")}
              onClick={handleLogout}>
              <LogOutIcon className="h-6 w-6 text-base-content opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
