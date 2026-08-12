// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import './Login.scss';

const Login = ({ setAuthUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Unified Google OAuth login with Contacts Scope included!
  const loginWithGoogle = useGoogleLogin({
    scope:
      'openid email profile https://www.googleapis.com/auth/contacts.readonly',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const accessToken = tokenResponse.access_token;

        // 1. Fetch user profile directly from Google
        const userInfoRes = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        const { sub: googleId, email, name, picture } = userInfoRes.data;

        // 2. Authenticate with backend
        const res = await axios.post('/api/auth/google', {
          googleId,
          email,
          name,
          picture,
        });

        const { result, token } = res.data;

        // 3. Save session JWT AND Google Contacts Access Token
        localStorage.setItem('koder_token', token);
        localStorage.setItem('koder_user', JSON.stringify(result));
        localStorage.setItem('google_contacts_token', accessToken); // Saved for lifetime of session!

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setAuthUser(result);
        navigate('/');
      } catch (error) {
        console.error('Login Error:', error);
        alert('Google Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Auth Failed:', error);
      alert('Google Authorization failed.');
    },
  });

  return (
    <div className='login-wrapper'>
      <div className='login-card'>
        <div className='brand-header'>
          <div className='logo-badge'>🛞</div>
          <h1>Shree Sai Tyres</h1>
          <p className='subtitle'>Garage Management System</p>
        </div>

        <div className='login-action'>
          <p className='instruction'>
            Sign in with your Google account to access system & contacts
          </p>

          <button
            type='button'
            className='custom-google-btn'
            onClick={() => loginWithGoogle()}
            disabled={loading}
          >
            <FcGoogle className='google-icon' />
            <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
          </button>
        </div>

        <div className='login-footer'>
          <span>Powered by KodeR Studio</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
