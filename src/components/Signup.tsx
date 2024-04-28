import { useState } from 'react';
import { toast } from 'react-toastify';
import './componentStyles/loginsSignup.css';

function Signup ( {...props} ) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    return (
        <div className='loginSignupContainer'>
            <h1 className='signupLoginTitle'>Create Your Free Account</h1>
            <h2 className='signupLoginSubtitle'>Already have an account? <span className='signupLoginSubtitleColor'>Login</span></h2>
            <form className='loginSignupForm'>
                <input className='loginSignupInput' onChange={(e) => setName(e.target.value)} value={name} placeholder='Name'/>
                <input className='loginSignupInput' onChange={(e) => setEmail(e.target.value)} value={email} placeholder='Email'/>
                <input className='loginSignupInput' onChange={(e) => setPassword(e.target.value)} value={password} placeholder='Password'/>
                <input className='loginSignupInput' onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} placeholder='Confirm Password'/>
                <button type='submit' className='loginSignupButton'>Sign Up</button>
            </form>
        </div>
    )
}

export default Signup;