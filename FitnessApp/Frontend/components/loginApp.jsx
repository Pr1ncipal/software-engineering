
const App = () => {
    return (
        <div className="login-container">
        <h2 className="form-title">Log in with</h2>
        <div className="social-login">
            <button className="social-button">
                <img src="" alt="" className="social-icon"></img>
                Google
            </button>
            <button className="social-button">
            <img src="" alt="" className="social-icon"></img>
            Apple
            </button>
            </div>

            <p className="separator"><span>or</span></p>

            <form action="#" className="login-form">
                <div className="input-wrapper">
                    <input type="email" placeholder="email address" 
                        className="input-field" required />
                    <i className="material-symbols-rounded">lock</i>
                </div>
                <a href="#" className="forgot-pass-link">Forgot Password?</a>

                <button className="login-button">Log In</button>
            </form>

        <p className="signup-text">Don't have an account? <a href="">Signup now</a></p>
        </div>
    )
}



