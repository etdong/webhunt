import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ReactUI(socket: any) {

	let c = document.getElementById('game') as HTMLCanvasElement;
    c.hidden = false;

	const [user, setUser] = useState({ loggedIn: false, displayName: "" });

	useEffect(() => {
		fetch(process.env.REACT_APP_SERVER_URL + '/account', { credentials: 'include' })
			.then(res => res.json())
			.then(data => {
				setUser(data);
			});
	}, [])

	const menuComponent = () => {
		if (user.loggedIn) {
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
