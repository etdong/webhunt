import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import socket from "src/components/socket";

export default function ReactUI() {

	let c = document.getElementById('game') as HTMLCanvasElement;
    c.hidden = false;

	const [user, setUser] = useState({ loggedIn: false, displayName: "", id: ""});

	useEffect(() => {
		fetch("https://webhunt.onrender.com/account", { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				setUser(data);
			});
	}, [])

	let server_loggedOut = false;
	socket.on('logged_out', () => {
		setUser({ loggedIn: false, displayName: "", id: ""});
		server_loggedOut = true;
	})

	const menuComponent = () => {
		if (server_loggedOut) {
			return (
				<div id='menu'>
					<Link style={{ textDecoration: 'none', color: "black",}} id="menu_login" to='/login'>Login</Link>
				</div>
			)
		}
		if (user.loggedIn) {
			socket.emit('login', socket.id, user.displayName, user.id);
			return (
			<div id='menu'>
				<div>Logged in as {'' + user.displayName}</div>
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
