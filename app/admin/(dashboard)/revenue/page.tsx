"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, CreditCard, Activity, CheckCircle2 } from "lucide-react";

interface PaymentData {
    _id: string;
    user: {
        name: string;
        email: string;
    };
    plan: string;
    amount: number;
    status: string;
    date: string;
}

interface RevenueData {
    metrics: {
        totalRevenue: number;
        basicSubscribers: number;
        proSubscribers: number;
    };
    history: PaymentData[];
}

export default function AdminRevenuePage() {
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await fetch("/api/admin/revenue");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch revenue", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenue();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Revenue Management</h2>
                <p className="text-sm text-gray-500">Monitor platform earnings and subscription metrics.</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Monthly Revenue (MRR)</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">${data.metrics.totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pro Subscribers</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.metrics.proSubscribers.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Basic Subscribers</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.metrics.basicSubscribers.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Simulated Data</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice ID</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Plan</th>
                                <th className="px-6 py-4 font-medium text-right">Amount</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No transactions recorded.</td>
                                </tr>
                            ) : (
                                data.history.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {payment._id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{payment.user.name}</div>
                                            <div className="text-xs text-gray-500">{payment.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${payment.plan === 'PRO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {payment.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            ${payment.amount}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(payment.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
