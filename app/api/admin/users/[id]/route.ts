import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User, IUserLean, isUserLean } from '@/models/User';
import { auth } from '@/auth';
import { ensureDbConnected } from '@/lib/mongoose';
import bcrypt from 'bcrypt';
import type { NextRequest } from 'next/server';

// GET handler to fetch a specific user
export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get the user ID from the URL
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate ID
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
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH handler to update a user
export async function PATCH(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get user ID from the URL
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Prevent modifying admin users
    const targetUserDoc = await User.findById(id).lean();
    
    if (!targetUserDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the type guard function to ensure the document is correctly typed
    if (!isUserLean(targetUserDoc)) {
      return NextResponse.json({ error: "Invalid user document" }, { status: 500 });
    }

    // Now TypeScript knows targetUserDoc is definitely IUserLean
    if (targetUserDoc.role === 'admin') {
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
    console.error('Error in PATCH handler:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a user
export async function DELETE(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get user ID from the URL
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Prevent deleting admin users
    const targetUserDoc = await User.findById(id).lean();

    if (!targetUserDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the type guard function to ensure the document is correctly typed
    if (!isUserLean(targetUserDoc)) {
      return NextResponse.json({ error: "Invalid user document" }, { status: 500 });
    }

    // Now TypeScript knows targetUserDoc is definitely IUserLean
    if (targetUserDoc.role === 'admin') {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    // Delete the user document
    const deletedUser = await User.findByIdAndDelete(id).lean();

    if (!deletedUser) {
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
