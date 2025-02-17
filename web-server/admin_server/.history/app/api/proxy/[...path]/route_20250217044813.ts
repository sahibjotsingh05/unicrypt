import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const response = await fetch("http://3.94.208.17:2000/transactions", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		return new NextResponse(JSON.stringify(data), {
			headers: {
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch data" },
			{
				status: 500,
				headers: {
					"Cache-Control":
						"no-store, no-cache, must-revalidate, proxy-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			}
		);
	}
}
