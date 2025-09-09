import { Button } from "antd";
import React, { useState } from "react";
import { pushToWordpress, scrapeAll } from "../client/backend";
import Rogier from "../assets/images/rogier.png";
import { useToast } from "../providers/Toast";

export const Manage = () => {
	const [loading, setLoading] = useState(false);
	const toast = useToast();
	const URL = 'https://gierig-groeien.api-gollum.online';
	const scrape = async () => {
		setLoading(true);
		await scrapeAll();
		setLoading(false);
		toast.success("Scraped and pushed to Wordpress");
	};
	const [emailRes, setEmailRes] = useState(null);

	const sendEmailSequence = async () => {
		fetch(`${URL}/send-creapure-update-email`, { method: 'POST' }).then(res => res.json()).then(data => {
			setEmailRes(data);
			toast.success("Email sequence started");
			setLoading(false);
		}).catch(err => {
			toast.error("Error starting email sequence");
			setLoading(false);
		});
		setLoading(true);
	}

	return (
		<div>
			<div className="rounded-md bg-gray-100 text-white text-2xl text-center p-4">
				<div className="flex gap-2 w-full">
					<img
						src={Rogier}
						alt="Hacker Vulture"
						className="w-20 h-20 mx-auto rounded-full"
					/>
					<div className="flex flex-col gap-2 p-4 flex-grow">
						<h1 className="p-2 px-4 bg-white shadow-md rounded-md h-fit text-black mb-10 w-full">
							{loading
								? "Yes, Sir!"
								: "Welcome back my Lord. What do you command?"}
						</h1>
						<Button
							onClick={scrape}
							loading={loading}
							disabled={loading}
							className="w-full"
						>
							Scrape all products
						</Button>
						<Button
							onClick={sendEmailSequence}
							loading={loading}
							disabled={loading || emailRes?.status === 'started'}
							className="w-full"
						>
							Start Creapure update email sequence
						</Button>
						{emailRes && (
							<div className="p-4 bg-white rounded-md shadow-md text-black mt-4">
								{JSON.stringify(emailRes, null, 2)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
