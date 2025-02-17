import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const response = await fetch("http://3.94.208.17:2000/transactions", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch transactions" },
			{ status: 500 }
		);
	}
}
