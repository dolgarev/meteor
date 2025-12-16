import { createBrowserRouter } from "react-router";
import { About } from "./About";
import { App } from "./App";

// https://reactrouter.com/start/data/routing
export const Routes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/about",
    element: <About />,
    loader: async () => {
      const about = await Meteor.callAsync("about");
      return { about };
    },
  },
]);
