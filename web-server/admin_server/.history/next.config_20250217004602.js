/** @type {import('next').NextConfig} */
const nextConfig = {
	// Make sure there are no restrictive rewrites or redirects here
	headers: async () => {
		return [
			{
				source: "/api/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, max-age=0",
					},
				],
			},
		];
	},
};

module.exports = nextConfig;
