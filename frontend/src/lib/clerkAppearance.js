export const AUTH_ROUTES = {
  signIn: "/login",
  signUp: "/login",
  afterSignOut: "/login",
  afterSignIn: "/",
};

export const clerkAppearance = {
  layout: {
    logoPlacement: "none",
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    borderRadius: "0.5rem",
    colorBackground: "#f7f4ee",
    colorBorder: "#b8b0a5",
    colorDanger: "#b42318",
    colorForeground: "#141414",
    colorInput: "#efefef",
    colorInputForeground: "#141414",
    colorMuted: "#e6e1d8",
    colorMutedForeground: "#5f584d",
    colorPrimary: "#141414",
    colorPrimaryForeground: "#efefef",
    colorRing: "#6f6d6a",
    colorShadow: "rgba(20, 20, 20, 0.16)",
    fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif',
    fontFamilyButtons: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif',
    fontSize: "0.95rem",
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    spacing: "1rem",
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    cardBox: {
      background: "#f7f4ee",
      border: "1px solid #b8b0a5",
      borderRadius: "8px",
      boxShadow: "0 18px 50px rgba(20, 20, 20, 0.11)",
    },
    card: {
      background: "#f7f4ee",
      boxShadow: "none",
    },
    headerTitle: {
      color: "#141414",
      fontSize: "1.9rem",
      fontWeight: 600,
      letterSpacing: "0",
    },
    headerSubtitle: {
      color: "#5f584d",
      fontSize: "0.95rem",
    },
    formFieldLabel: {
      color: "#312d27",
      fontWeight: 500,
    },
    formFieldInput: {
      background: "#efefef",
      border: "1px solid #9f988b",
      color: "#141414",
      borderRadius: "6px",
      boxShadow: "none",
    },
    formFieldInputShowPasswordButton: {
      color: "#141414",
    },
    formButtonPrimary: {
      background: "#141414",
      borderRadius: "6px",
      color: "#efefef",
      fontWeight: 500,
      boxShadow: "none",
    },
    footerActionText: {
      color: "#5f584d",
    },
    footerActionLink: {
      color: "#141414",
      fontWeight: 600,
    },
    dividerLine: {
      background: "#cfc7ba",
    },
    dividerText: {
      color: "#5f584d",
    },
    socialButtonsBlockButton: {
      background: "#efefef",
      border: "1px solid #b8b0a5",
      color: "#141414",
      borderRadius: "6px",
      boxShadow: "none",
      fontWeight: 500,
    },
    identityPreview: {
      background: "#efefef",
      border: "1px solid #cfc7ba",
      borderRadius: "6px",
    },
    userButtonAvatarBox: {
      height: "2rem",
      width: "2rem",
    },
    userButtonPopoverCard: {
      background: "#f7f4ee",
      border: "1px solid #b8b0a5",
      borderRadius: "8px",
      boxShadow: "0 16px 45px rgba(20, 20, 20, 0.14)",
    },
    userButtonPopoverActionButton: {
      color: "#141414",
    },
  },
};

export function getSafeRedirectPath(search) {
  const redirectUrl = new URLSearchParams(search).get("redirect_url");

  if (!redirectUrl || !redirectUrl.startsWith("/") || redirectUrl.startsWith("//")) {
    return AUTH_ROUTES.afterSignIn;
  }

  return redirectUrl;
}
