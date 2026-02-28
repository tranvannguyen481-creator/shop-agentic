import { useAuthBootstrap } from "../features/auth/hooks/use-auth-bootstrap";
import { WizardProvider } from "../shared/contexts";
import FileBasedRoutes from "./file-based-routes";

function App() {
  useAuthBootstrap();

  return (
    <WizardProvider>
      <FileBasedRoutes />
    </WizardProvider>
  );
}

export default App;
