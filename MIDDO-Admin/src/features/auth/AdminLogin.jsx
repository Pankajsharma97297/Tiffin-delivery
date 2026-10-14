import React from 'react';

export function AdminLogin({
  authMode,
  loginForm,
  message,
  onLogin,
  onLoginChange,
  onModeChange,
  onRegister,
  onRegisterChange,
  registerForm,
  registerRoles,
}) {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>MIDDO Admin</strong>
            <small>Role based console access</small>
          </div>
        </div>
        <div className="auth-switch">
          <button
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => onModeChange('login')}>
            Login
          </button>
          <button
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => onModeChange('register')}>
            Register
          </button>
        </div>

        {authMode === 'login' ? (
          <form className="login-form" onSubmit={onLogin}>
            <label>
              Email
              <input
                value={loginForm.email}
                onChange={event => onLoginChange({...loginForm, email: event.target.value})}
                placeholder="superadmin@middo.com"
                type="email"
              />
            </label>
            <label>
              Password
              <input
                value={loginForm.password}
                onChange={event => onLoginChange({...loginForm, password: event.target.value})}
                placeholder="SuperAdmin@123"
                type="password"
              />
            </label>
            <button className="form-primary">Login</button>
            {message ? <p className="form-message">{message}</p> : null}
          </form>
        ) : (
          <form className="login-form" onSubmit={onRegister}>
            <label>
              Name
              <input
                value={registerForm.name}
                onChange={event => onRegisterChange({...registerForm, name: event.target.value})}
                placeholder="Ravi Kumar"
              />
            </label>
            <label>
              Email
              <input
                value={registerForm.email}
                onChange={event => onRegisterChange({...registerForm, email: event.target.value})}
                placeholder="user@middo.com"
                type="email"
              />
            </label>
            <label>
              Mobile Number
              <input
                value={registerForm.phone}
                onChange={event => onRegisterChange({...registerForm, phone: event.target.value})}
                placeholder="+91 98765 43210"
              />
            </label>
            <label>
              Role
              <select
                value={registerForm.role}
                onChange={event => onRegisterChange({...registerForm, role: event.target.value})}>
                {registerRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Password
              <input
                value={registerForm.password}
                onChange={event =>
                  onRegisterChange({...registerForm, password: event.target.value})
                }
                placeholder="Minimum 6 characters"
                type="password"
              />
            </label>
            <button className="form-primary">Create Account</button>
            {message ? <p className="form-message">{message}</p> : null}
          </form>
        )}
      </section>
    </main>
  );
}
