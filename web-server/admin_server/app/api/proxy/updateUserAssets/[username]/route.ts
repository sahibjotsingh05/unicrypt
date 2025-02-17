import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: { username: string } }
) {
	console.log("POST updateUserAssets called with username:", params.username);
	const username = params.username;
	const body = await request.json();
	console.log("Request body:", body);

	try {
		const response = await fetch(`http://3.94.208.17:2000/updateUserAssets`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: username,
				studentId: body.studentId,
				ticketAccess: body.ticketAccess ?? false,
				doorAccess: body.doorAccess ?? false,
				attendance: body.attendance ?? 0,
			}),
		});

		if (!response.ok) {
			console.log("Backend API error:", response.status);
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log("updateUserAssets response:", data);
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating user assets:", error);
		return NextResponse.json(
			{ error: "Failed to update user assets" },
			{ status: 500 }
		);
	}
}
