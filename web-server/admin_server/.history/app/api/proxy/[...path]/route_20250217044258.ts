// Add these headers to your API responses
return NextResponse.json(data, {
	headers: {
		"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	},
});
