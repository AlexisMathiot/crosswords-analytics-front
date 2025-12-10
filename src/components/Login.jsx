import { useState } from 'react';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_APP_PASSWORD;

    if (password === correctPassword) {
      // Store auth state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError('Mot de passe incorrect');
      setPassword('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Crosswords Analytics</h1>
        <p>Veuillez entrer le mot de passe pour accéder au dashboard</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoFocus
          />
          <button type="submit">Connexion</button>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
