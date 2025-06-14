import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { createUserDocument } from "../utils/userUtils";
import { retryOperation } from "../utils/operationQueue";

interface AuthContextType {
  currentUser: User | null;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  loading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in or use a different email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Sign in with email and password is not enabled. Please try signing in with Google.";
    case "auth/weak-password":
      return "Please choose a stronger password. It should be at least 6 characters long.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support for assistance.";
    case "auth/user-not-found":
      return "We couldn't find an account with this email. Please check your email or sign up for a new account.";
    case "auth/wrong-password":
      return "The password you entered is incorrect. Please try again or reset your password.";
    case "auth/popup-closed-by-user":
      return "The sign in window was closed. Please try again.";
    case "auth/popup-blocked":
      return "The sign in window was blocked by your browser. Please allow popups for this site and try again.";
    case "auth/network-request-failed":
      return "Unable to connect to the server. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Please wait a few minutes before trying again.";
    case "auth/requires-recent-login":
      return "For security reasons, please sign in again to continue.";
    case "auth/invalid-credential":
      return "The sign in information is incorrect or has expired. Please try again.";
    case "auth/invalid-verification-code":
      return "The verification code you entered is invalid. Please try again.";
    case "auth/invalid-verification-id":
      return "The verification session has expired. Please request a new code.";
    case "auth/missing-verification-code":
      return "Please enter the verification code.";
    default:
      return `An error occurred: ${error.message}`;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleAuthError = (error: unknown, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    const authError = error as AuthError;
    setError(getAuthErrorMessage(authError));
    throw error;
  };

  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user document with retry logic
      await retryOperation(() => createUserDocument(result.user.uid, email));

      return result;
    } catch (error) {
      handleAuthError(error, "signup");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      handleAuthError(error, "login");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      handleAuthError(error, "logout");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      // Create/update user document with retry logic
      await retryOperation(() =>
        createUserDocument(result.user.uid, result.user.email!, {
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: "google",
        })
      );

      return result;
    } catch (error) {
      handleAuthError(error, "Google sign-in");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      handleAuthError(error, "password reset");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!isInitialized) {
        setIsInitialized(true);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Don't render children until Firebase Auth is initialized
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    error,
    loading,
    isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
