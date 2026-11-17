"use client";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "@/lib/google-client-id";
import { signIn } from "@/server-actions/user";
import { useToast } from "./ui/use-toast";

const SIGN_IN_FAILED = "Sign-in failed. Please try again.";

const GoogleSignIn = ({ userName }: { userName: string | undefined }) => {
  const { toast } = useToast();

  if (userName) {
    return <div>{userName}</div>;
  }

  const showError = (description: string) =>
    toast({ title: "Sign-in failed", description, variant: "destructive" });

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={async ({ credential }) => {
          if (!credential) {
            showError(SIGN_IN_FAILED);
            return;
          }

          try {
            const result = await signIn(credential);

            if (!result.ok) {
              showError(result.error);
              return;
            }
          } catch {
            showError(SIGN_IN_FAILED);
            return;
          }

          // The server set the session cookie; reload so the server renders
          // the signed-in view (the login page then redirects onward).
          window.location.reload();
        }}
        useOneTap
        use_fedcm_for_prompt
        auto_select
        onError={() => showError(SIGN_IN_FAILED)}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleSignIn;
