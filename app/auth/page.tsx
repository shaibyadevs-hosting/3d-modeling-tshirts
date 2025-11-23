"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shirt, Loader2, Mail, Lock } from "lucide-react";
import { signIn, signUp } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!loginEmail || !loginPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      router.push("/");
    } else {
      toast({
        title: "Login Failed",
        description: result.error || "Invalid credentials",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!signupEmail || !signupPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await signUp(signupEmail, signupPassword);

    if (result.success) {
      toast({
        title: "Success",
        description:
          "Account created successfully! You have 9 free credits. Please login.",
      });
      // Switch to login tab
      setLoginEmail(signupEmail);
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
    } else {
      toast({
        title: "Signup Failed",
        description: result.error || "Failed to create account",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <Link
            href='/'
            className='inline-flex items-center justify-center mb-4 group'
          >
            <Shirt className='w-10 h-10 text-slate-700 mr-2 group-hover:text-slate-900 transition-colors' />
            <h1 className='text-3xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors'>
              3D Garment Visualizer
            </h1>
          </Link>
          <p className='text-slate-600'>
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Auth Card */}
        <Card className='shadow-xl border-slate-200'>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Get 3 free credits when you sign up!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='login' className='w-full'>
              <TabsList className='grid w-full grid-cols-2 mb-6'>
                <TabsTrigger value='login'>Login</TabsTrigger>
                <TabsTrigger value='signup'>Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value='login'>
                <form onSubmit={handleLogin} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='login-email'>Email</Label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                      <Input
                        id='login-email'
                        type='email'
                        placeholder='your.email@example.com'
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className='pl-10'
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='login-password'>Password</Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                      <Input
                        id='login-password'
                        type='password'
                        placeholder='••••••••'
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className='pl-10'
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value='signup'>
                <form onSubmit={handleSignup} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='signup-email'>Email</Label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                      <Input
                        id='signup-email'
                        type='email'
                        placeholder='your.email@example.com'
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className='pl-10'
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='signup-password'>Password</Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                      <Input
                        id='signup-password'
                        type='password'
                        placeholder='••••••••'
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className='pl-10'
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirm-password'>Confirm Password</Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                      <Input
                        id='confirm-password'
                        type='password'
                        placeholder='••••••••'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className='pl-10'
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center mt-6'>
          <Link
            href='/'
            className='text-sm text-slate-600 hover:text-slate-900 transition-colors'
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
