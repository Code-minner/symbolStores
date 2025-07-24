// pages/auth-test.tsx - Create this page to test your AuthContext
"use client";

import { useAuth } from '@/contexts/AuthContext';

export default function AuthTestPage() {
  const authData = useAuth();

  console.log('🔍 Full AuthContext data:', authData);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 AuthContext Test</h1>
        
        {/* Test what functions are available */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Functions:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>✅ user: {typeof authData.user}</div>
            <div>✅ userData: {typeof authData.userData}</div>
            <div>✅ loading: {typeof authData.loading}</div>
            <div>✅ signOut: {typeof authData.signOut}</div>
            <div>❓ signIn: {typeof authData.signIn || 'undefined'}</div>
            <div>❓ updateProfile: {typeof authData.updateProfile || 'undefined'}</div>
            <div>❓ changePassword: {typeof authData.changePassword || 'undefined'}</div>
            <div>❓ extendSession: {typeof authData.extendSession || 'undefined'}</div>
          </div>
        </div>

        {/* Current Auth State */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State:</h2>
          
          <div className="space-y-4">
            <div>
              <strong>Loading:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${authData.loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {authData.loading ? '⏳ Loading' : '✅ Complete'}
              </span>
            </div>
            
            <div>
              <strong>User:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${authData.user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {authData.user ? '✅ Authenticated' : '❌ Not authenticated'}
              </span>
            </div>
            
            {authData.user && (
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-800 mb-2">Firebase Auth User:</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Email:</strong> {authData.user.email}</div>
                  <div><strong>UID:</strong> {authData.user.uid}</div>
                  <div><strong>Display Name:</strong> {authData.user.displayName || 'Not set'}</div>
                </div>
              </div>
            )}
            
            <div>
              <strong>UserData:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${authData.userData ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {authData.userData ? '✅ Loaded' : '⚠️ Not loaded'}
              </span>
            </div>
            
            {authData.userData && (
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">Firestore UserData:</h3>
                <pre className="text-xs bg-blue-100 p-2 rounded overflow-auto">
                  {JSON.stringify(authData.userData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Functions:</h2>
          
          <div className="space-x-4">
            <button
              onClick={() => {
                console.log('🔍 Testing signOut...');
                if (authData.signOut) {
                  authData.signOut()
                    .then(() => console.log('✅ SignOut successful'))
                    .catch(err => console.error('❌ SignOut failed:', err));
                } else {
                  console.error('❌ signOut function not available');
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Test Logout
            </button>
            
            <button
              onClick={() => {
                console.log('🔍 Full AuthContext object:', authData);
                alert('Check browser console for full AuthContext data');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Log AuthContext
            </button>
            
            {authData.updateProfile && (
              <button
                onClick={() => {
                  console.log('🔍 Testing updateProfile...');
                  authData.updateProfile({ fullName: 'Test Name' })
                    .then(() => console.log('✅ UpdateProfile successful'))
                    .catch(err => console.error('❌ UpdateProfile failed:', err));
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Test Update Profile
              </button>
            )}
            
            {!authData.updateProfile && (
              <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded">
                ⚠️ Enhanced functions not available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}