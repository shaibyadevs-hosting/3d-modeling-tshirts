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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Loader2,
  Shirt,
  CreditCard,
  LogOut,
  User,
  Download,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, signOut, getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  const [garmentType, setGarmentType] = useState("");
  const [garmentRecordID, setGarmentRecordID] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [frontView, setFrontView] = useState<File | null>(null);
  const [backView, setBackView] = useState<File | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedFrontViews, setGeneratedFrontViews] = useState<{
    front1: string;
    front2: string;
    front3: string;
  } | null>(null);
  const [generatedSideViews, setGeneratedSideViews] = useState<{
    side1: string;
    side2: string;
    side3: string;
  } | null>(null);
  const [generatedBackViews, setGeneratedBackViews] = useState<{
    back1: string;
    back2: string;
    back3: string;
  } | null>(null);
  const [selectedFrontIndex, setSelectedFrontIndex] = useState<number | null>(
    null
  );
  const [regeneratingImage, setRegeneratingImage] = useState<string | null>(
    null
  );
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to update generation in database
  const updateGenerationInDB = async (updates: any) => {
    if (!generationId) return;

    try {
      const token = getToken();
      if (!token) return;

      await fetch("/api/generations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: generationId,
          ...updates,
        }),
      });
    } catch (error) {
      console.error("Failed to update generation in DB:", error);
    }
  };

  // Helper function to save new generation to database
  const saveGenerationToDB = async (data: any) => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success && result.generation) {
        setGenerationId(result.generation.id);
        return result.generation.id;
      }
      return null;
    } catch (error) {
      console.error("Failed to save generation to DB:", error);
      return null;
    }
  };

  // Helper function to load generation from database
  const loadGenerationFromDB = async (id: string) => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await fetch(`/api/generations?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success && result.generation) {
        return result.generation;
      }
      return null;
    } catch (error) {
      console.error("Failed to load generation from DB:", error);
      return null;
    }
  };

  // Utility to check if we can store in sessionStorage
  const canStoreInSession = (key: string, value: string): boolean => {
    try {
      const testKey = `__storage_test_${key}`;
      sessionStorage.setItem(testKey, value);
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Load the most recent generation from database when user is loaded
  useEffect(() => {
    if (user) {
      loadLatestGeneration();
    }
  }, [user]);

  // Load the latest generation from database
  const loadLatestGeneration = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/generations?limit=1", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (
        result.success &&
        result.generations &&
        result.generations.length > 0
      ) {
        const latestGen = result.generations[0];

        // Only load if it's recent (created within last hour) and not completed
        const createdAt = new Date(latestGen.created_at);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (createdAt > hourAgo) {
          // Load the full generation data
          const fullGen = await loadGenerationFromDB(latestGen.id);
          if (fullGen) {
            restoreGenerationState(fullGen);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load latest generation:", error);
    }
  };

  // Restore state from a generation object
  const restoreGenerationState = (gen: any) => {
    setGenerationId(gen.id);
    setGarmentType(gen.garment_type || "");
    setFrontPreview(gen.front_view_url || "");
    setBackPreview(gen.back_view_url || "");

    if (gen.generated_front1 || gen.generated_front2 || gen.generated_front3) {
      setGeneratedFrontViews({
        front1: gen.generated_front1 || "",
        front2: gen.generated_front2 || "",
        front3: gen.generated_front3 || "",
      });
    }

    if (gen.generated_side) {
      const sideIndex = gen.selected_front_index || 1;
      const sideViews = { side1: "", side2: "", side3: "" };
      sideViews[`side${sideIndex}` as keyof typeof sideViews] =
        gen.generated_side;
      setGeneratedSideViews(sideViews);
    }

    if (gen.generated_back) {
      const backIndex = gen.selected_front_index || 1;
      const backViews = { back1: "", back2: "", back3: "" };
      backViews[`back${backIndex}` as keyof typeof backViews] =
        gen.generated_back;
      setGeneratedBackViews(backViews);
    }

    if (gen.selected_front_index) {
      setSelectedFrontIndex(gen.selected_front_index);
    }
  };

  const loadUserData = async () => {
    setIsLoading(true);
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCredits(currentUser.credits);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCredits(0);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    router.push("/");
  };

  const ALLOWED_TYPES = ["image/jpeg", "image/png"];
  const MAX_SIZE_MB = 12;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    view: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid image file",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid Format",
        description: "Please upload JPEG or PNG only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: "File Too Large",
        description: `Max allowed size: ${MAX_SIZE_MB} MB`,
        variant: "destructive",
      });
      return;
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast({
        title: "Unsupported Format",
        description: "Only PNG and JPEG formats are supported",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (view === "front") {
        setFrontView(file);
        setFrontPreview(dataUrl);
      } else {
        if (mimeType && file.type !== mimeType) {
          toast({
            title: "Format Mismatch",
            description: "Back view must match front view format",
            variant: "destructive",
          });
          return;
        }
        setBackView(file);
        setBackPreview(dataUrl);
      }
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateFrontView = async () => {
    if (!garmentType || !frontView) {
      toast({
        title: "Missing Information",
        description: "Please select garment type and upload the front image",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to generate views",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (credits <= 0) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase credits to continue",
        variant: "destructive",
      });
      router.push("/pricing");
      return;
    }

    setIsProcessing(true);
    setGeneratedFrontViews(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Create garment record
      const { data: garmentData, error: insertError } = await supabase
        .from("garments")
        .insert({
          garment_type: garmentType,
          front_view_url: frontPreview,
          back_view_url: backPreview || null,
          status: "processing",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(
          `Failed to create garment record: ${insertError.message}`
        );
      }

      if (!garmentData) {
        throw new Error("No data returned from garment creation");
      }

      setGarmentRecordID(garmentData.id);

      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("/api/generate-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frontViewBase64: frontPreview,
          generatedImageType: "front",
          mimeType,
          garmentType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          });
          router.push("/auth");
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Insufficient Credits",
            description: result.error || "Please purchase more credits",
            variant: "destructive",
          });
          router.push("/pricing");
          return;
        }
        throw new Error(result.error || "Failed to generate views");
      }

      if (result.success) {
        setGeneratedFrontViews({
          front1: result.generatedFront1,
          front2: result.generatedFront2,
          front3: result.generatedFront3,
        });
        setCredits(result.remainingCredits);

        // Save to generations table for persistence
        await saveGenerationToDB({
          garment_type: garmentType,
          front_view_url: frontPreview,
          back_view_url: backPreview || null,
          generated_front1: result.generatedFront1,
          generated_front2: result.generatedFront2,
          generated_front3: result.generatedFront3,
          status: "front_generated",
        });

        // Update Supabase garment record
        if (garmentData?.id) {
          try {
            const { data: updatedData, error: updateError } = await supabase
              .from("garments")
              .update({
                generated_front_url: result.generatedFront1,
                status: "completed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", garmentData.id)
              .select()
              .single();

            if (updateError) {
              console.error("Supabase update error:", updateError);
            } else {
              console.log("Successfully updated garment record:", updatedData);
            }
          } catch (updateException: any) {
            console.error("Exception during update:", updateException);
          }
        }

        toast({
          title: "Success!",
          description: `Front Views generated successfully. ${result.remainingCredits} credits remaining.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Generation Failed",
        description:
          error.message || "Failed to generate 3D views. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateImage = async (
    viewType: "front" | "side" | "back",
    index: number
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to regenerate images",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (credits <= 0) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase credits to continue",
        variant: "destructive",
      });
      router.push("/pricing");
      return;
    }

    const imageKey = `${viewType}${index}`;
    setRegeneratingImage(imageKey);

    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      let requestBody: any = {
        mimeType,
        garmentType,
      };

      if (viewType === "front") {
        // Use front-single to generate only ONE image instead of 3
        requestBody.generatedImageType = "front-single";
        requestBody.frontViewBase64 = frontPreview;
      } else {
        requestBody.generatedImageType = viewType;
        // For side and back, use the selected front view
        const frontKey =
          `front${selectedFrontIndex}` as keyof typeof generatedFrontViews;
        if (generatedFrontViews && generatedFrontViews[frontKey]) {
          requestBody.selectedFrontViewBase64 = generatedFrontViews[frontKey];
          if (viewType === "back" && backPreview) {
            requestBody.backViewBase64 = backPreview;
          }
        }
      }

      const response = await fetch("/api/generate-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          });
          router.push("/auth");
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Insufficient Credits",
            description: result.error || "Please purchase more credits",
            variant: "destructive",
          });
          router.push("/pricing");
          return;
        }
        throw new Error(result.error || "Failed to regenerate image");
      }

      if (result.success) {
        // Update the specific image based on type
        if (viewType === "front") {
          const newFrontViews = {
            ...generatedFrontViews!,
            [`front${index}`]: result.generatedFront,
          };
          setGeneratedFrontViews(newFrontViews);

          // Update in database
          if (generationId) {
            await updateGenerationInDB({
              [`generated_front${index}`]: result.generatedFront,
            });
          }
        } else if (viewType === "side") {
          const newSideViews = {
            ...generatedSideViews!,
            [`side${index}`]: result.generatedSide,
          };
          setGeneratedSideViews(newSideViews);

          // Update in database
          if (generationId) {
            await updateGenerationInDB({
              generated_side: result.generatedSide,
            });
          }
        } else if (viewType === "back") {
          const newBackViews = {
            ...generatedBackViews!,
            [`back${index}`]: result.generatedBack,
          };
          setGeneratedBackViews(newBackViews);

          // Update in database
          if (generationId) {
            await updateGenerationInDB({
              generated_back: result.generatedBack,
            });
          }
        }

        setCredits(result.remainingCredits);
        toast({
          title: "Success!",
          description: `Image regenerated successfully. ${result.remainingCredits} credits remaining.`,
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Regeneration Failed",
        description:
          error.message || "Failed to regenerate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingImage(null);
    }
  };

  const handleGenerateSideBackViews = async (
    frontBase64: string,
    index: number
  ) => {
    if (!garmentType || !generatedFrontViews) {
      alert("Please generate front view first");
      return;
    }

    setSelectedFrontIndex(index);

    // Side and back view generation logic here
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to generate views",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (credits <= 0) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase credits to continue",
        variant: "destructive",
      });
      router.push("/pricing");
      return;
    }

    setIsProcessing(true);
    setGeneratedSideViews(null);
    setGeneratedBackViews(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("/api/generate-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedFrontViewBase64: frontBase64,
          backViewBase64: backPreview || null,
          generatedImageType: "side-back",
          mimeType,
          garmentType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          });
          router.push("/auth");
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Insufficient Credits",
            description: result.error || "Please purchase more credits",
            variant: "destructive",
          });
          router.push("/pricing");
          return;
        }
        throw new Error(result.error || "Failed to generate views");
      }

      if (result.success) {
        // Update side views based on index
        const newSideViews = { side1: "", side2: "", side3: "" };
        newSideViews[`side${index}` as keyof typeof newSideViews] =
          result.generatedSide || "";
        setGeneratedSideViews(newSideViews);

        // Update back views if available
        if (result.generatedBack) {
          const newBackViews = { back1: "", back2: "", back3: "" };
          newBackViews[`back${index}` as keyof typeof newBackViews] =
            result.generatedBack || "";
          setGeneratedBackViews(newBackViews);
        }
        setCredits(result.remainingCredits);

        // Update generation in database
        if (generationId) {
          await updateGenerationInDB({
            generated_side: result.generatedSide,
            generated_back: result.generatedBack || null,
            selected_front_index: index,
            status: "completed",
          });
        }

        await supabase
          .from("garments")
          .update({
            generated_side_url: result.generatedSide,
            generated_back_url: result.generatedBack,
            status: "completed",
          })
          .eq("id", garmentRecordID);
        toast({
          title: "Success!",
          description: `Views generated successfully. ${result.remainingCredits} credits remaining.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Generation Failed",
        description:
          error.message || "Failed to generate 3D views. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // const handleGenerateSideView = async (frontBase64: string) => {
  //   if (!garmentType || !generatedFrontViews) {
  //     alert("Please generate front view first");
  //     return;
  //   }

  //   // Side view generation logic here
  //   if (!user) {
  //     toast({
  //       title: "Authentication Required",
  //       description: "Please login to generate views",
  //       variant: "destructive",
  //     });
  //     router.push("/auth");
  //     return;
  //   }

  //   if (credits <= 0) {
  //     toast({
  //       title: "Insufficient Credits",
  //       description: "Please purchase credits to continue",
  //       variant: "destructive",
  //     });
  //     router.push("/pricing");
  //     return;
  //   }

  //   setIsProcessing(true);
  //   setGeneratedSideViews(null);

  //   try {
  //     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  //     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  //     const supabase = createClient(supabaseUrl, supabaseAnonKey);

  //     const token = getToken();
  //     if (!token) throw new Error("No authentication token found");

  //     const response = await fetch("/api/generate-views", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         selectedFrontViewBase64: frontBase64,
  //         generatedImageType: "side",
  //         mimeType,
  //         garmentType,
  //       }),
  //     });

  //     const result = await response.json();

  //     if (!response.ok) {
  //       if (response.status === 401) {
  //         toast({
  //           title: "Session Expired",
  //           description: "Please login again",
  //           variant: "destructive",
  //         });
  //         router.push("/auth");
  //         return;
  //       }
  //       if (response.status === 403) {
  //         toast({
  //           title: "Insufficient Credits",
  //           description: result.error || "Please purchase more credits",
  //           variant: "destructive",
  //         });
  //         router.push("/pricing");
  //         return;
  //       }
  //       throw new Error(result.error || "Failed to generate views");
  //     }

  //     if (result.success) {
  //       setGeneratedSideViews({
  //         side1: result.generatedSide1 || "",
  //         side2: result.generatedSide2 || "",
  //         side3: result.generatedSide3 || "",
  //       });
  //       setCredits(result.remainingCredits);
  //       await supabase
  //         .from("garments")
  //         .update({
  //           generated_side_url:
  //             (result.generatedSide1 || "") +
  //             "," +
  //             (result.generatedSide2 || "") +
  //             "," +
  //             (result.generatedSide3 || ""),
  //           status: !backView ? "completed" : "processing",
  //         })
  //         .eq("id", garmentRecord.id);
  //       toast({
  //         title: "Success!",
  //         description: `Side Views generated successfully. ${result.remainingCredits} credits remaining.`,
  //       });
  //     } else {
  //       throw new Error(result.error);
  //     }
  //   } catch (error: any) {
  //     console.error("Error:", error);
  //     toast({
  //       title: "Generation Failed",
  //       description:
  //         error.message || "Failed to generate 3D views. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // const handleGenerateBackView = async (frontBase64: string) => {
  //   if (!garmentType || !generatedFrontViews) {
  //     alert("Please generate front view first");
  //     return;
  //   }

  //   // back view generation logic here
  //   if (!user) {
  //     toast({
  //       title: "Authentication Required",
  //       description: "Please login to generate views",
  //       variant: "destructive",
  //     });
  //     router.push("/auth");
  //     return;
  //   }

  //   if (credits <= 0) {
  //     toast({
  //       title: "Insufficient Credits",
  //       description: "Please purchase credits to continue",
  //       variant: "destructive",
  //     });
  //     router.push("/pricing");
  //     return;
  //   }

  //   setIsProcessing(true);
  //   setGeneratedBackViews(null);

  //   try {
  //     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  //     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  //     const supabase = createClient(supabaseUrl, supabaseAnonKey);

  //     const token = getToken();
  //     if (!token) throw new Error("No authentication token found");

  //     const response = await fetch("/api/generate-views", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         selectedFrontViewBase64: frontBase64,
  //         generatedImageType: "back",
  //         mimeType,
  //         garmentType,
  //       }),
  //     });

  //     const result = await response.json();

  //     if (!response.ok) {
  //       if (response.status === 401) {
  //         toast({
  //           title: "Session Expired",
  //           description: "Please login again",
  //           variant: "destructive",
  //         });
  //         router.push("/auth");
  //         return;
  //       }
  //       if (response.status === 403) {
  //         toast({
  //           title: "Insufficient Credits",
  //           description: result.error || "Please purchase more credits",
  //           variant: "destructive",
  //         });
  //         router.push("/pricing");
  //         return;
  //       }
  //       throw new Error(result.error || "Failed to generate views");
  //     }

  //     if (result.success) {
  //       setGeneratedBackViews({
  //         back1: result.generatedBack1 || "",
  //         back2: result.generatedBack2 || "",
  //         back3: result.generatedBack3 || "",
  //       });
  //       setCredits(result.remainingCredits);
  //       await supabase
  //         .from("garments")
  //         .update({
  //           generated_back_url:
  //             (result.generatedBack1 || "") +
  //             "," +
  //             (result.generatedBack2 || "") +
  //             "," +
  //             (result.generatedBack3 || ""),
  //           status: "completed",
  //         })
  //         .eq("id", garmentRecord.id);
  //       toast({
  //         title: "Success!",
  //         description: `Back Views generated successfully. ${result.remainingCredits} credits remaining.`,
  //       });
  //     } else {
  //       throw new Error(result.error);
  //     }
  //   } catch (error: any) {
  //     console.error("Error:", error);
  //     toast({
  //       title: "Generation Failed",
  //       description:
  //         error.message || "Failed to generate 3D views. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const handleClearUpload = () => {
    // Clear all upload and generation states
    setFrontView(null);
    setBackView(null);
    setFrontPreview("");
    setBackPreview("");
    setMimeType("");
    setGarmentType("");
    setGarmentRecordID(null);
    setGenerationId(null);
    setGeneratedFrontViews(null);
    setGeneratedSideViews(null);
    setGeneratedBackViews(null);
    setSelectedFrontIndex(null);

    toast({
      title: "Cleared",
      description: "Ready to try with another garment",
    });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center mb-4'>
              <Shirt className='w-12 h-12 text-slate-700 mr-3' />
              <h1 className='text-4xl font-bold text-slate-900'>
                3D Garment Visualizer
              </h1>
            </div>
            <p className='text-lg text-slate-600 mb-4'>
              Upload front and back images to generate 3D views of your garment
            </p>
            <div className='flex items-center justify-center gap-4'>
              <Link href='/how-to-use'>
                <Button variant='outline' size='sm'>
                  How to Use
                </Button>
              </Link>
              <Link href='/examples'>
                <Button variant='outline' size='sm'>
                  View Examples
                </Button>
              </Link>
            </div>
          </div>
          <div className='absolute right-5 top-5 flex items-center gap-4'>
            {isLoading ? (
              <div className='text-slate-600'>Loading...</div>
            ) : user ? (
              <div className='flex items-center gap-4'>
                <Link href='/profile'>
                  <Card className='bg-white shadow-md border-slate-200 px-4 py-2 cursor-pointer hover:shadow-lg transition-shadow'>
                    <div className='flex items-center gap-2'>
                      <User className='w-4 h-4 text-slate-600' />
                      <span className='text-sm font-medium text-slate-700'>
                        {user.email}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <CreditCard className='w-4 h-4 text-blue-600' />
                      <span className='text-sm font-semibold text-blue-600'>
                        {credits} credits
                      </span>
                    </div>
                  </Card>
                </Link>
                <Link href='/pricing'>
                  <Button variant='outline' size='sm'>
                    <CreditCard className='w-4 h-4 mr-2' />
                    Buy Credits
                  </Button>
                </Link>
                <Button variant='outline' size='sm' onClick={handleLogout}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </Button>
              </div>
            ) : (
              <div className='flex gap-3'>
                <Link href='/auth'>
                  <Button variant='outline'>Login</Button>
                </Link>
                <Link href='/pricing'>
                  <Button>View Pricing</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        {!user && !isLoading && (
          <div className='max-w-4xl mx-auto mb-6'>
            <Alert className='bg-blue-50 border-blue-200'>
              <AlertCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-blue-800'>
                <strong>Please login to generate views.</strong> New users get 3
                free credits!
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className='max-w-6xl mx-auto'>
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle>Upload Garment Images</CardTitle>
                  <CardDescription>
                    Select the garment type and upload front and back view
                    images
                  </CardDescription>
                </div>
                {(frontPreview || generatedFrontViews) && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleClearUpload}
                    className='text-red-600 border-red-200 hover:bg-red-50'
                  >
                    <X className='w-4 h-4 mr-2' />
                    Try with Another
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  Garment Type
                </label>
                <Select value={garmentType} onValueChange={setGarmentType}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select garment type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='t-shirt'>T-Shirt</SelectItem>
                    <SelectItem value='shirt'>Shirt</SelectItem>
                    <SelectItem value='jacket'>Jacket</SelectItem>
                    <SelectItem value='hoodie'>Hoodie</SelectItem>
                    <SelectItem value='sweater'>Sweater</SelectItem>
                    <SelectItem value='jeans'>Jeans</SelectItem>
                    <SelectItem value='trousers'>Trousers</SelectItem>
                    <SelectItem value='shorts'>Shorts</SelectItem>
                    <SelectItem value='skirt'>Skirt</SelectItem>
                    <SelectItem value='leggings'>Leggings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className=''>
                <span className='text-cyan-800 text-sm border-cyan-100 border-2 rounded-xl p-2'>
                  "FIRST GENERATION MIGHT NOT GIVE YOU THE DESIRED RESULT, TRY
                  REGENERATING"
                </span>
              </div>
              <div className='text-red-800 text-sm'>
                Image file size must be less than 12 MB. Allowed formats: JPEG,
                PNG.
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Front View
                  </label>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleFileChange(e, "front")}
                      className='hidden'
                      id='front-upload'
                    />
                    <label
                      htmlFor='front-upload'
                      className='flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors bg-white'
                    >
                      {frontPreview ? (
                        <img
                          src={frontPreview}
                          alt='Front view'
                          className='w-full h-full object-contain rounded-lg'
                        />
                      ) : (
                        <div className='text-center'>
                          <Upload className='w-12 h-12 text-slate-400 mx-auto mb-2' />
                          <p className='text-sm text-slate-600'>
                            Upload front view
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Back View (Optional)
                  </label>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleFileChange(e, "back")}
                      className='hidden'
                      id='back-upload'
                    />
                    <label
                      htmlFor='back-upload'
                      className='flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors bg-white'
                    >
                      {backPreview ? (
                        <img
                          src={backPreview}
                          alt='Back view'
                          className='w-full h-full object-contain rounded-lg'
                        />
                      ) : (
                        <div className='text-center'>
                          <Upload className='w-12 h-12 text-slate-400 mx-auto mb-2' />
                          <p className='text-sm text-slate-600'>
                            Upload back view
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGenerateFrontView}
                disabled={!garmentType || !frontView || isProcessing || !user}
                className='w-full h-12 text-lg'
                size='lg'
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Generating 3D Views...
                  </>
                ) : !user ? (
                  "Please Login to Generate"
                ) : credits <= 0 ? (
                  "Purchase Credits to Generate"
                ) : (
                  `Generate 3D Views (1 credit)`
                )}
              </Button>
            </CardContent>
          </Card>
          {generatedFrontViews && (
            <Card className='mt-8 shadow-xl border-slate-200'>
              <CardHeader>
                <CardTitle>Generated 3D Views</CardTitle>
                <CardDescription>
                  Select a front view to generate side and back views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {/* Row 1 - Front View 1 */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {/* Front View 1 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Front View 1
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedFrontViews.front1 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedFrontViews.front1}
                              alt='Front View 1'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() =>
                                  handleRegenerateImage("front", 1)
                                }
                                disabled={regeneratingImage === "front1"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "front1" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <div className='absolute bottom-2 left-2 right-2 flex gap-2'>
                              <Button
                                onClick={() =>
                                  handleGenerateSideBackViews(
                                    generatedFrontViews.front1,
                                    1
                                  )
                                }
                                disabled={
                                  isProcessing || selectedFrontIndex === 1
                                }
                                className='flex-1'
                                size='sm'
                              >
                                {selectedFrontIndex === 1 && isProcessing ? (
                                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                                ) : null}
                                {selectedFrontIndex === 1
                                  ? "Selected"
                                  : "Generate Side & Back"}
                              </Button>
                              <Button
                                onClick={() =>
                                  downloadImage(
                                    generatedFrontViews.front1,
                                    "front1-view.png"
                                  )
                                }
                                variant='outline'
                                size='sm'
                              >
                                <Download className='w-4 h-4' />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className='text-slate-400'>No image</span>
                        )}
                      </div>
                    </div>

                    {/* Side View 1 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Side View 1
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedSideViews?.side1 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedSideViews.side1}
                              alt='Side View 1'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() => handleRegenerateImage("side", 1)}
                                disabled={regeneratingImage === "side1"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "side1" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                downloadImage(
                                  generatedSideViews.side1,
                                  "side1-view.png"
                                )
                              }
                              className='absolute bottom-2 right-2'
                              variant='outline'
                              size='sm'
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'></span>
                        )}
                      </div>
                    </div>

                    {/* Back View 1 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Back View 1
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedBackViews?.back1 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedBackViews.back1}
                              alt='Back View 1'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() => handleRegenerateImage("back", 1)}
                                disabled={regeneratingImage === "back1"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "back1" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                downloadImage(
                                  generatedBackViews.back1,
                                  "back1-view.png"
                                )
                              }
                              className='absolute bottom-2 right-2'
                              variant='outline'
                              size='sm'
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2 - Front View 2 */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {/* Front View 2 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Front View 2
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedFrontViews.front2 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedFrontViews.front2}
                              alt='Front View 2'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() =>
                                  handleRegenerateImage("front", 2)
                                }
                                disabled={regeneratingImage === "front2"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "front2" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <div className='absolute bottom-2 left-2 right-2 flex gap-2'>
                              <Button
                                onClick={() =>
                                  handleGenerateSideBackViews(
                                    generatedFrontViews.front2,
                                    2
                                  )
                                }
                                disabled={
                                  isProcessing || selectedFrontIndex === 2
                                }
                                className='flex-1'
                                size='sm'
                              >
                                {selectedFrontIndex === 2 && isProcessing ? (
                                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                                ) : null}
                                {selectedFrontIndex === 2
                                  ? "Selected"
                                  : "Generate Side & Back"}
                              </Button>
                              <Button
                                onClick={() =>
                                  downloadImage(
                                    generatedFrontViews.front2,
                                    "front2-view.png"
                                  )
                                }
                                variant='outline'
                                size='sm'
                              >
                                <Download className='w-4 h-4' />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className='text-slate-400'>No image</span>
                        )}
                      </div>
                    </div>

                    {/* Side View 2 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Side View 2
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedSideViews?.side2 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedSideViews.side2}
                              alt='Side View 2'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() => handleRegenerateImage("side", 2)}
                                disabled={regeneratingImage === "side2"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "side2" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                downloadImage(
                                  generatedSideViews.side2,
                                  "side2-view.png"
                                )
                              }
                              className='absolute bottom-2 right-2'
                              variant='outline'
                              size='sm'
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'></span>
                        )}
                      </div>
                    </div>

                    {/* Back View 2 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Back View 2
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedBackViews?.back2 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedBackViews.back2}
                              alt='Back View 2'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() => handleRegenerateImage("back", 2)}
                                disabled={regeneratingImage === "back2"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "back2" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                downloadImage(
                                  generatedBackViews.back2,
                                  "back2-view.png"
                                )
                              }
                              className='absolute bottom-2 right-2'
                              variant='outline'
                              size='sm'
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3 - Front View 3 */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {/* Front View 3 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Front View 3
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedFrontViews.front3 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedFrontViews.front3}
                              alt='Front View 3'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() =>
                                  handleRegenerateImage("front", 3)
                                }
                                disabled={regeneratingImage === "front3"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "front3" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <div className='absolute bottom-2 left-2 right-2 flex gap-2'>
                              <Button
                                onClick={() =>
                                  handleGenerateSideBackViews(
                                    generatedFrontViews.front3,
                                    3
                                  )
                                }
                                disabled={
                                  isProcessing || selectedFrontIndex === 3
                                }
                                className='flex-1'
                                size='sm'
                              >
                                {selectedFrontIndex === 3 && isProcessing ? (
                                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                                ) : null}
                                {selectedFrontIndex === 3
                                  ? "Selected"
                                  : "Generate Side & Back"}
                              </Button>
                              <Button
                                onClick={() =>
                                  downloadImage(
                                    generatedFrontViews.front3,
                                    "front3-view.png"
                                  )
                                }
                                variant='outline'
                                size='sm'
                              >
                                <Download className='w-4 h-4' />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <span className='text-slate-400'>No image</span>
                        )}
                      </div>
                    </div>

                    {/* Side View 3 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Side View 3
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedSideViews?.side3 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedSideViews.side3}
                              alt='Side View 3'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() => handleRegenerateImage("side", 3)}
                                disabled={regeneratingImage === "side3"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "side3" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                downloadImage(
                                  generatedSideViews.side3,
                                  "side3-view.png"
                                )
                              }
                              className='absolute bottom-2 right-2'
                              variant='outline'
                              size='sm'
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'></span>
                        )}
                      </div>
                    </div>

                    {/* Back View 3 */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        Back View 3
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {generatedBackViews?.back3 ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={generatedBackViews.back3}
                              alt='Back View 3'
                              className='max-w-full h-auto'
                            />
                            <div className='absolute top-2 right-2'>
                              <Button
                                onClick={() => handleRegenerateImage("back", 3)}
                                disabled={regeneratingImage === "back3"}
                                variant='secondary'
                                size='icon'
                                className='h-8 w-8'
                                title='Regenerate'
                              >
                                {regeneratingImage === "back3" ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <RefreshCw className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                downloadImage(
                                  generatedBackViews.back3,
                                  "back3-view.png"
                                )
                              }
                              className='absolute bottom-2 right-2'
                              variant='outline'
                              size='sm'
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
