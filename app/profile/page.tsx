"use client";

import { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  User,
  CreditCard,
  History,
  Edit2,
  Save,
  X,
  Loader2,
  Trash2,
  Eye,
  Calendar,
  Shirt,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser, getToken, signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Generation {
  id: string;
  garment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
  generation_count: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [generationsPage, setGenerationsPage] = useState(1);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      loadGenerations();
    }
  }, [user, generationsPage]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push("/auth");
        return;
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          router.push("/auth");
          return;
        }
        throw new Error(result.error || "Failed to load profile");
      }

      setUser(result.user);
      setEditName(result.user.name || "");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGenerations = async () => {
    setLoadingGenerations(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        `/api/generations?page=${generationsPage}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setGenerations(result.generations);
        setTotalGenerations(result.total);
      }
    } catch (error: any) {
      console.error("Failed to load generations:", error);
    } finally {
      setLoadingGenerations(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      setUser(result.user);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to change password");
      }

      setChangePasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleViewGeneration = async (id: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/generations?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success && result.generation) {
        setSelectedGeneration(result.generation);
        setViewDialogOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load generation details",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGeneration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this generation?")) return;

    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/generations?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Generation deleted successfully",
        });
        loadGenerations();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete generation",
        variant: "destructive",
      });
    }
  };

  const handleLoadGeneration = (gen: any) => {
    // Store the generation ID and redirect to home
    if (typeof window !== "undefined") {
      sessionStorage.setItem("loadGenerationId", gen.id);
    }
    router.push("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-slate-600' />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalPages = Math.ceil(totalGenerations / 5);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <Link href='/'>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className='text-center'>
            <div className='flex items-center justify-center mb-4'>
              <User className='w-12 h-12 text-slate-700 mr-3' />
              <h1 className='text-4xl font-bold text-slate-900'>My Profile</h1>
            </div>
            <p className='text-lg text-slate-600'>
              Manage your account and view generation history
            </p>
          </div>
        </div>

        <div className='max-w-4xl mx-auto space-y-8'>
          {/* Profile Card */}
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your account details and settings
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className='w-4 h-4 mr-2' />
                    Edit
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name || "");
                      }}
                    >
                      <X className='w-4 h-4 mr-2' />
                      Cancel
                    </Button>
                    <Button
                      size='sm'
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      ) : (
                        <Save className='w-4 h-4 mr-2' />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label>Name</Label>
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder='Enter your name'
                    />
                  ) : (
                    <p className='text-slate-700 font-medium'>
                      {user.name || "Not set"}
                    </p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label>Email</Label>
                  <p className='text-slate-700 font-medium'>{user.email}</p>
                </div>
                <div className='space-y-2'>
                  <Label>Credits</Label>
                  <div className='flex items-center gap-2'>
                    <CreditCard className='w-4 h-4 text-blue-600' />
                    <span className='text-blue-600 font-bold text-lg'>
                      {user.credits}
                    </span>
                    <Link href='/pricing'>
                      <Button variant='outline' size='sm' className='ml-2'>
                        Buy More
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Member Since</Label>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4 text-slate-500' />
                    <p className='text-slate-700'>
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className='pt-4 border-t'>
                <Dialog
                  open={changePasswordOpen}
                  onOpenChange={setChangePasswordOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant='outline'>Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and a new password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                      <div className='space-y-2'>
                        <Label>Current Password</Label>
                        <Input
                          type='password'
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>New Password</Label>
                        <Input
                          type='password'
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>Confirm New Password</Label>
                        <Input
                          type='password'
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setChangePasswordOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={savingPassword}
                      >
                        {savingPassword ? (
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        ) : null}
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Generation History Card */}
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <History className='w-5 h-5' />
                    Generation History
                  </CardTitle>
                  <CardDescription>
                    View and manage your past generations ({totalGenerations}{" "}
                    total)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGenerations ? (
                <div className='flex justify-center py-8'>
                  <Loader2 className='w-6 h-6 animate-spin text-slate-600' />
                </div>
              ) : generations.length === 0 ? (
                <div className='text-center py-8 text-slate-500'>
                  <Shirt className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>No generations yet. Start by creating one!</p>
                  <Link href='/'>
                    <Button className='mt-4'>Create Generation</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className='space-y-4'>
                    {generations.map((gen) => (
                      <div
                        key={gen.id}
                        className='flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors'
                      >
                        <div className='flex items-center gap-4'>
                          <div className='w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center'>
                            <Shirt className='w-6 h-6 text-slate-600' />
                          </div>
                          <div>
                            <p className='font-medium text-slate-800 capitalize'>
                              {gen.garment_type}
                            </p>
                            <p className='text-sm text-slate-500'>
                              {formatDate(gen.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              gen.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : gen.status === "front_generated"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {gen.status === "front_generated"
                              ? "Front Generated"
                              : gen.status}
                          </span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleViewGeneration(gen.id)}
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteGeneration(gen.id)}
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className='flex justify-center gap-2 mt-6'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setGenerationsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={generationsPage === 1}
                      >
                        Previous
                      </Button>
                      <span className='flex items-center px-4 text-sm text-slate-600'>
                        Page {generationsPage} of {totalPages}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setGenerationsPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={generationsPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Generation Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='capitalize'>
                {selectedGeneration?.garment_type} Generation
              </DialogTitle>
              <DialogDescription>
                Created on{" "}
                {selectedGeneration &&
                  formatDate(selectedGeneration.created_at)}
              </DialogDescription>
            </DialogHeader>
            {selectedGeneration && (
              <div className='space-y-6 py-4'>
                {/* Front Views */}
                {(selectedGeneration.generated_front1 ||
                  selectedGeneration.generated_front2 ||
                  selectedGeneration.generated_front3) && (
                  <div>
                    <h3 className='text-sm font-semibold mb-3'>Front Views</h3>
                    <div className='grid grid-cols-3 gap-4'>
                      {selectedGeneration.generated_front1 && (
                        <img
                          src={selectedGeneration.generated_front1}
                          alt='Front View 1'
                          className='w-full rounded-lg border'
                        />
                      )}
                      {selectedGeneration.generated_front2 && (
                        <img
                          src={selectedGeneration.generated_front2}
                          alt='Front View 2'
                          className='w-full rounded-lg border'
                        />
                      )}
                      {selectedGeneration.generated_front3 && (
                        <img
                          src={selectedGeneration.generated_front3}
                          alt='Front View 3'
                          className='w-full rounded-lg border'
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Side and Back Views */}
                {(selectedGeneration.generated_side ||
                  selectedGeneration.generated_back) && (
                  <div>
                    <h3 className='text-sm font-semibold mb-3'>
                      Side & Back Views
                    </h3>
                    <div className='grid grid-cols-2 gap-4'>
                      {selectedGeneration.generated_side && (
                        <div>
                          <p className='text-xs text-slate-500 mb-1'>
                            Side View
                          </p>
                          <img
                            src={selectedGeneration.generated_side}
                            alt='Side View'
                            className='w-full rounded-lg border'
                          />
                        </div>
                      )}
                      {selectedGeneration.generated_back && (
                        <div>
                          <p className='text-xs text-slate-500 mb-1'>
                            Back View
                          </p>
                          <img
                            src={selectedGeneration.generated_back}
                            alt='Back View'
                            className='w-full rounded-lg border'
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button onClick={() => handleLoadGeneration(selectedGeneration)}>
                Load in Editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
