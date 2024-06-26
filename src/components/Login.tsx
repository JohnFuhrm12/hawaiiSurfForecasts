import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import firebaseInit from "./firebaseConfig";
import { toast } from 'react-toastify';
import './componentStyles/loginsSignup.css';

firebaseInit();
const auth = getAuth();
const app = firebaseInit();
const db = getFirestore(app);

function Login( {...props} ) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const getUserDetails = async (userID:string) => {
        const userRef = query(collection(db, "users"), where("userID", "==", userID));
        const querySnapshot = await getDocs(userRef);
        const validUsers = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id}));
        props.setCurrentUserDetails(validUsers[0]);
    }

    function loginUser() {
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          props.setCurrentUser(user);
          getUserDetails(user.uid);
          navigate('/');
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateForm(e) {
        e.preventDefault();

        let validEmail = false;
        let validPassword = false;

        if (email.length > 0 && emailRegex.test(email)) {
            validEmail = true;
        } else {
            validEmail = false;
            return toast.warn('Email not valid!');
        }

        
        if (password.length > 0) {
            validPassword = true;
        } else {
            validPassword = false;
            return toast.warn('Password is required!');
        }

        if (validEmail && validPassword) {
            loginUser();
            toast.success('Successfully logged in!')
        }
    }

    return (
        <div className='loginSignupContainer'>
            <h1 className='signupLoginTitle'>Login to Hawai'i Surf</h1>
            <h2 className='signupLoginSubtitle'>Need an account? <Link className="signupLoginSubtitleColor" to='/signup'>Sign Up</Link></h2>
            <form className='loginSignupForm' onSubmit={(e) => validateForm(e)}>
                <input className='loginSignupInput' onChange={(e) => setEmail(e.target.value)} value={email} placeholder='Email'/>
                <input type='password' className='loginSignupInput' onChange={(e) => setPassword(e.target.value)} value={password} placeholder='Password'/>
                <button type='submit' id='loginButton' className='loginSignupButton'>Login</button>
            </form>
        </div>
    )
}

export default Login;