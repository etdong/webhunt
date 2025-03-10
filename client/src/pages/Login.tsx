export default function Login() {
    let c = document.getElementById('game') as HTMLCanvasElement;
    c.hidden = true;

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
