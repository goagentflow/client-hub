import { useNavigate } from "react-router-dom";
import { Building2, Compass, ClipboardList, ExternalLink } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser, useLogout } from "@/hooks";

interface ToolCard {
  key: "clienthub" | "copilot" | "discovery";
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  onOpen: () => void;
}

const StaffLauncher = () => {
  const navigate = useNavigate();
  const { data: authData } = useCurrentUser();
  const { mutate: logout } = useLogout();

  const tools: ToolCard[] = [
    {
      key: "clienthub",
      title: "Client Hub Admin",
      description: "Manage hubs, portal access, and client engagement.",
      icon: Building2,
      onOpen: () => navigate("/hubs"),
    },
    {
      key: "copilot",
      title: "Co-Pilot Quiz",
      description: "Go to the Co-Pilot Quiz app.",
      icon: ClipboardList,
      onOpen: () => window.location.assign("/assess/auth"),
    },
    {
      key: "discovery",
      title: "Discovery",
      description: "Go to Discovery tools and reports.",
      icon: Compass,
      onOpen: () => window.location.assign("/discovery/admin/login"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow Logo"
            className="h-10 w-auto"
          />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-medium-grey sm:block">
              {authData?.user.displayName ?? "Staff"}
            </span>
            <Button variant="outline" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-royal-blue md:text-4xl">
            AgentFlow staff tools
          </h1>
          <p className="mt-2 text-medium-grey">
            Where do you need to be?
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.key} className="border-border">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-royal-blue" />
                    </div>
                    <CardTitle>{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={tool.onOpen}>
                      Open
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-medium-grey">
            You might need to sign in again for Co-Pilot Quiz and Discovery - we're working on fixing that.
          </p>
        </div>
      </main>
    </div>
  );
};

export default StaffLauncher;
