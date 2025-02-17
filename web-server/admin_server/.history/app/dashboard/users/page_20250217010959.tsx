"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import axios from "axios";

interface UserAssets {
	username: string;
	studentId: string;
	ticketAccess: boolean;
	doorAccess: boolean;
	attendance?: {
		type: string;
		hex: string;
	};
	ethBalance: string;
	brbBalance: string;
}

interface UserListItem {
	username: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<UserAssets[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [newStudentId, setNewStudentId] = useState("");

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		console.log("🔄 Starting data fetch for all users");
		try {
			const { data: usersList } = await axios.get<UserListItem[]>(
				"/api/proxy/users"
			);
			console.log("📋 Retrieved users list:", usersList);

			const userPromises = usersList.map(async (user: UserListItem) => {
				console.log(`🔍 Fetching details for user: ${user.username}`);
				try {
					const { data: userData } = await axios.get(
						`/api/proxy/getUserAssets/${user.username}`
					);
					console.log(`✅ User data received for ${user.username}:`, userData);
					return {
						username: user.username,
						studentId: userData?.studentId || "",
						ticketAccess: Boolean(userData?.ticketAccess),
						doorAccess: Boolean(userData?.doorAccess),
						ethBalance: userData?.ethBalance || "0",
						brbBalance: userData?.brbBalance || "0",
						attendance: userData?.attendance || { hex: "0x0", type: "number" },
					};
				} catch (error) {
					console.log(
						`⚠️ Primary fetch failed for ${user.username}, trying fallback...`
					);
					try {
						const { data: fallbackData } = await axios.get(
							`/api/proxy/updateUserAssets/${user.username}`
						);
						return {
							username: user.username,
							studentId: fallbackData?.studentId || "",
							ticketAccess: Boolean(fallbackData?.ticketAccess),
							doorAccess: Boolean(fallbackData?.doorAccess),
							ethBalance: fallbackData?.ethBalance || "0",
							brbBalance: fallbackData?.brbBalance || "0",
							attendance: fallbackData?.attendance || {
								hex: "0x0",
								type: "number",
							},
						};
					} catch (fallbackError) {
						return {
							username: user.username,
							studentId: "",
							ticketAccess: false,
							doorAccess: false,
							ethBalance: "0",
							brbBalance: "0",
							attendance: { hex: "0x0", type: "number" },
						};
					}
				}
			});

			const usersData = await Promise.all(userPromises);
			console.log("✅ All user data fetched successfully:", usersData);
			setUsers(usersData);
		} catch (error) {
			console.error("❌ Fetch error:", error);
			toast.error("Failed to fetch user data");
		} finally {
			setLoading(false);
			console.log("🏁 Data fetch operation completed");
		}
	};

	const handleUpdateStudentId = async (username: string, newId: string) => {
		console.log(
			`🔄 Starting student ID update for ${username} with new ID: ${newId}`
		);
		try {
			const currentUser = users.find((u) => u.username === username);
			if (!currentUser) {
				console.log(`❌ User ${username} not found in current state`);
				return;
			}

			const payload = {
				username: username,
				studentId: newId,
				ticketAccess: currentUser.ticketAccess,
				doorAccess: currentUser.doorAccess,
				attendance: parseInt(currentUser.attendance?.hex || "0x0", 16),
			};
			console.log(`📤 Sending update payload:`, payload);

			const { data: updateResponse } = await axios.post(
				`/api/proxy/updateUserAssets/${username}`,
				payload
			);
			console.log(`✅ Update response received:`, updateResponse);

			// Update local state with the response data
			setUsers((prevUsers) => {
				return prevUsers.map((user) =>
					user.username === username
						? {
								...user,
								studentId: updateResponse.studentId || newId,
								ticketAccess: Boolean(updateResponse.ticketAccess),
								doorAccess: Boolean(updateResponse.doorAccess),
								attendance: {
									hex: `0x${Number(updateResponse.attendance || 0).toString(
										16
									)}`,
									type: "number",
								},
						  }
						: user
				);
			});

			console.log(`✅ Student ID update completed for ${username}`);
			toast.success("Student ID updated successfully");
			setEditingId(null);
			setNewStudentId("");
		} catch (error) {
			console.error("❌ Update error:", error);
			toast.error("Failed to update student ID");
		}
	};

	const handleUpdateAccess = async (
		username: string,
		updates: Partial<UserAssets>
	) => {
		console.log(`🔄 Starting access update for ${username}`, updates);
		try {
			// Find current user state
			const currentUser = users.find((u) => u.username === username);
			if (!currentUser) {
				console.error(`User ${username} not found in state`);
				return;
			}

			// Prepare payload with all current values
			const payload = {
				username: username,
				studentId: currentUser.studentId,
				ticketAccess:
					"ticketAccess" in updates
						? updates.ticketAccess
						: currentUser.ticketAccess,
				doorAccess:
					"doorAccess" in updates ? updates.doorAccess : currentUser.doorAccess,
				attendance: parseInt(currentUser.attendance?.hex || "0x0", 16),
			};

			console.log(`📤 Sending access update payload:`, payload);

			const { data } = await axios.post(
				`/api/proxy/updateUserAssets/${username}`,
				payload
			);
			console.log(`✅ Access update response:`, data);

			// Update local state with the response data
			setUsers((prevUsers) => {
				return prevUsers.map((user) =>
					user.username === username
						? {
								...user,
								ticketAccess: Boolean(data.ticketAccess),
								doorAccess: Boolean(data.doorAccess),
								studentId: data.studentId || user.studentId,
								attendance: {
									hex: `0x${Number(data.attendance || 0).toString(16)}`,
									type: "number",
								},
						  }
						: user
				);
			});

			console.log(`✅ Access update completed for ${username}`);
			toast.success("Access updated successfully");
		} catch (error) {
			console.error("❌ Access update error:", error);
			toast.error("Failed to update access");
		}
	};

	// Add logging for UI interactions
	useEffect(() => {
		console.log(`✏️ Edit mode changed - Editing ID: ${editingId}`);
	}, [editingId]);

	useEffect(() => {
		console.log(`📝 New student ID value changed: ${newStudentId}`);
	}, [newStudentId]);

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Users</h2>

			{/* Users Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Username</TableHead>
							<TableHead>Student ID</TableHead>
							<TableHead>Ticket Access</TableHead>
							<TableHead>Door Access</TableHead>
							<TableHead>Attendance</TableHead>
							<TableHead>ETH Balance</TableHead>
							<TableHead>BRB Balance</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user, index) => (
							<TableRow key={index}>
								<TableCell>{String(user.username)}</TableCell>
								<TableCell>
									{editingId === user.username ? (
										<div className="flex space-x-2">
											<Input
												value={newStudentId}
												onChange={(e) => setNewStudentId(e.target.value)}
												placeholder="Enter new ID"
												className="w-32"
											/>
											<Button
												size="sm"
												onClick={() =>
													handleUpdateStudentId(
														String(user.username),
														newStudentId
													)
												}
											>
												Save
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setEditingId(null);
													setNewStudentId("");
												}}
											>
												Cancel
											</Button>
										</div>
									) : (
										<div className="flex items-center space-x-2">
											<span>{user.studentId ? user.studentId : "N/A"}</span>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setEditingId(user.username);
													setNewStudentId(user.studentId || "");
												}}
											>
												Edit
											</Button>
										</div>
									)}
								</TableCell>
								<TableCell>{user.ticketAccess ? "Yes" : "No"}</TableCell>
								<TableCell>{user.doorAccess ? "Yes" : "No"}</TableCell>
								<TableCell>
									{user.attendance?.hex ? parseInt(user.attendance.hex, 16) : 0}
								</TableCell>
								<TableCell>{user.ethBalance || "0"} ETH</TableCell>
								<TableCell>{user.brbBalance || "0"} BRB</TableCell>
								<TableCell className="space-x-2">
									<div className="flex gap-4 min-w-[200px]">
										<Button
											size="sm"
											className={
												user.ticketAccess
													? "bg-green-500 hover:bg-green-600"
													: ""
											}
											onClick={() =>
												handleUpdateAccess(String(user.username), {
													ticketAccess: !user.ticketAccess,
													doorAccess: user.doorAccess,
													studentId: user.studentId,
												})
											}
										>
											{user.ticketAccess ? "Revoke Ticket" : "Grant Ticket"}
										</Button>
										<Button
											size="sm"
											className={
												user.doorAccess ? "bg-green-500 hover:bg-green-600" : ""
											}
											onClick={() =>
												handleUpdateAccess(String(user.username), {
													ticketAccess: user.ticketAccess,
													doorAccess: !user.doorAccess,
													studentId: user.studentId,
												})
											}
										>
											{user.doorAccess ? "Revoke Door" : "Grant Door"}
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
