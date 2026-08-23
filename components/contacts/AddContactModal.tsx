"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Contact } from "@/types";

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Contact>) => Promise<void>;
}

// The four fields a contact has — same set the CSV importer maps onto
// (`CONTACT_IMPORT_FIELDS` in lib/contact-import.ts). Keep the two in step.
export function AddContactModal({ isOpen, onClose, onSubmit }: AddContactModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleClose = () => {
        setFullName("");
        setEmail("");
        setPhone("");
        setWhatsappNumber("");
        setError("");
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() && !whatsappNumber.trim()) {
            setError("Enter an email address or a WhatsApp number — a contact needs at least one.");
            return;
        }

        setIsSubmitting(true);
        try {
            // The API normalizes the numbers to E.164 and splits the name into
            // firstName/lastName — send everything as typed.
            await onSubmit({
                fullName: fullName.trim() || undefined,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                whatsappNumber: whatsappNumber.trim() || undefined,
            });
            handleClose();
        } catch (err: unknown) {
            const e = err as Error;
            setError(e.message || "Failed to add contact");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Add Contact</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alice Sharma"
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alice@example.com"
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 555 000 0000"
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                            <input
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="+1 555 000 0000"
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-gray-400">
                        Fill in the email to reach this contact by email, the WhatsApp number to reach them on
                        WhatsApp, or both. Include the country code on numbers.
                    </p>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Add Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
