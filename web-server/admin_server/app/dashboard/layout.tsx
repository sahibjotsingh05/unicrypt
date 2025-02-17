"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, CreditCard, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();
	const router = useRouter();

	const handleLogout = () => {
		Cookies.remove("isAuthenticated");
		window.location.href = "/login"; // Use window.location.href instead of router.push
	};

	const navigation = [
		{ name: "Users", href: "/dashboard/users", icon: Users },
		{ name: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
	];

	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<div
				className={`${
					sidebarOpen ? "w-64" : "w-16"
				} bg-card border-r transition-all duration-300`}
			>
				<div className="h-full flex flex-col">
					{/* Header */}
					<div className="h-16 flex items-center justify-between px-4">
						<h1 className={`font-bold text-lg ${!sidebarOpen && "hidden"}`}>
							Admin Panel
						</h1>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSidebarOpen(!sidebarOpen)}
						>
							<Menu className="h-5 w-5" />
						</Button>
					</div>

					{/* Navigation */}
					<ScrollArea className="flex-1">
						<nav className="space-y-1 px-2 py-4">
							{navigation.map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={`flex items-center h-10 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
											isActive
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
										}`}
									>
										<item.icon
											className={`h-5 w-5 ${sidebarOpen ? "mr-3" : "mx-auto"}`}
										/>
										<span className={!sidebarOpen ? "hidden" : "block"}>
											{item.name}
										</span>
									</Link>
								);
							})}
						</nav>
					</ScrollArea>

					{/* Footer buttons */}
					<div className="p-4 border-t space-y-2">
						<Button
							variant="ghost"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							className="w-full h-10 justify-start"
						>
							<div
								className={`relative flex items-center justify-center w-5 h-5 ${
									sidebarOpen ? "mr-3" : "mx-auto"
								}`}
							>
								<Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
								<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							</div>
							<span className={!sidebarOpen ? "hidden" : "block"}>
								Toggle theme
							</span>
						</Button>
						<Button
							variant="ghost"
							onClick={handleLogout}
							className={"w-full h-10 justify-start"}
						>
							<LogOut className={`h-5 w-5 ${sidebarOpen ? "mr-3" : ""}`} />
							<span className={!sidebarOpen ? "hidden" : "block"}>Logout</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
		</div>
	);
}
