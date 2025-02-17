"use client";

import { useState, useEffect } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import axios from "axios";

interface Transaction {
	from: string;
	merchant: string;
	amount: string;
}

export default function TransactionsPage() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchTransactions = async () => {
		try {
			const timestamp = new Date().getTime();
			// Use the proxy API route instead of calling the endpoint directly
			const { data } = await axios.get(
				`/api/proxy/transactions?t=${timestamp}`,
				{
					headers: {
						"Cache-Control": "no-cache",
						Pragma: "no-cache",
						Expires: "0",
					},
				}
			);

			if (data.success) {
				setTransactions(data.transactions);
			}
			setLoading(false);
		} catch (error) {
			console.error("Failed to fetch transactions:", error);
			toast.error("Failed to fetch transactions");
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTransactions();
		// Set up an interval to refresh transactions every 10 seconds
		const interval = setInterval(fetchTransactions, 10000);
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Transactions</h2>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>From</TableHead>
							<TableHead>Merchant</TableHead>
							<TableHead>Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{transactions.map((transaction, index) => (
							<TableRow key={index}>
								<TableCell>{transaction.from}</TableCell>
								<TableCell>{transaction.merchant}</TableCell>
								<TableCell>{transaction.amount}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
