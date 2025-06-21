import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Shield, CheckCircle } from "lucide-react";
import { kycVerificationSchema, type KYCVerificationData } from "@shared/schema";

export default function KYCVerification() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<KYCVerificationData>({
    resolver: zodResolver(kycVerificationSchema),
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
      // For demo, create a mock URL
      const mockUrl = `https://example.com/uploads/${file.name}`;
      setValue("idDocumentUrl", mockUrl);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: KYCVerificationData) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/kyc/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Identity verification completed successfully! You can now fund your account and make withdrawals.");
        setTimeout(() => setLocation("/dashboard"), 2000);
      } else {
        setMessage(result.message || "Verification failed");
      }
    } catch (error) {
      setMessage("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Identity Verification (KYC)</CardTitle>
          <CardDescription>
            Complete your identity verification to access funding and withdrawal features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ssnOrNationalId">SSN or National ID Number</Label>
              <Input
                id="ssnOrNationalId"
                type="text"
                placeholder="Enter your SSN or National ID"
                {...register("ssnOrNationalId")}
              />
              {errors.ssnOrNationalId && (
                <p className="text-sm text-red-600">{errors.ssnOrNationalId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Identity Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload a clear photo of your driver's license, passport, or national ID
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Choose File
                </Label>
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="ID Document Preview"
                    className="max-w-full h-32 object-contain border rounded"
                  />
                </div>
              )}
              {errors.idDocumentUrl && (
                <p className="text-sm text-red-600">{errors.idDocumentUrl.message}</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
              <p className="text-sm text-yellow-700">
                Your personal information is encrypted and stored securely. This verification
                process is required by financial regulations to prevent fraud and ensure account security.
              </p>
            </div>

            {message && (
              <Alert className={message.includes("successfully") ? "border-green-200 bg-green-50" : ""}>
                {message.includes("successfully") && <CheckCircle className="h-4 w-4 text-green-600" />}
                <AlertDescription className={message.includes("successfully") ? "text-green-700" : ""}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Verifying..." : "Complete Verification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}