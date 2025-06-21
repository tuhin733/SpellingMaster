import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthLeftSection } from "./shared/AuthLeftSection";
import { validateEmail, validatePassword } from "../utils/authValidation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { login, signInWithGoogle, error: authError } = useAuth();

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setValidationErrors({
      email: emailValidation.error || "",
      password: passwordValidation.error || "",
    });

    return emailValidation.isValid && passwordValidation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (err) {
      // Error is handled by AuthContext
      console.error(err);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      // Error is handled by AuthContext
      console.error(err);
    }
    setLoading(false);
  };

  // Clear loading state when component unmounts
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  return (
    <div className="min-h-screen flex">
      <AuthLeftSection
        title="Welcome Back"
        subtitle="Improve your spelling skills with our interactive learning platform"
      />

      {/* Right Section - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white dark:bg-gray-800">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <h2 className="text-lg text-gray-600 dark:text-gray-300">
              Sign in to continue learning
            </h2>
          </div>

          {authError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none relative block w-full px-4 py-3.5 border ${
                    validationErrors.email
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  } placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 dark:bg-gray-700/50 transition-all duration-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700`}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      const { error } = validateEmail(e.target.value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        email: error || "",
                      }));
                    }
                  }}
                  onBlur={() => {
                    const { error } = validateEmail(email);
                    setValidationErrors((prev) => ({
                      ...prev,
                      email: error || "",
                    }));
                  }}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={`appearance-none relative block w-full px-4 py-3.5 border ${
                      validationErrors.password
                        ? "border-red-500"
                        : "border-gray-200 dark:border-gray-600"
                    } placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 dark:bg-gray-700/50 transition-all duration-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 pr-12`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        const { error } = validatePassword(e.target.value);
                        setValidationErrors((prev) => ({
                          ...prev,
                          password: error || "",
                        }));
                      }
                    }}
                    onBlur={() => {
                      const { error } = validatePassword(password);
                      setValidationErrors((prev) => ({
                        ...prev,
                        password: error || "",
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12.24 24.0008C15.4764 24.0008 18.2058 22.9382 20.1944 21.1039L16.3274 18.1055C15.2516 18.8375 13.8626 19.252 12.24 19.252C9.07376 19.252 6.39287 17.1399 5.44288 14.3003H1.45801V17.3912C3.43223 21.4434 7.54214 24.0008 12.24 24.0008Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.44277 14.3003C5.21438 13.5681 5.08579 12.7862 5.08579 12.0001C5.08579 11.214 5.21438 10.4321 5.44277 9.69995V6.60907H1.45791C0.530477 8.24256 0 10.0682 0 12.0001C0 13.932 0.530477 15.7576 1.45791 17.3911L5.44277 14.3003Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.24 4.74966C14.0291 4.74966 15.6265 5.36715 16.8902 6.54837L20.3193 3.12132C18.2026 1.18924 15.4708 0 12.24 0C7.54214 0 3.43223 2.55737 1.45801 6.60957L5.44287 9.70045C6.39287 6.86082 9.07376 4.74966 12.24 4.74966Z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-medium">Sign in with Google</span>
              </button>
            </div>
          </form>

          <div className="text-center mt-6 space-y-2">
            <Link
              to="/signup"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Don't have an account?{" "}
              <span className="font-semibold">Create one</span>
            </Link>
            <div>
              <Link
                to="/forgot-password"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
