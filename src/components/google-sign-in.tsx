"use client";
import { upsertUser } from "@/server-actions/user";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useCookies } from "react-cookie";

const GoogleSignIn = ({ userName }: { userName: string | undefined }) => {
  const [, setCookie] = useCookies(["recipe-token"]);

  if (userName) {
    return <div>{userName}</div>;
  }

  return (
    <GoogleOAuthProvider clientId="283295300739-5stqmhh5f1b3k50scpqe747cfb2lo85r.apps.googleusercontent.com">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          setCookie("recipe-token", credentialResponse.credential, {
            maxAge: 900000,
            sameSite: "strict",
            secure: true,
          });

          await upsertUser();

          window.location.reload();
        }}
        useOneTap
        use_fedcm_for_prompt
        auto_select
        onError={() => {
          console.log("Login Failed");
        }}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleSignIn;
