import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { username: string } }
) {
	const username = params.username;

	try {
		const response = await fetch(
			`http://3.94.208.17:2000/getUserAssets/${username}`
		);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching user assets:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user assets" },
			{ status: 500 }
		);
	}
}
