import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { handleToggle } from "../../heplerFunc/microFuncs";
import ThemeToggle from "../../components/ui/ThemeToggle";
import {
  setTheme,
  setIsChecked,
  setUser,
  setIsLoggedIn,
  setLoading,
} from "../../app/slices/authSlice";
import {
  LogoutOutlinedIcon,
  EditOutlinedIcon,
  BlockIcon,
  ShieldIcon,
  SearchIcon,
  PersonIcon,
  PersonAddAlt1Icon,
  PeopleIcon,
} from "../../heplerFunc/exportIcons";
import { logoutApi } from "../../api/authApi";
import toast from "react-hot-toast";
import { setSelectedUser } from "../../app/slices/echoLinkSlice";

function MyProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isMobile, isChecked } = useSelector((state) => state.auth);

  const logoutApiFunc = async () => {
    try {
      dispatch(setLoading(true));
      const response = await logoutApi();
      toast.success(response?.data?.message);
      dispatch(setUser(null));
      dispatch(setSelectedUser(null));
      dispatch(setIsLoggedIn(false));
      localStorage.setItem("allowFetch", false);
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(setLoading(false));
    }

    navigate("/");
  };

  const classList = "btn w-20 sm:w-full btn-ghost sm:text-xl justify-start";

  return (
    <div className="flex bg-base-200 w-full h-full rounded-2xl">
      {/* Sidebar Section */}
      <div className="card bg-base-300 rounded-2xl  mr-1 sm:w-1/5 w-3/12 flex-grow">
        <div className="flex w-full h-full flex-col">
          {/* Image Container (1/10th height) */}

          {!isMobile && (
            <div className="absolute z-10 ml-1 mt-1">
              <ThemeToggle
                handleToggle={(e) =>
                  handleToggle(e, dispatch, setTheme, setIsChecked)
                }
                isChecked={isChecked}
              />
            </div>
          )}

          <div className="card bg-base-300 rounded-2xl h-[12%] sm:h-[25%] flex items-center justify-center">
            <div className="btn-circle avatar sm:h-32 h-12 sm:w-32 w-12">
              <img
                src={user?.avatar?.url}
                alt=""
                className="object-cover rounded-full"
              />
            </div>
          </div>

          <div className="divider my-0"></div>

          {/* Options Container (9/10th height) */}
          <div className="card bg-base-300 rounded-2xl h-[88%] sm:h-[75%] flex items-center">
            <ul className="flex flex-col w-full items-center">
              <li className={`${classList}`}>
                <NavLink
                  to={"edit-details"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <EditOutlinedIcon />
                  profile
                </NavLink>
              </li>
              <li className={classList}>
                <NavLink
                  to={"my-Mumbles"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <ShieldIcon />
                  {`${isMobile ? "" : "my"} Mumbles`}
                </NavLink>
              </li>
              <li className={`${classList} mb-2 sm:mb-0`}>
                <NavLink
                  to={"my-friends"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <PeopleIcon />
                  {`${isMobile ? "" : "My"} Friends`}
                </NavLink>
              </li>
              <li className={`${classList} mb-2 sm:mb-0`}>
                <NavLink
                  to={"friend-requests"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <PersonAddAlt1Icon />
                  {`${isMobile ? "" : "Friend"} Requests`}
                </NavLink>
              </li>
              <li className={`${classList} mb-2 sm:mb-0`}>
                <NavLink
                  to={"blocked-users"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <BlockIcon />
                  {`blocked${isMobile ? "" : " users"}`}
                </NavLink>
              </li>
              <li className={`${classList}`}>
                <NavLink
                  to={"find-users"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <SearchIcon />
                  {`find ${isMobile ? "" : "users"}`}
                </NavLink>
              </li>
              <li className={`${classList}`}>
                <NavLink
                  to={"account"}
                  className={({ isActive }) =>
                    isActive ? "" : "text-slate-500"
                  }
                >
                  <PersonIcon />
                  account
                </NavLink>
              </li>
              <li className={`${classList} bg-red-800 hover:bg-red-500`}>
                <button onClick={logoutApiFunc}>
                  <LogoutOutlinedIcon />
                  {!isMobile && "Logout"}
                </button>
              </li>
              {isMobile && (
                <li>
                  <div className="text-center sm:mt-6 mt-2">
                    <ThemeToggle
                      handleToggle={(e) =>
                        handleToggle(e, dispatch, setTheme, setIsChecked)
                      }
                      isChecked={isChecked}
                    />
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="card bg-base-300 rounded-2xl sm:w-4/5 w-9/12 flex-grow">
        <Outlet />
      </div>
    </div>
  );
}

export default MyProfile;
