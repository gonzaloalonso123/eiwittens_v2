import React, { createContext, useContext, useEffect, useState } from "react";
import {
	GoogleAuthProvider,
	browserLocalPersistence,
	createUserWithEmailAndPassword,
	setPersistence,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
} from "firebase/auth";
import { auth } from "../client/firebase";
import { useLocation } from "react-router-dom";

const AuthenticationContext = createContext();

export const useAuth = () => useContext(AuthenticationContext);

const useAuthActions = (setError) => {
	const beautifyError = (error) => {
		console.log(error);
		return error.code.replace("auth/", "").replaceAll("-", " ")
	};

	const register = async (email, password) => {
		createUserWithEmailAndPassword(auth, email, password).catch((error) => {
			setError(beautifyError(error));
		});
	};

	const login = async (email, password) => {
		signInWithEmailAndPassword(auth, email, password).catch((error) => {
			setError(beautifyError(error));
		});
	};

	const logout = async () => {
		signOut(auth).catch((error) => {
			setError(beautifyError(error));
		});
	};

	const loginWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		signInWithPopup(auth, provider).catch((error) => {
			setError(beautifyError(error));
		});
	};

	return { register, login, logout, loginWithGoogle };
};

const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);
	const { login, logout, loginWithGoogle } = useAuthActions(setError);
	const location = useLocation();

	const initializeAuth = async () => {
		await setPersistence(auth, browserLocalPersistence);
	};

	useEffect(() => {
		initializeAuth();
	}, []);

	useEffect(() => {
		setError(null);
	}, [location]);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			if (user) {
				setUser(user.email);
				setError(null);
			} else {
				setUser(null);
			}
		});
		return () => unsubscribe();
	}, []);

	return (
		<AuthenticationContext.Provider
			value={{ user, setUser, login, logout, error, loginWithGoogle }}
		>
			{children}
		</AuthenticationContext.Provider>
	);
};

export { AuthenticationContext, AuthProvider };
