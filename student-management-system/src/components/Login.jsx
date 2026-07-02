import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Mail, Lock, ArrowRight, Eye, EyeOff,
    Shield, UserPlus, Key, CheckCircle, AlertCircle
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './supabaseClient';
import '../styles/login.css';
import Logo from "../assets/Logo.jpg"

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Listen for auth changes
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && !isLoggingIn && !isRedirecting) {
                    await handleSuccessfulAuth(session.user);
                }
            } catch (error) {
                console.error('Session check error:', error);
            }
        };

        checkExistingSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);
            if (event === 'SIGNED_IN' && session && isLoggingIn && !isRedirecting) {
                setIsRedirecting(true);
                await handleSuccessfulAuth(session.user);
            }
            if (event === 'SIGNED_OUT') {
                setIsLoggingIn(false);
                setIsRedirecting(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [isLoggingIn, isRedirecting]);

    // =============================================
    // MAIN AUTH HANDLER
    // =============================================
    const handleSuccessfulAuth = async (user) => {
        try {
            console.log('=== LOGIN: Processing auth for:', user.email, '===');

            // STEP 1: Check admin_accounts table FIRST
            console.log('Step 1: Checking admin_accounts...');
            const { data: adminData, error: adminError } = await supabase
                .from('admin_accounts')
                .select('*')
                .eq('user_id', user.id)
                .single();

            console.log('Admin check:', { found: !!adminData, error: adminError });

            if (adminData && adminData.is_active) {
                console.log('✅ ADMIN FOUND - Level:', adminData.admin_level);
                
                // Update last login
                await supabase
                    .from('admin_accounts')
                    .update({ last_login: new Date().toISOString() })
                    .eq('user_id', user.id);

                // Save admin to localStorage
                const adminUser = {
                    id: user.id,
                    email: user.email,
                    role: 'admin',
                    adminLevel: adminData.admin_level,
                    fullName: adminData.full_name || user.user_metadata?.full_name || 'Admin'
                };
                localStorage.setItem('user', JSON.stringify(adminUser));
                console.log('Saved admin to localStorage:', adminUser);

                // Redirect to admin dashboard
                navigate('/admin', { replace: true });
                return;
            }

            console.log('Step 2: Not admin, checking profiles...');

            // STEP 2: Check profiles table for students/teachers/parents
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                // No profile - create one and send to role selection
                console.log('No profile found, creating one...');
                await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                    avatar_url: user.user_metadata?.avatar_url || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                navigate('/select-role', {
                    state: { userId: user.id, email: user.email, fullName: user.user_metadata?.full_name || '' },
                    replace: true
                });
                return;
            }

            // STEP 3: Profile exists with role
            if (profile && profile.role) {
                console.log('Profile found with role:', profile.role);
                
                const userData = {
                    id: user.id,
                    email: user.email,
                    role: profile.role,
                    fullName: profile.full_name || user.user_metadata?.full_name || '',
                    avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || ''
                };
                localStorage.setItem('user', JSON.stringify(userData));

                // Redirect based on role
                const routes = {
                    admin: '/admin',
                    teacher: '/teacher',
                    student: '/student',
                    parent: '/parent'
                };
                
                const path = routes[profile.role] || '/select-role';
                navigate(path, { replace: true });
            } else {
                // Profile exists but no role
                navigate('/select-role', {
                    state: { userId: user.id, email: user.email, fullName: profile?.full_name || '' },
                    replace: true
                });
            }
        } catch (error) {
            console.error('❌ Auth error:', error);
            setErrors({ server: 'Error processing login. Please try again.' });
            setIsRedirecting(false);
            setIsLoggingIn(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        setIsLoggingIn(true);
        setErrors({});

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Invalid email or password');
                }
                throw error;
            }

            if (data.user) {
                await handleSuccessfulAuth(data.user);
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrors({ server: error.message });
            setLoading(false);
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (loading || isRedirecting) return;
        
        setLoading(true);
        setIsLoggingIn(true);
        setErrors({});

        try {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            await new Promise(resolve => setTimeout(resolve, 100));

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/authcallback`,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Google login error:', error);
            setErrors({ server: error.message || 'Failed to login with Google' });
            setLoading(false);
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="auth-brand-panel">
                    <div className="auth-brand-content">
                        <div className="auth-brand-header-row">
                            <div className="auth-logo-section">
                                <div className="auth-logo-img">
                                    <img src={Logo} alt="Logo" />
                                </div>
                                <div className="auth-brand-text">
                                    <h1>NJEC</h1>
                                    <span>New Jerusalem Extra Classes</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/')} className="auth-back-btn">
                                ← Back to Home
                            </button>
                        </div>
                        <div className="auth-brand-body">
                            <div className="auth-testimonial-compact">
                                <div className="auth-quote-icon">"</div>
                                <p className="auth-testimonial-text">
                                    Search and find more learning resources in one place now.
                                </p>
                                <div className="auth-testimonial-person">
                                    <div className="auth-person-avatar">TT</div>
                                    <div className="auth-person-details">
                                        <span className="auth-person-name">Thabo TLou</span>
                                        <span className="auth-person-role">UI Designer & Student</span>
                                    </div>
                                </div>
                            </div>
                            <div className="auth-stats-compact">
                                <div className="auth-stat-item">
                                    <span className="auth-stat-value">500+</span>
                                    <span className="auth-stat-desc">Students</span>
                                </div>
                                <div className="auth-stat-divider"></div>
                                <div className="auth-stat-item">
                                    <span className="auth-stat-value">98%</span>
                                    <span className="auth-stat-desc">Satisfaction</span>
                                </div>
                                <div className="auth-stat-divider"></div>
                                <div className="auth-stat-item">
                                    <span className="auth-stat-value">15+</span>
                                    <span className="auth-stat-desc">Subjects</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-panel">
                    <div className="auth-form-content">
                        <div className="auth-form-header">
                            <h2>Welcome back</h2>
                            <p>Please enter your account details</p>
                        </div>

                        {errors.server && (
                            <div className="auth-error-alert">
                                <AlertCircle size={16} />
                                <span>{errors.server}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="auth-form">
                            <div className="auth-input-group">
                                <label className="auth-input-label"><Mail size={16} />Email</label>
                                <div className="auth-input-field">
                                    <input type="email" name="email" value={formData.email}
                                        onChange={handleChange} placeholder="thabo@gmail.com"
                                        className={`auth-input ${errors.email ? 'input-error' : ''}`} disabled={loading} />
                                    {formData.email && !errors.email && <CheckCircle size={16} className="auth-input-check" />}
                                </div>
                                {errors.email && <span className="auth-error-text">{errors.email}</span>}
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-input-label"><Lock size={16} />Password</label>
                                <div className="auth-input-field">
                                    <input type={showPassword ? "text" : "password"} name="password"
                                        value={formData.password} onChange={handleChange}
                                        placeholder="Enter password"
                                        className={`auth-input ${errors.password ? 'input-error' : ''}`} disabled={loading} />
                                    <button type="button" className="auth-password-eye"
                                        onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <span className="auth-error-text">{errors.password}</span>}
                            </div>

                            <div className="auth-options-row">
                                <label className="auth-remember">
                                    <input type="checkbox" checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)} disabled={loading} />
                                    <span className="auth-checkbox-visual"></span>Remember me
                                </label>
                                <button type="button" onClick={() => navigate('/forgot-password')}
                                    className="auth-forgot-link" disabled={loading}>
                                    <Key size={14} />Forgot Password?
                                </button>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? <div className="auth-btn-spinner"></div> :
                                    <><span>Sign In</span><ArrowRight size={18} /></>}
                            </button>

                            <div className="auth-separator"><span>Or continue with</span></div>

                            <button type="button" onClick={handleGoogleLogin}
                                className="auth-google-btn" disabled={loading || isRedirecting}>
                                <FcGoogle size={18} />Google
                            </button>

                            <div className="auth-register-prompt">
                                <UserPlus size={16} /><span>New registration?</span>
                                <Link to="/signup" className="auth-register-link">Create an account</Link>
                            </div>
                        </form>

                        <div className="auth-security-badge">
                            <Shield size={16} /><span>Your data is securely protected</span>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="auth-overlay-loading">
                    <div className="auth-loading-box">
                        <div className="auth-loading-animation"></div>
                        <p>Signing you in...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;