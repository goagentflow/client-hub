import { useNavigate } from "react-router-dom";
import { Building2, ClipboardList, Compass, LayoutGrid, PieChart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PRODUCT_LINKS } from "@/config/product-links";

const products = [
  {
    key: "clienthub",
    title: "Client Hub",
    icon: Building2,
    action: "navigate" as const,
    path: PRODUCT_LINKS.CLIENT_HUB,
  },
  {
    key: "copilot",
    title: "Co-Pilot Quiz",
    icon: ClipboardList,
    action: "external" as const,
    path: PRODUCT_LINKS.COPILOT_AUTH,
  },
  {
    key: "discovery",
    title: "Discovery",
    icon: Compass,
    action: "external" as const,
    path: PRODUCT_LINKS.DISCOVERY_ADMIN,
  },
  {
    key: "crm",
    title: "CRM & Pipeline",
    icon: PieChart,
    action: "external" as const,
    path: PRODUCT_LINKS.CRM_ADMIN,
  },
];

interface ProductSwitcherProps {
  current?: "clienthub" | "copilot" | "discovery" | "crm";
}

export function ProductSwitcher({ current = "clienthub" }: ProductSwitcherProps) {
  const navigate = useNavigate();

  const handleSelect = (product: (typeof products)[number]) => {
    if (product.action === "navigate") {
      navigate(product.path);
    } else {
      window.location.assign(product.path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Switch product"
          className="h-9 w-9 rounded-md"
        >
          <LayoutGrid className="h-5 w-5 text-[hsl(var(--deep-navy))]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 bg-white">
        <DropdownMenuLabel className="text-xs text-[hsl(var(--medium-grey))]">
          AgentFlow Tools
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {products.map((product) => {
          const Icon = product.icon;
          const isActive = product.key === current;
          return (
            <DropdownMenuItem
              key={product.key}
              onClick={() => handleSelect(product)}
              className={`cursor-pointer gap-3 ${
                isActive
                  ? "bg-[hsl(var(--warm-cream))] font-medium"
                  : ""
              }`}
            >
              <Icon className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
              <span>{product.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
