import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowDownToLine, Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import { withdrawalSchema, type WithdrawalData } from "@shared/schema";

interface UserProfile {
  currentBalance: string;
  isVerified: boolean;
  verificationStatus: string;
}

interface WithdrawalTransaction {
  id: number;
  cryptocurrency: string;
  amount: string;
  walletAddress: string;
  status: string;
  createdAt: string;
}

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalTransaction[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WithdrawalData>({
    resolver: zodResolver(withdrawalSchema),
  });

  const selectedCrypto = watch("cryptocurrency");

  useEffect(() => {
    fetchUserProfile();
    fetchWithdrawals();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    }
  };

  const onSubmit = async (data: WithdrawalData) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Withdrawal request submitted successfully! Processing will begin within 24 hours.");
        fetchUserProfile();
        fetchWithdrawals();
      } else {
        setMessage(result.message || "Withdrawal failed");
      }
    } catch (error) {
      setMessage("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!userProfile.isVerified) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <CardTitle>Identity Verification Required</CardTitle>
            <CardDescription>
              You must complete identity verification before you can withdraw funds
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/kyc-verification")}>
              Complete Verification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBalance = parseFloat(userProfile.currentBalance);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-6 w-6 text-blue-600" />
              <CardTitle>Withdraw Funds</CardTitle>
            </div>
            <CardDescription>
              Withdraw your earnings to your crypto wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Available Balance</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                ${currentBalance.toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cryptocurrency">Cryptocurrency</Label>
                <Select onValueChange={(value) => setValue("cryptocurrency", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.cryptocurrency && (
                  <p className="text-sm text-red-600">{errors.cryptocurrency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="50"
                  max={currentBalance.toString()}
                  placeholder="Enter amount"
                  {...register("amount")}
                />
                <p className="text-sm text-gray-600">
                  Minimum withdrawal: $50.00
                </p>
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletAddress">
                  {selectedCrypto ? `${selectedCrypto} Wallet Address` : "Wallet Address"}
                </Label>
                <Input
                  id="walletAddress"
                  type="text"
                  placeholder="Enter your wallet address"
                  {...register("walletAddress")}
                />
                {errors.walletAddress && (
                  <p className="text-sm text-red-600">{errors.walletAddress.message}</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Withdrawals are processed within 24 hours</li>
                  <li>• Double-check your wallet address - transactions cannot be reversed</li>
                  <li>• Network fees may apply depending on blockchain congestion</li>
                </ul>
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
                {isSubmitting ? "Processing..." : "Submit Withdrawal"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
            <CardDescription>Your recent withdrawal transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No withdrawals yet</p>
              ) : (
                withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{withdrawal.cryptocurrency}</p>
                        <p className="text-sm text-gray-600">
                          ${parseFloat(withdrawal.amount).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            withdrawal.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : withdrawal.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : withdrawal.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      To: {withdrawal.walletAddress}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}