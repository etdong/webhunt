/**
 * Creates the login page
 * @returns The login page component
 */
export default function Login() {
    // hide the game canvas on the login page
    let c = document.getElementById('game') as HTMLCanvasElement;
    c.hidden = true;

    // auth with google
    const handleSubmit = (e: any) => {
        e.preventDefault();
        const url = "https://webhunt.onrender.com/auth/google";
        window.open(url, '_self');
    }
	
    return (
        <>
            <form onSubmit={handleSubmit}>
                <input type="submit" value="Login"/>
            </form>
        </>
   );
}
