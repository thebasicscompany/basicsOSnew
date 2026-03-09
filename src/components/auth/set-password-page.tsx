import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@basics-os/hub";
import basicsIcon from "@/assets/basicos-icon.png";

interface SetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<SetPasswordForm>();

  const newPassword = watch("newPassword");

  if (!token && !errorParam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <div className="flex flex-col items-center gap-6">
            <img
              src={basicsIcon}
              alt="BasicsOS"
              className="h-12 w-12 object-contain"
            />
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Reset your password
              </h1>
              <p className="text-sm text-muted-foreground">
                This link is invalid or has expired. Request a new reset link.
              </p>
            </div>
          </div>
          <Link to="/forgot-password">
            <Button className="w-full">Request new link</Button>
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            <Link className="underline" to="/">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (errorParam === "INVALID_TOKEN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <div className="flex flex-col items-center gap-6">
            <img
              src={basicsIcon}
              alt="BasicsOS"
              className="h-12 w-12 object-contain"
            />
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Link expired
              </h1>
              <p className="text-sm text-muted-foreground">
                This reset link has expired. Request a new one below.
              </p>
            </div>
          </div>
          <Link to="/forgot-password">
            <Button className="w-full">Request new link</Button>
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            <Link className="underline" to="/">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async ({
    newPassword: password,
  }: SetPasswordForm) => {
    if (!token) return;
    setError(null);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (resetError) {
      setError(resetError.message ?? "Failed to reset password");
    } else {
      navigate(ROUTES.CRM);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="flex flex-col items-center gap-6">
          <img
            src={basicsIcon}
            alt="BasicsOS"
            className="h-12 w-12 object-contain"
          />
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Set new password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>
        </div>
        {error && (
          <p className="text-destructive text-sm text-center rounded-md bg-destructive/10 p-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword", {
                required: true,
                minLength: { value: 8, message: "At least 8 characters" },
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: true,
                validate: (v) =>
                  v === newPassword || "Passwords do not match",
              })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          <Link className="underline" to="/">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
