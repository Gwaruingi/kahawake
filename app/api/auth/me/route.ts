import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { User } from "@/models/User";
import { connectToDB } from "@/lib/mongoose";

export async function GET() {
  try {
    // Get the session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDB();
    
    // Get the user from the database to ensure we have the most up-to-date information
    const userDoc = await User.findOne({ email: session.user.email }).select("-password").lean();
    
    if (!userDoc) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Type assertion after null check
    const user = userDoc as unknown as {
      _id: { toString(): string };
      name: string;
      email: string;
      role: 'admin' | 'company' | 'jobseeker';
      companyName?: string;
      [key: string]: any;
    };
    
    // Return the user data
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName || null,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
