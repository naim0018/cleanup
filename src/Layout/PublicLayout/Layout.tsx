import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="bg-light-background flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
