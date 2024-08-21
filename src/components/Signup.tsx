import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './componentStyles/loginsSignup.css';

import firebaseInit from './firebaseConfig';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore"; 

firebaseInit();
const auth = getAuth();
const app = firebaseInit();
const db = getFirestore(app);

function Signup ( {...props} ) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [validPasswordLength, setValidPasswordLength] = useState(false);
    const [validPasswordNum, setValidPasswordNum] = useState(false);
    const [validPasswordCapital, setValidPasswordCapital] = useState(false);
    const [validPasswordMatch, setValidPasswordMatch] = useState(false);

    const navigate = useNavigate();

    const createUserInfo = async (user:any) => {
        await setDoc(doc(db, "users", email), {
            name: name,
            email: email,
            userID: user.uid,
            favorites: []
          });
    }

    function createFirebaseUser() {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            props.setCurrentUser(user);
            createUserInfo(user);
            navigate('/login');
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateForm(e) {
        e.preventDefault();

        let validName = false;
        let validEmail = false;
        let validPassword = false;

        if (name.length > 0) {
            validName = true;
        } else {
            validName = false;
            return toast.warn('Name is required!');
        }

        if (email.length > 0 && emailRegex.test(email)) {
            validEmail = true;
        } else {
            validEmail = false;
            return toast.warn('Email not valid!');
        }

        if (validPasswordLength && validPasswordNum && validPasswordCapital && validPasswordMatch) {
            validPassword = true;
        } else {
            validPassword = false;
            return toast.warn('Password not valid!');
        }

        if (validName && validEmail && validPassword) {
            toast.success('Account created successfully!');
            createFirebaseUser();
        }
    }

    const passCheckCount = document.getElementById('charCountIndicator');
    const passCheckNumber = document.getElementById('numberIndicator');
    const passCheckCapital = document.getElementById('capitalIndicator');
    const passCheckMatch = document.getElementById('matchIndicator');
    const indicatorColor = 'rgb(0, 64, 255)';
    const hasNumRegex = /\d/;

    function checkPassword() {
        if (passCheckCount && password.length >= 8) {
            passCheckCount.style.color = indicatorColor;
            setValidPasswordLength(true);
        } else if (passCheckCount) {
            passCheckCount.style.color = 'black';
            setValidPasswordLength(false);
        }

        if (passCheckNumber && hasNumRegex.test(password)) {
            passCheckNumber.style.color = indicatorColor;
            setValidPasswordNum(true);
        } else if (passCheckNumber) {
            passCheckNumber.style.color = 'black';
            setValidPasswordNum(false);
        }

        if (passCheckCapital && password.toLowerCase() !== password) {
            passCheckCapital.style.color = indicatorColor;
            setValidPasswordCapital(true);
        } else if (passCheckCapital) {
            passCheckCapital.style.color = 'black';
            setValidPasswordCapital(false);
        }

        if (passCheckMatch && password === confirmPassword && password.length > 0) {
            passCheckMatch.style.color = indicatorColor;
            setValidPasswordMatch(true);
        } else if (passCheckMatch) {
            passCheckMatch.style.color = 'black';
            setValidPasswordMatch(false);
        }
    }

    useEffect(() => {
        checkPassword();
    }, [password, confirmPassword])

    return (
        <div className='loginSignupContainer'>
            <h1 className='signupLoginTitle'>Create Your Free Account</h1>
            <h2 className='signupLoginSubtitle'>Already have an account? <Link className="signupLoginSubtitleColor" to='/login'>Login</Link></h2>
            <form className='loginSignupForm' onSubmit={(e) => validateForm(e)}>
                <input className='loginSignupInput' onChange={(e) => setName(e.target.value)} value={name} placeholder='Name'/>
                <input className='loginSignupInput' onChange={(e) => setEmail(e.target.value)} value={email} placeholder='Email'/>
                <input type='password' className='loginSignupInput' onChange={(e) => setPassword(e.target.value)} value={password} placeholder='Password'/>
                <input type='password' className='loginSignupInput' onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} placeholder='Confirm Password'/>
                <p className='passwordCheck'><span id='charCountIndicator' className='passwordCheckIndicator'>•</span>Password has at least 8 characters.</p>
                <p className='passwordCheck'><span id='numberIndicator' className='passwordCheckIndicator'>•</span>Password has a number.</p>
                <p className='passwordCheck'><span id='capitalIndicator' className='passwordCheckIndicator'>•</span>Password has a capital letter.</p>
                <p className='passwordCheck'><span id='matchIndicator' className='passwordCheckIndicator'>•</span>Both passwords match.</p>
                <button type='submit' className='loginSignupButton'>Sign Up</button>
            </form>
        </div>
    )
}

export default Signup;