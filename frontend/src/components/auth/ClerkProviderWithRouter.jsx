import { ClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

import { AUTH_ROUTES, clerkAppearance } from "../../lib/clerkAppearance";

export default function ClerkProviderWithRouter({ children, publishableKey }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
      signInUrl={AUTH_ROUTES.signIn}
      signUpUrl={AUTH_ROUTES.signUp}
      signInFallbackRedirectUrl={AUTH_ROUTES.afterSignIn}
      signUpFallbackRedirectUrl={AUTH_ROUTES.afterSignIn}
      afterSignOutUrl={AUTH_ROUTES.afterSignOut}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}
