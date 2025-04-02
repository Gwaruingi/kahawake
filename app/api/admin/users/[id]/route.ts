import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { User, IUserLean } from "@/models/User";
import { auth } from "@/auth";
import { ensureDbConnected } from "@/lib/mongoose";
import bcrypt from 'bcrypt';

// GET handler to fetch a specific user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Validate ID
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    
    // Fetch user
    const user = await User.findById(id)
      .select('name email role companyName isActive createdAt')
      .lean<IUserLean>();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH handler to update a user
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get user ID
    const { id } = params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Prevent changing role to admin for security reasons
    if (data.role === 'admin') {
      return NextResponse.json(
        { error: "Cannot change user role to admin through this endpoint" },
        { status: 400 }
      );
    }
    
    // Prevent modifying admin users
    const targetUserDoc = await User.findById(id).lean();
    
    if (!targetUserDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use a type assertion with a runtime check to ensure type safety
    const targetUser = targetUserDoc as {
      _id: string;
      role: string;
      [key: string]: any;
    };

    // Verify the role exists before accessing it
    if (targetUser && typeof targetUser.role === 'string' && targetUser.role === 'admin') {
      return NextResponse.json(
        { error: "Cannot modify admin users" },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { name, email, password, role, companyName, isActive } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        password: password ? await bcrypt.hash(password, 10) : undefined,
        role,
        companyName,
        isActive
      },
      { new: true }
    ).lean<IUserLean>();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get user ID
    const { id } = params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    
    // Prevent deleting admin users
    const targetUserDoc = await User.findById(id).lean();

    if (!targetUserDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use a type assertion with a runtime check to ensure type safety
    const targetUser = targetUserDoc as {
      _id: string;
      role: string;
      [key: string]: any;
    };

    // Verify the role exists before accessing it
    if (targetUser && typeof targetUser.role === 'string' && targetUser.role === 'admin') {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
