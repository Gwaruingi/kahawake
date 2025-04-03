import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User, IUserLean } from '@/models/User';
import { auth } from '@/auth';
import bcrypt from 'bcrypt';
import type { NextRequest } from 'next/server';

// Helper function to check authentication and authorization
async function authenticateAdmin(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// Helper function to validate user ID
async function getUserById(id: string) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { error: NextResponse.json({ error: "Invalid user ID" }, { status: 400 }) };
  }
  const user = await User.findById(id).lean<IUserLean>();
  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  return { user };
}

// GET handler to fetch a specific user
export async function GET(request: NextRequest) {
  try {
    const authError = await authenticateAdmin(request);
    if (authError) return authError;

    const id = request.nextUrl.searchParams.get('id');
    const { error, user } = await getUserById(id);
    if (error) return error;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH handler to update a user
export async function PATCH(request: NextRequest) {
  try {
    const authError = await authenticateAdmin(request);
    if (authError) return authError;

    const id = request.nextUrl.searchParams.get('id');
    const { error, user: targetUser } = await getUserById(id);
    if (error) return error;

    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: "Cannot modify admin users" }, { status: 403 });
    }

    const { name, email, password, role, companyName, isActive } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const updateData: Partial<IUserLean> = { name, email, role, companyName, isActive };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, lean: true });
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error in PATCH handler:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE handler to remove a user
export async function DELETE(request: NextRequest) {
  try {
    const authError = await authenticateAdmin(request);
    if (authError) return authError;

    const id = request.nextUrl.searchParams.get('id');
    const { error, user: targetUser } = await getUserById(id);
    if (error) return error;

    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}