import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { path: string[] } }
) {
	try {
		// Get the full path from params
		const path = params.path.join("/");

		// Get the URL parameters
		const { searchParams } = new URL(request.url);
		const queryString = searchParams.toString();

		// Construct the full URL
		const url = `http://3.94.208.17:2000/${path}${
			queryString ? `?${queryString}` : ""
		}`;

		console.log("Proxying request to:", url); // Debug log

		const response = await fetch(url, {
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
		console.log("Response data:", data); // Debug log

		return new NextResponse(JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
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

export async function POST(
	request: Request,
	{ params }: { params: { path: string[] } }
) {
	try {
		const path = params.path.join("/");
		const { searchParams } = new URL(request.url);
		const queryString = searchParams.toString();
		const url = `http://3.94.208.17:2000/${path}${
			queryString ? `?${queryString}` : ""
		}`;

		console.log("Proxying POST request to:", url);

		const body = await request.json();
		console.log("Request body:", body);

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			console.error("Backend error status:", response.status);
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log("Response data:", data);

		return new NextResponse(JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to process request" },
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
