import { useNavigate } from "react-router";
import { useMe } from "@/hooks/use-me";
import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: me, isPending } = useMe();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/");
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details</p>
      </div>
      <Separator />
      {isPending ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : me ? (
        <div className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Name</span>
            <span>{me.fullName}</span>
            {me.administrator && (
              <>
                <span className="text-muted-foreground font-medium">Role</span>
                <span>Administrator</span>
              </>
            )}
          </div>
        </div>
      ) : null}
      <Separator />
      <div>
        <Button variant="destructive" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

ProfilePage.path = "/profile";
