"use client";
import { useEffect, useState } from "react";

export default function AuthForm() {
  useEffect(() => {
    document.body.classList.add("login");
    return () => document.body.classList.remove("login");
  }, []);
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (isRegistering) {
            if (formData.password !== formData.confirmPassword) {
                setError("Hasła nie są identyczne!");
                return;
            }

            try {
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();
                if (response.ok) {
                    setSuccessMessage(data.message || "Rejestracja zakończona sukcesem! Sprawdź e-mail.");
                } else {
                    setError(data.message || "Błąd rejestracji. Spróbuj ponownie.");
                }
            } catch (error) {
                setError("Wystąpił błąd serwera. Spróbuj ponownie później.");
            }
        } else {
            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    localStorage.setItem("token", data.token);
                    window.location.href = "/dashboard"; // Przekierowanie po zalogowaniu
                } else {
                    setError(data.message || "Nieprawidłowe dane logowania.");
                }
            } catch (error) {
                setError("Wystąpił błąd serwera. Spróbuj ponownie później.");
            }
        }
    };

    return (
        <div className="container login-background">
            <div className="form-box">
                <h2 className="title">
                    <span role="img" aria-label="lock">🔐</span> System Ticketowy
                </h2>

                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <input type="text" name="first_name" placeholder="Imię" value={formData.first_name} onChange={handleChange} required />
                            <input type="text" name="last_name" placeholder="Nazwisko" value={formData.last_name} onChange={handleChange} required />
                            <input type="tel" name="phone" placeholder="Numer telefonu" value={formData.phone} onChange={handleChange} required />
                        </>
                    )}

                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    <input type="password" name="password" placeholder="Hasło" value={formData.password} onChange={handleChange} required />

                    {isRegistering && (
                        <input type="password" name="confirmPassword" placeholder="Powtórz hasło" value={formData.confirmPassword} onChange={handleChange} required />
                    )}

                    <button type="submit">
                        {isRegistering ? "Zarejestruj się" : "Zaloguj się"}
                    </button>
                </form>

                <p>
                    {isRegistering ? "Masz już konto?" : "Nie masz konta?"}{" "}
                    <span onClick={() => setIsRegistering(!isRegistering)} className="link">
                        {isRegistering ? "Zaloguj się" : "Zarejestruj się"}
                    </span>
                </p>
            </div>
        </div>
    );
}
