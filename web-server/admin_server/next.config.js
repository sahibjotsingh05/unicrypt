/** @type {import('next').NextConfig} */
const nextConfig = {
	// Make sure there are no restrictive rewrites or redirects here
	async headers() {
		return [
			{
				source: "/api/:path*",
				headers: [
					{ key: "Cache-Control", value: "no-store, must-revalidate" },
					{ key: "Pragma", value: "no-cache" },
					{ key: "Expires", value: "0" },
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{
						key: "Access-Control-Allow-Methods",
						value: "GET, POST, PUT, DELETE, OPTIONS",
					},
					{
						key: "Access-Control-Allow-Headers",
						value: "Content-Type, Authorization",
					},
				],
			},
		];
	},
};

module.exports = nextConfig;
