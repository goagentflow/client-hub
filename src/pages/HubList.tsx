import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data for placeholder hubs
const mockHubs = [
  {
    id: 1,
    companyName: "Client Example123",
    contactName: "Sarah Mitchell",
    status: "Active",
    lastActivity: "2 days ago",
  },
  {
    id: 2,
    companyName: "TechCorp Solutions",
    contactName: "James Chen",
    status: "Active",
    lastActivity: "5 days ago",
  },
  {
    id: 3,
    companyName: "Riverside Marketing",
    contactName: "Emma Williams",
    status: "Won",
    lastActivity: "1 week ago",
  },
  {
    id: 4,
    companyName: "Blue Sky Agency",
    contactName: "Tom Anderson",
    status: "Lost",
    lastActivity: "2 weeks ago",
  },
  {
    id: 5,
    companyName: "Summit Ventures",
    contactName: "Maria Garcia",
    status: "Active",
    lastActivity: "1 day ago",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-sage-green text-white";
    case "Won":
      return "bg-gradient-blue text-white";
    case "Lost":
      return "bg-medium-grey text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const HubList = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow Logo"
            className="h-10 w-auto"
          />

          {/* Title */}
          <h1 className="text-lg font-semibold text-royal-blue hidden md:block">
            Hub List
          </h1>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-blue text-white text-sm font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-dark-grey hidden sm:inline">
                  John Doe
                </span>
                <ChevronDown className="h-4 w-4 text-medium-grey" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white z-50">
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-royal-blue">
            Your Pitch Hubs
          </h2>
          <Button className="bg-soft-coral hover:bg-soft-coral/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Create New Hub
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medium-grey" />
            <Input
              placeholder="Search hubs..."
              className="pl-10 h-12 bg-white border-border focus:ring-gradient-blue focus:border-gradient-blue"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-6 bg-white border-border hover:bg-muted w-full sm:w-auto"
              >
                All Hubs
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white z-50">
              <DropdownMenuItem className="cursor-pointer">All</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Active</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Won</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Lost</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockHubs.map((hub) => (
            <Card
              key={hub.id}
              className="p-6 bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              onClick={() => window.location.href = '/hub/overview'}
            >
              <div className="space-y-3">
                {/* Company Name */}
                <h3 className="text-xl font-bold text-dark-grey group-hover:text-royal-blue transition-colors">
                  {hub.companyName}
                </h3>

                {/* Contact Name */}
                <p className="text-medium-grey text-sm">{hub.contactName}</p>

                {/* Status Badge */}
                <Badge className={`${getStatusColor(hub.status)} px-3 py-1 text-xs font-medium`}>
                  {hub.status}
                </Badge>

                {/* Last Activity */}
                <p className="text-medium-grey text-xs pt-2">
                  Last activity: {hub.lastActivity}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HubList;
