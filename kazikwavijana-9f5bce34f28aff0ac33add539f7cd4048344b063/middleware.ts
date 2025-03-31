import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  try {
    // Get the token with the secret from environment variables
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    const path = req.nextUrl.pathname;
    
    // Handle protected routes
    if (path.startsWith("/admin") || 
        path.startsWith("/jobs/apply") || 
        path.startsWith("/profile") || 
        path.startsWith("/company")) {
      
      // If no token, redirect to sign in
      if (!token) {
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
        return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url));
      }
      
      // Protect admin routes
      if (path.startsWith("/admin") && token.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
      
      // Protect company routes
      if (path.startsWith("/company") && token.role !== "company") {
        return NextResponse.redirect(new URL("/", req.url));
      }
      
      // Redirect company users to profile creation if accessing candidate profile
      if (path.startsWith("/profile") && token.role === "company") {
        return NextResponse.redirect(new URL("/company/profile", req.url));
      }
      
      // Redirect jobseekers to candidate profile if accessing company routes
      if (path.startsWith("/company") && token.role === "jobseeker") {
        return NextResponse.redirect(new URL("/profile/candidate", req.url));
      }
    }
    
    // Handle home page redirection based on role
    if (path === "/" && token) {
      if (token.role === "company") {
        // Company users should be redirected to company dashboard or profile
        return NextResponse.redirect(new URL("/company/dashboard", req.url));
      } else if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, redirect to home page
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*", 
    "/jobs/apply/:path*", 
    "/profile/:path*",
    "/company/:path*"
  ],
};
