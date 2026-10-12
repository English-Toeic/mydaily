import { cn } from "@/lib/utils";
import type { View } from "@/app/routes";
import { NAV_ITEMS } from "./navItems";

type Props = { view: View; onNavigate: (view: View) => void };

export function MobileNav({ view, onNavigate }: Props) {
  return (
    <nav
      aria-label="Điều hướng"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = item.activeOn.includes(view.name);
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <button
                onClick={() => onNavigate(item.target)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground active:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0 h-0.5 w-8 rounded-full bg-primary transition-all duration-300",
                    active ? "opacity-100" : "scale-x-0 opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}