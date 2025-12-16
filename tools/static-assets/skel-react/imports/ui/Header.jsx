import { NavLink } from "react-router";
import MeteorLogo from "./meteor-logo.svg";

export const Header = () => {
  return (
    <div className="header">
      <MeteorLogo className="logo" />
      <h1>Welcome to Meteor!</h1>
      <NavLink to="/about" className="link">
        About Page
      </NavLink>
    </div>
  );
};
