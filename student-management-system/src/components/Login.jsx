import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Mail, Lock, ArrowRight, Eye, EyeOff,
    Shield, UserPlus, Key, CheckCircle, AlertCircle, LogIn
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './supabaseClient';
import '../styles/login.css';
import Logo from "../assets/Logo.jpg";

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    // RATE LIMITING STATE
    const [rateLimitMessage, setRateLimitMessage] = useState('');
    const [isRateLimited, setIsRateLimited] = useState(false);
    const failureCount = useRef(0);
    const cooldownTimer = useRef(null);

    // =============================================
    // RATE LIMITER TRIGGER LOGIC
    // =============================================
    const handleLoginFailure = useCallback((errorMessage) => {
        failureCount.current += 1;
        
        if (failureCount.current >= 5) {
            setIsRateLimited(true);
            const penaltySeconds = 15 * Math.pow(2, failureCount.current - 5);
            setRateLimitMessage(`Too many failed attempts. Cooldown active: ${penaltySeconds}s`);
            
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
            
            cooldownTimer.current = setTimeout(() => {
                setIsRateLimited(false);
                setRateLimitMessage('');
            }, penaltySeconds * 1000);
        } else {
            setErrors({ server: errorMessage });
        }
    }, []);

    // =============================================
    // PRIVILEGE ROUTING HANDLER
    // =============================================
    const handleSuccessfulAuth = useCallback(async (user) => {
        try {
            setIsRedirecting(true);
            console.log('=== LOGIN: Routing for:', user.email, '===');

            // STEP 1: Check if admin via RPC
            const { data: isAuthorizedAdmin, error: rpcError } = await supabase
                .rpc('check_is_administrative_user');

            if (rpcError) {
                console.error('RPC error:', rpcError);
                throw new Error('Verification failed. Access denied.');
            }

            failureCount.current = 0;

            // --- PATH A: ADMIN ---
            if (isAuthorizedAdmin === true) {
                console.log('✅ ADMIN - Redirecting to /admin');
                
                supabase
                    .from('admin_accounts')
                    .update({ last_login: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .then(({ error }) => {
                        if (error) console.warn('Last login update failed:', error.message);
                    });

                localStorage.setItem('user', JSON.stringify({
                    id: user.id,
                    email: user.email,
                    role: 'admin',
                    fullName: user.user_metadata?.full_name || 'Admin'
                }));

                navigate('/admin', { replace: true });
                return;
            }

            // --- PATH B: Standard user - MUST have profile with role ---
            console.log('Fetching profile for role-based routing...');

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', user.id)
                .single();

            // No profile exists - system error
            if (profileError || !profile) {
                console.error('❌ No profile found for user:', user.id);
                await supabase.auth.signOut();
                localStorage.removeItem('user');
                throw new Error('Account profile not found. Please contact support or complete registration.');
            }

            // Profile exists but no role assigned - system error
            if (!profile.role) {
                console.error('❌ Profile exists but no role for user:', user.id);
                await supabase.auth.signOut();
                localStorage.removeItem('user');
                throw new Error('Account role not assigned. Please contact support to complete your account setup.');
            }

            // Valid role - route directly
            const routes = {
                teacher: '/teacherdashboard',
                student: '/studentdashboard',
                parent: '/parentdashboard'
            };

            const redirectPath = routes[profile.role];

            if (!redirectPath) {
                console.error('❌ Unknown role:', profile.role);
                await supabase.auth.signOut();
                localStorage.removeItem('user');
                throw new Error(`Unknown role: ${profile.role}. Please contact support.`);
            }

            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                email: user.email,
                role: profile.role,
                fullName: profile.full_name || user.user_metadata?.full_name || 'User'
            }));

            console.log(`✅ Routing as ${profile.role} to:`, redirectPath);
            navigate(redirectPath, { replace: true });

        } catch (error) {
            console.error('❌ Auth routing error:', error);
            localStorage.removeItem('user');
            setIsRedirecting(false);
            handleLoginFailure(error.message || 'Authentication failed.');
        } finally {
            setLoading(false);
            setCheckingAccess(false);
        }
    }, [navigate, handleLoginFailure]);

    // =============================================
    // SYSTEM SUBSCRIPTIONS
    // =============================================
    useEffect(() => {
        let isMounted = true;
        let isProcessingAuth = false;

        const initializeAuthState = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user && isMounted) {
                    isProcessingAuth = true;
                    await handleSuccessfulAuth(session.user);
                } else if (isMounted) {
                    setCheckingAccess(false);
                }
            } catch (err) {
                if (isMounted) setCheckingAccess(false);
            }
        };

        initializeAuthState();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session && isMounted) {
                if (!isProcessingAuth) {
                    isProcessingAuth = true;
                    setCheckingAccess(true);
                    await handleSuccessfulAuth(session.user);
                }
            }
            
            if (event === 'SIGNED_OUT' && isMounted) {
                isProcessingAuth = false;
                setIsRedirecting(false);
                setLoading(false);
                setCheckingAccess(false);
                localStorage.removeItem('user');
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
        };
    }, [handleSuccessfulAuth]);

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
        if (isRateLimited || !validateForm()) return;
        
        setLoading(true);
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

            if (!data.user) {
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            handleLoginFailure(error.message);
        }
    };

    // =============================================
    // GOOGLE LOGIN - EXISTING USERS ONLY
    // =============================================
    const handleGoogleLogin = async () => {
        if (loading || isRedirecting || isRateLimited) return;
        
        setLoading(true);
        setErrors({});

        try {
            localStorage.removeItem('user');
            await supabase.auth.signOut();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Store a flag so AuthCallback knows this came from login page
            sessionStorage.setItem('googleLoginAttempt', 'true');

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/authcallback`,
                    queryParams: { 
                        access_type: 'offline', 
                        prompt: 'select_account'
                    }
                }
            });

            if (error) throw error;
        } catch (error) {
            sessionStorage.removeItem('googleLoginAttempt');
            setLoading(false);
            handleLoginFailure(error.message || 'Failed to login with Google');
        }
    };

    // Loading overlay
    if (checkingAccess || loading || isRedirecting) {
        return (
            <div className="auth-overlay-loading" style={{ background: '#0F172A', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100px', height: '100px' }}>
                    <div className="auth-loading-animation" style={{ width: '100px', height: '100px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', position: 'absolute' }}></div>
                    <img src={Logo} alt="NJEC Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 2 }} />
                </div>
            </div>
        );
    }

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
                                        <span className="auth-person-name">Thabo Tlou</span>
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
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LogIn size={24} color="#4F46E5" /> Portal Sign-In
                            </h2>
                            <p>Welcome back! Access your classes, resources, and console</p>
                        </div>

                        {rateLimitMessage && (
                            <div className="auth-error-alert" style={{ background: '#7F1D1D', borderColor: '#F87171' }}>
                                <Shield size={16} color="#F87171" />
                                <span style={{ color: '#FEE2E2', fontWeight: 'bold' }}>{rateLimitMessage}</span>
                            </div>
                        )}

                        {errors.server && !rateLimitMessage && (
                            <div className="auth-error-alert">
                                <AlertCircle size={16} />
                                <span>{errors.server}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="auth-form">
                            <div className="auth-input-group">
                                <label className="auth-input-label"><Mail size={16} />Account Email</label>
                                <div className="auth-input-field">
                                    <input type="email" name="email" value={formData.email}
                                        onChange={handleChange} placeholder="username@njec.com"
                                        className={`auth-input ${errors.email ? 'input-error' : ''}`} disabled={loading || isRedirecting || isRateLimited} />
                                    {formData.email && !errors.email && <CheckCircle size={16} className="auth-input-check" />}
                                </div>
                                {errors.email && <span className="auth-error-text">{errors.email}</span>}
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-input-label"><Lock size={16} />Secure Password</label>
                                <div className="auth-input-field">
                                    <input type={showPassword ? "text" : "password"} name="password"
                                        value={formData.password} onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`auth-input ${errors.password ? 'input-error' : ''}`} disabled={loading || isRedirecting || isRateLimited} />
                                    <button type="button" className="auth-password-eye"
                                        onClick={() => setShowPassword(!showPassword)} disabled={loading || isRedirecting || isRateLimited}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <span className="auth-error-text">{errors.password}</span>}
                            </div>

                            <div className="auth-options-row">
                                <label className="auth-remember">
                                    <input type="checkbox" checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)} disabled={loading || isRedirecting || isRateLimited} />
                                    <span className="auth-checkbox-visual"></span>Remember me
                                </label>
                                <button type="button" onClick={() => navigate('/forgot-password')}
                                    className="auth-forgot-link" disabled={loading || isRedirecting || isRateLimited}>
                                    <Key size={14} />Forgot Password?
                                </button>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={loading || isRedirecting || isRateLimited}>
                                <span>Secure Authenticated Access</span><ArrowRight size={18} />
                            </button>

                            <div className="auth-separator"><span>Federated Single Sign-On</span></div>

                            <button type="button" onClick={handleGoogleLogin}
                                className="auth-google-btn" disabled={loading || isRedirecting || isRateLimited}>
                                <FcGoogle size={18} />Continue with Google
                            </button>

                            <div className="auth-register-prompt" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                <UserPlus size={16} /><span>New here?</span>
                                <Link to="/signup" className="auth-register-link">Create a student account</Link>
                            </div>
                        </form>

                        <div className="auth-security-badge" style={{ marginTop: '24px' }}>
                            <Shield size={16} /><span>Hardware encrypted SSL & row-level security enabled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;