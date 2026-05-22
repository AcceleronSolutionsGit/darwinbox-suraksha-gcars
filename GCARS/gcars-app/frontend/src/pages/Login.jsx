import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await login(identifier, password);
    if (result.success) {
      toast.success('Signed in successfully');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message || 'Invalid credentials');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #090a0f 0%, #151824 100%)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Radial Glows - Unified Canvas */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(243,115,33,0.18) 0%, transparent 60%)',
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-5%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(46,81,162,0.22) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Subtle Grid overlay - Entire viewport */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '45px 45px',
        maskImage: 'radial-gradient(ellipse at center, black, transparent 90%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container - Unified Frame with No Harsh Split */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1200px',
        zIndex: 1,
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 40px',
        boxSizing: 'border-box'
      }}>
        
        {/* Left Side: Branding / Content */}
        <div style={{
          flex: 1.1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: '60px',
          boxSizing: 'border-box'
        }}>
          {/* Logo animation block */}
          <div className="animate-scale-in" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="Gainwell" style={{ height: '48px', objectFit: 'contain' }} />
              <div style={{
                height: '24px',
                width: '1px',
                background: 'rgba(255, 255, 255, 0.2)'
              }} />
              <span style={{
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #F37321, #ff9f43)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>CAPEX</span>
            </div>
          </div>

          {/* Texts animation block */}
          <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
            <div className="animate-slide-right" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(243, 115, 33, 0.1)',
              border: '1px solid rgba(243, 115, 33, 0.2)',
              borderRadius: '4px',
              color: '#F37321',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F37321', display: 'inline-block', boxShadow: '0 0 8px #F37321' }} />
              Enterprise Strategy
            </div>
            
            <h1 className="animate-slide-up" style={{
              color: '#ffffff',
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              margin: 0
            }}>
              Strategic Capital <br />
              <span style={{
                background: 'linear-gradient(90deg, #F37321 0%, #ff8f3d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                Asset Approval
              </span>
            </h1>
            
            <p className="animate-slide-up-delay" style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '17px',
              marginTop: '24px',
              maxWidth: '480px',
              lineHeight: 1.6,
              fontWeight: 300
            }}>
              Experience seamless enterprise workflow routing, real-time budget mapping, and audit-ready tracking for all organizational capital allocations.
            </p>
          </div>

          <div className="animate-fade-in" style={{
            position: 'relative',
            zIndex: 2,
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '13px',
            fontWeight: 400
          }}>
            © {new Date().getFullYear()} Gainwell Commosales Pvt. Ltd. All rights reserved.
          </div>
        </div>

        {/* Right Side: The Sharp animated Login Box */}
        <div style={{
          flex: 0.9,
          display: 'flex',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Animated Glow Border Frame */}
          <div className="sharp-login-wrapper" style={{
            position: 'relative',
            padding: '1px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '4px', // Sharp Corners
            overflow: 'hidden'
          }}>
            {/* Moving Laser Line (Sweep Animation) */}
            <div className="laser-beam" />

            {/* Inner Content Card */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              minWidth: '380px',
              maxWidth: '440px',
              background: 'rgba(9, 10, 15, 0.9)', // Matching main container theme
              borderRadius: '3px', // Sharp Corners
              padding: '48px 40px',
              boxSizing: 'border-box',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="animate-slide-up-delay2">
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '8px',
                    letterSpacing: '1px'
                  }}>
                    USER ID / EMPLOYEE CODE
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 3,
                      pointerEvents: 'none'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter your User ID"
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px', // Sharp Corners
                        padding: '16px 16px 16px 48px',
                        fontSize: '14px',
                        color: '#ffffff',
                        outline: 'none',
                        transition: 'all 0.25s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.target.style.borderColor = '#F37321';
                        e.target.style.boxShadow = '0 0 0 3px rgba(243, 115, 33, 0.15)';
                      }}
                      onBlur={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <div className="animate-slide-up-delay2">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.8)',
                      letterSpacing: '1px'
                    }}>
                      PASSWORD
                    </label>
                    <a href="#" style={{
                      fontSize: '13px',
                      color: '#F37321',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.color = '#ff9f43'}
                    onMouseLeave={e => e.target.style.color = '#F37321'}
                    >
                      Forgot password?
                    </a>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 3,
                      pointerEvents: 'none'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px', // Sharp Corners
                        padding: '16px 48px 16px 48px',
                        fontSize: '14px',
                        color: '#ffffff',
                        outline: 'none',
                        transition: 'all 0.25s ease',
                        boxSizing: 'border-box',
                        letterSpacing: !showPass && password.length > 0 ? '3px' : 'normal'
                      }}
                      onFocus={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.target.style.borderColor = '#F37321';
                        e.target.style.boxShadow = '0 0 0 3px rgba(243, 115, 33, 0.15)';
                      }}
                      onBlur={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        padding: 0
                      }}
                    >
                      {showPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="animate-slide-up-delay3"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(90deg, #F37321 0%, #ff8f3d 100%)',
                    border: 'none',
                    borderRadius: '3px', // Sharp Corners
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.25s ease',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 8px 24px rgba(243, 115, 33, 0.25)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '12px'
                  }}
                  onMouseEnter={e => {
                    if(!loading) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 12px 28px rgba(243, 115, 33, 0.4)';
                    }
                  }}
                  onMouseLeave={e => {
                    if(!loading) {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = '0 8px 24px rgba(243, 115, 33, 0.25)';
                    }
                  }}
                >
                  {loading ? (
                    <span className="spinner" style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                  ) : 'Sign in to Account'}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Entrance Animations */
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); filter: blur(4px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Border Laser Animation Effect */
        @keyframes laserSweep {
          0% { transform: translate(-100%, -100%) rotate(0deg); }
          100% { transform: translate(100%, 100%) rotate(360deg); }
        }

        .sharp-login-wrapper {
          opacity: 0;
          animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          transition: all 0.4s ease;
        }
        
        .sharp-login-wrapper:hover {
          box-shadow: 0 0 25px rgba(243, 115, 33, 0.2), 0 0 0 1px rgba(243, 115, 33, 0.3);
          background: rgba(243, 115, 33, 0.3);
        }

        .laser-beam {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            transparent, 
            rgba(243, 115, 33, 0.05), 
            rgba(243, 115, 33, 0.4), 
            rgba(243, 115, 33, 0.05), 
            transparent 60%
          );
          animation: laserSweep 4s linear infinite;
          z-index: 1;
          pointer-events: none;
        }

        .animate-scale-in {
          animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-right {
          animation: slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up-delay {
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
        }
        .animate-slide-up-delay2 {
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
        }
        .animate-slide-up-delay3 {
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
        }
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 1s ease 0.5s forwards;
        }

        /* Override Autofill style for web browsers */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgba(9, 10, 15, 0.95) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        @media (max-width: 992px) {
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 40px 20px !important;
          }
          div[style*="flex: 1.1"] {
            margin-bottom: 40px;
            padding-right: 0 !important;
          }
          .sharp-login-wrapper {
            width: 100% !important;
          }
          div[style*="min-width: 380px"] {
            min-width: 100% !important;
          }
        }
      ` }} />
    </div>
  );
}
