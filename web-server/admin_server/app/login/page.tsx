"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		const validEmail = "admin@example.com";
		const validPassword = "password";

		if (email === validEmail && password === validPassword) {
			Cookies.set("isAuthenticated", "true", { expires: 1 });
			router.replace("/dashboard/users");
		} else {
			toast.error("Invalid email or password", {
				duration: 3000,
				position: "top-center",
				style: {
					background: "#FF4B4B",
					color: "#fff",
					padding: "16px",
					borderRadius: "10px",
				},
				icon: "🚫",
			});
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 relative">
			<Button
				variant="ghost"
				size="icon"
				className="absolute top-4 right-4"
				onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			>
				<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				<span className="sr-only">Toggle theme</span>
			</Button>
			<Card className="w-full max-w-md relative overflow-hidden">
				<div className="absolute inset-0 animate-rainbow-border rounded-lg [--rainbow-border-width:3px]" />
				<CardHeader className="space-y-1 flex flex-col items-center relative z-10">
					<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
						<LockKeyhole className="w-6 h-6 text-primary-foreground" />
					</div>
					<CardTitle className="text-2xl font-bold text-center">
						Admin Login
					</CardTitle>
				</CardHeader>
				<CardContent className="relative z-10">
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full"
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full"
								disabled={isLoading}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Signing in..." : "Sign in"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
