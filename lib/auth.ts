import { supabase } from "./supabase";
import CryptoJS from "crypto-js";

const SECRET_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  "default-secret-key-change-in-production";

// Encrypt access token before storing in localStorage
export const encryptToken = (token: string): string => {
  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

// Decrypt access token from localStorage
export const decryptToken = (encryptedToken: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Hash password (simple implementation - in production use bcrypt on backend)
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// Store encrypted token in localStorage
export const storeToken = (token: string): void => {
  const encrypted = encryptToken(token);
  localStorage.setItem("accessToken", encrypted);
};

// Get decrypted token from localStorage
export const getToken = (): string | null => {
  const encrypted = localStorage.getItem("accessToken");
  if (!encrypted) return null;
  try {
    return decryptToken(encrypted);
  } catch {
    return null;
  }
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem("accessToken");
};

// Sign up new user
export const signUp = async (email: string, password: string) => {
  try {
    const passwordHash = hashPassword(password);

    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        credits: 3, // Initial 3 free credits
      })
      .select()
      .single();

    if (error) throw error;
    // console.log("User signed up:", data);
    return { success: true, user: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign in user
export const signIn = async (email: string, password: string) => {
  try {
    const passwordHash = hashPassword(password);

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password_hash", passwordHash)
      .single();

    if (error || !users) {
      return { success: false, error: "Invalid email or password" };
    }

    // Generate access token (simple implementation)
    const accessToken = CryptoJS.lib.WordArray.random(32).toString();

    // Store session in database
    const { error: sessionError } = await supabase
      .from("user_sessions")
      .insert({
        user_id: users.id,
        access_token: accessToken,
        login_at: new Date().toISOString(),
      });

    if (sessionError) throw sessionError;

    // Store encrypted token in localStorage
    storeToken(accessToken);

    // console.log("User signed in:", users);

    return { success: true, user: users, token: accessToken };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign out user
export const signOut = async () => {
  try {
    const token = getToken();
    if (!token) return { success: true };

    // Update session with logout timestamp
    await supabase
      .from("user_sessions")
      .update({ logout_at: new Date().toISOString() })
      .eq("access_token", token)
      .is("logout_at", null);

    // Remove token from localStorage
    removeToken();

    // console.log("User signed out");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Verify token and get user
export const verifyToken = async (token: string) => {
  try {
    const { data: session, error } = await supabase
      .from("user_sessions")
      .select("user_id")
      .eq("access_token", token)
      .is("logout_at", null)
      .single();

    if (error || !session) {
      return { success: false, error: "Invalid token" };
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user_id)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    // console.log("Token verified for user:", user);

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get current user from token
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  const result = await verifyToken(token);
  // console.log("Current user fetched:", result);
  return result.success ? result.user : null;
};

// Update user credits
export const updateUserCredits = async (userId: string, credits: number) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        credits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // console.log("User credits updated:", data);
    return { success: true, user: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Check and deduct credits
export const checkAndDeductCredits = async (userId: string) => {
  try {
    // Get current user
    const { data: user, error } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return { success: false, error: "User not found" };
    }

    if (user.credits <= 0) {
      return { success: false, error: "Insufficient credits", credits: 0 };
    }

    // Deduct 1 credit
    const newCredits = user.credits - 1;
    const updateResult = await updateUserCredits(userId, newCredits);

    if (!updateResult.success) {
      return { success: false, error: "Failed to update credits" };
    }

    // console.log("Credits deducted. New credits:", newCredits);

    return { success: true, credits: newCredits };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
