import { AppUiKitProvider } from "@canva/app-ui-kit";
import { App } from "./App";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);

function render() {
  root.render(
    <AppUiKitProvider>
      <App />
    </AppUiKitProvider>
  );
}

render();

// Support hot module replacement during development
if (module.hot) {
  module.hot.accept("./App", render);
}