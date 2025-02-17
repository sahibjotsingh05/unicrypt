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
		try {
			// Add cache-busting timestamp
			const timestamp = new Date().getTime();
			const { data: usersList } = await axios.get<UserListItem[]>(
				`/api/proxy/users?t=${timestamp}`,
				{
					headers: {
						"Cache-Control": "no-cache",
						Pragma: "no-cache",
						Expires: "0",
					},
				}
			);

			const userPromises = usersList.map(async (user: UserListItem) => {
				try {
					const { data: userData } = await axios.get(
						`/api/proxy/getUserAssets/${user.username}?t=${timestamp}`,
						{
							headers: {
								"Cache-Control": "no-cache",
								Pragma: "no-cache",
								Expires: "0",
							},
						}
					);

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
					// If there's an error, try to get the user's data directly from the update endpoint
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
						// If both attempts fail, return default values but preserve the username
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
			setUsers(usersData);
			setLoading(false);
		} catch (error) {
			console.error("Fetch error:", error);
			toast.error("Failed to fetch user data");
			setLoading(false);
		}
	};

	const handleUpdateStudentId = async (username: string, newId: string) => {
		try {
			const currentUser = users.find((u) => u.username === username);
			if (!currentUser) return;

			const payload = {
				studentId: newId,
				ticketAccess: currentUser.ticketAccess,
				doorAccess: currentUser.doorAccess,
				attendance: parseInt(currentUser.attendance?.hex || "0x0", 16),
			};

			// Make the update request
			const { data: updateResponse } = await axios.post(
				`/api/proxy/updateUserAssets/${username}`,
				payload
			);

			// Update the local state immediately with the response
			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user.username === username
						? {
								...user,
								studentId: updateResponse.studentId || newId,
								ticketAccess: Boolean(updateResponse.ticketAccess),
								doorAccess: Boolean(updateResponse.doorAccess),
						  }
						: user
				)
			);

			toast.success("Student ID updated successfully");
			setEditingId(null);
			setNewStudentId("");

			// Refetch data
			fetchData();
		} catch (error) {
			console.error("Update error:", error);
			toast.error("Failed to update student ID");
		}
	};

	const handleUpdateAccess = async (
		username: string,
		updates: Partial<UserAssets>
	) => {
		try {
			const attendanceValue = parseInt(updates.attendance?.hex || "0x0", 16);
			await axios.post(`/api/proxy/updateUserAssets/${username}`, {
				studentId: updates.studentId,
				ticketAccess: updates.ticketAccess,
				doorAccess: updates.doorAccess,
				attendance: attendanceValue,
				username: username,
			});

			// Wait a brief moment to ensure the backend has processed the update
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Then fetch fresh data
			await fetchData();

			toast.success("Access updated successfully");
		} catch (error) {
			toast.error("Failed to update access");
		}
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Users</h1>
			</div>

			<div className="glow-container overflow-hidden bg-background">
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
