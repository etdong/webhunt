export default function Login() {
    let c = document.getElementById('game') as HTMLCanvasElement;
    c.hidden = true;

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const url = process.env.REACT_APP_SERVER_URL + '/auth/google';
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
