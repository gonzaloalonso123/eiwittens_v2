import React from 'react';
import { Button, Form, Input } from 'antd';
import { useAuth } from '../providers/AuthProvider';
import Logo from '../assets/images/logo.webp';
import successSentences from '../assets/content/success.json';
import Rogier from '../assets/images/rogier.png';

const Login = () => {
	const { login, error } = useAuth();
	const onFinish = (values) => {
		login(values.username, values.password);
	};
	return (
		<div className='h-screen w-screen flex items-center justify-center bg-eiwit-blue p-2'>
			<div className='h-fit bg-white p-6 rounded-md shadow-md w-full max-w-md'>
				<img src={Logo} alt='logo' className='w-48 mx-auto mb-6' />
				<Form
					name="basic"
					labelCol={{
						span: 8,
					}}
					wrapperCol={{
						span: 16,
					}}
					style={{
						maxWidth: 600,
					}}
					initialValues={{
						remember: true,
					}}
					labelAlign='left'
					onFinish={onFinish}
					autoComplete="off"
				>
					<Form.Item
						label="Username"
						name="username"
						rules={[
							{
								required: true,
								message: 'Please input your username!',
							},
						]}
					>
						<Input />
					</Form.Item>

					<Form.Item
						label="Password"
						name="password"
						rules={[
							{
								required: true,
								message: 'Please input your password!',
							},
						]}
					>
						<Input.Password />
					</Form.Item>
					<Form.Item
						wrapperCol={{
							offset: 8,
							span: 16,
						}}
					>
						<Button type="primary" htmlType="submit">
							Login
						</Button>
					</Form.Item>
					{error && <div className='text-red-500'>{error}</div>}
				</Form>
				<SuccessMessage />
			</div>
		</div>
	)
}

const SuccessMessage = () => <div className='text-center mt-4 flex gap-2 p-2 bg-yellow-100 items-center rounded-md'>
	<img src={Rogier} alt='Rogier' className='w-14 rounded-full' />
	{successSentences[Math.floor(Math.random() * successSentences.length)]}
</div>
export default Login;