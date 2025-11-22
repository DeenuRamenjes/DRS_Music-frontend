import { useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axios";

interface FormState {
	title: string;
	message: string;
	imageUrl: string;
	link: string;
}

const initialState: FormState = {
	title: "",
	message: "",
	imageUrl: "",
	link: "",
};

const BroadcastNotificationCard = () => {
	const [form, setForm] = useState<FormState>(initialState);
	const [isSending, setIsSending] = useState(false);

	const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm((prev) => ({ ...prev, [field]: event.target.value }));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!form.message.trim()) {
			toast.error("Message is required");
			return;
		}

		setIsSending(true);
		try {
			await axiosInstance.post("/admin/notifications", {
				title: form.title.trim() || undefined,
				message: form.message.trim(),
				imageUrl: form.imageUrl.trim() || undefined,
				link: form.link.trim() || undefined,
			});
			toast.success("Notification sent to all users");
			setForm(initialState);
		} catch (error: any) {
			const message = error?.response?.data?.message ?? "Failed to send notification";
			toast.error(message);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Card className='mb-8 border-emerald-500/30 bg-zinc-900/60'>
			<CardHeader>
				<div className='flex items-center justify-between gap-4'>
					<div>
						<CardTitle className='flex items-center gap-2 text-lg'>
							<Megaphone className='size-5 text-emerald-400' />
							Broadcast Notification
                            <p className='text-xs text-zinc-500'> (In Development)</p>
						</CardTitle>
						<CardDescription>Send an optional title, image, and link with your message.</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='grid gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium text-zinc-300'>Title (optional)</label>
							<Input
								value={form.title}
								onChange={handleChange("title")}
								placeholder='New feature drop'
								className='bg-zinc-900 border-zinc-800'
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-zinc-300'>Link (optional)</label>
							<Input
								type='url'
								value={form.link}
								onChange={handleChange("link")}
								placeholder='https://...'
								className='bg-zinc-900 border-zinc-800'
							/>
						</div>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-zinc-300'>Image URL (optional)</label>
						<Input
							value={form.imageUrl}
							onChange={handleChange("imageUrl")}
							placeholder='https://cdn.example.com/banner.png'
							className='bg-zinc-900 border-zinc-800'
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-zinc-300'>Message *</label>
						<textarea
							value={form.message}
							onChange={handleChange("message")}
							placeholder='Share update details here...'
							className='min-h-[120px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring focus-visible:ring-emerald-500/40'
						/>
					</div>

					<div className='flex justify-end'>
						<Button type='submit' disabled={isSending} className='min-w-[180px] bg-emerald-500 hover:bg-emerald-400'>
							{isSending ? (
								<span className='inline-flex items-center gap-2'>
									<Loader2 className='size-4 animate-spin' />
									Sending...
								</span>
							) : (
								"Send Notification"
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};

export default BroadcastNotificationCard;
