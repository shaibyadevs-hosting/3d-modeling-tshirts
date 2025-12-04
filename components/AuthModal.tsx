// New file for auth component
import { useState } from "react";

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(true);

  const handleSubmit = () => {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (isSignup) {
      if (users[email]) return alert("User exists");
      users[email] = { password, credits: 0, isPaid: false }; // Credits start at 0 after free
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", email);
      onLogin({ email, ...users[email] });
    } else {
      if (!users[email] || users[email].password !== password)
        return alert("Invalid credentials");
      localStorage.setItem("currentUser", email);
      onLogin({ email, ...users[email] });
    }
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg'>
        <h2>{isSignup ? "Signup" : "Login"}</h2>
        <input
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='block mb-2 p-2 border'
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='block mb-2 p-2 border'
        />
        <button
          onClick={handleSubmit}
          className='bg-blue-500 text-white px-4 py-2 mr-2'
        >
          {isSignup ? "Signup" : "Login"}
        </button>
        <button
          onClick={() => setIsSignup(!isSignup)}
          className='text-blue-500'
        >
          Switch to {isSignup ? "Login" : "Signup"}
        </button>
        <button onClick={onClose} className='ml-2 text-gray-500'>
          Close
        </button>
      </div>
    </div>
  );
}
