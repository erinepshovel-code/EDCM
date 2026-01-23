import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DemoBanner } from "@/components/shared/DemoBanner";

import Home from "@/pages/Home";
import DatingMode from "@/modes/dating/DatingMode";
import PoliticalMode from "@/modes/politics/PoliticalMode";
import LabMode from "@/modes/lab/LabMode";
import AIAssistant from "@/pages/AIAssistant";
import Analysis from "@/pages/Analysis";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dating" component={DatingMode} />
      <Route path="/politics" component={PoliticalMode} />
      <Route path="/lab" component={LabMode} />
      <Route path="/assistant" component={AIAssistant} />
      <Route path="/analysis" component={Analysis} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoBanner />
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
