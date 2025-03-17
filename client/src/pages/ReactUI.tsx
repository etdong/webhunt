import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import socket from "src/components/socket";

/**
 * Creates the React UI with the login option
 * @returns The React UI component
 */
export default function ReactUI() {

	// Show the game canvas if we are on the main page
	let c = document.getElementById('game') as HTMLCanvasElement;
    c.hidden = false;

	const [user, setUser] = useState({ loggedIn: false, name: {givenName: "", familyName: ""}, id: ""});

	// get the user's login status from the server
	useEffect(() => {
		fetch("https://webhunt.onrender.com/account", { 
			method: 'GET',
			mode: 'cors',
			credentials: 'include',
		}).then(res => res.json())
			.then(data => {
				setUser(data);
			});
	}, [])

	// display user name if the user is logged in
	const menuComponent = () => {
		if (user.loggedIn) {
			setInterval(() => {
				socket.emit('login', socket.id, user.name.givenName, user.id);
			}, 200);
			return (
			<div id='menu'>
				<div>Logged in as {'' + user.name.givenName}</div>
			</div>
			)
		} else {
			return (
				<div id='menu'>
					<Link style={{ textDecoration: 'none', color: "black",}} id="menu_login" to='/login'>Login</Link>
				</div>
			)
		}
		
	}

  	return (
		<>
			{menuComponent()}
		</>
	);
}
