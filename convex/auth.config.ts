// convex/auth.config.ts
// Clerk <-> Convex JWT integration
// Replace domain with your actual Clerk instance domain

export default {
  providers: [
    {
      // Update this domain after creating your Clerk application
      // Found at: Clerk Dashboard → JWT Templates → "convex" template → Issuer
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
