import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, loading, error, clearError } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      clearError();
      
      if (isLogin) {
        await login({
          email: data.email,
          password: data.password
        });
      } else {
        await signup({
          username: data.username,
          email: data.email,
          password: data.password
        });
      }
      
      reset();
    } catch (error) {
      console.error('Auth error:', error);
      // Error is handled by the auth context
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
    clearError();
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-form">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to access your collaborative workspace' 
              : 'Join to start collaborating on drawings'
            }
          </p>

          {error && (
            <div className="auth-error">
              <span>⚠️ {error}</span>
              <button onClick={clearError} className="error-close">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form-fields">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  {...register('username', {
                    required: !isLogin ? 'Username is required' : false,
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    },
                    maxLength: {
                      value: 30,
                      message: 'Username must be less than 30 characters'
                    }
                  })}
                  placeholder="Enter your username"
                  disabled={loading}
                />
                {errors.username && (
                  <span className="field-error">{errors.username.message}</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email'
                  }
                })}
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <span className="field-error">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                placeholder="Enter your password"
                disabled={loading}
              />
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', {
                    required: !isLogin ? 'Please confirm your password' : false,
                    validate: value => 
                      isLogin || value === password || 'Passwords do not match'
                  })}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword.message}</span>
                )}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={toggleMode}
                className="toggle-button"
                disabled={loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <div className="auth-info">
          <h3>Collaborative Drawing</h3>
          <ul>
            <li>✨ Real-time collaboration</li>
            <li>🎨 Rich drawing tools</li>
            <li>💾 Auto-save your work</li>
            <li>🔒 Secure and private</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
