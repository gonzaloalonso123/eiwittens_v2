import React from 'react'
import { useAuth } from '../providers/AuthProvider'

export const CurrentUser = () => {
	const { user } = useAuth()
	return (
		<div className='text-gray-500 w-full px-6'>{user}</div>
	)
}
