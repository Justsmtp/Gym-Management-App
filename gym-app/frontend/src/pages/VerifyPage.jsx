// frontend/src/pages/VerifyPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import API from '../api/api';

const VerifyPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await API.get(`/auth/verify/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
          // Trigger login screen
          window.location.href = '/';
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Verification failed. The link may have expired or is invalid.'
        );
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 mx-auto object-contain rounded-full"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Verifying Email
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ✅ Email Verified!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700 font-semibold">
                🎉 Your account is now active!
              </p>
              <p className="text-xs text-green-600 mt-2">
                Redirecting to login page in 3 seconds...
              </p>
            </div>
            <button
              onClick={() => {
                navigate('/', { replace: true });
                window.location.href = '/';
              }}
              className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition"
            >
              Go to Login Now
            </button>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-semibold mb-2">
                ⚠️ What to do next:
              </p>
              <ul className="text-xs text-red-600 text-left list-disc list-inside space-y-1">
                <li>The verification link may have expired</li>
                <li>Go to login and click "Resend Verification"</li>
                <li>Or register again if you didn't complete registration</li>
              </ul>
            </div>
            <button
              onClick={() => {
                navigate('/', { replace: true });
                window.location.href = '/';
              }}
              className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;