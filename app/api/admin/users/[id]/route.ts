import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User, IUserLean } from '@/models/User';
import { auth } from '@/auth';
import { ensureDbConnected } from '@/lib/mongoose';
import bcrypt from 'bcrypt';
import type { NextRequest } from 'next/server';

// GET handler to fetch a specific user (Admins only can fetch their own data)
export async function GET(request: NextRequest) {
  try {
    await ensureDbConnected(); // Ensure DB connection

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if admin is trying to access their own data
    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();  // Extract id from URL

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // If the logged-in admin is trying to fetch their own data
    if (session.user.role === 'admin' && session.user.id === id) {  // Use session.user.id instead of _id
      const user = await User.findById(id)
        .select('name email role companyName isActive createdAt')
        .lean<IUserLean>();

      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      return NextResponse.json(user);
    }

    // If it's not their own data, deny access
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH handler to update a user (Admins can only update their own data)
export async function PATCH(request: NextRequest) {
  try {
    await ensureDbConnected();

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();  // Extract id from URL

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Ensure admin can only edit their own data
    if (session.user.role === 'admin' && session.user.id !== id) {  // Use session.user.id instead of _id
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await User.findById(id).lean<IUserLean>();

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { name, email, password, role, companyName, isActive } = await request.json();

    if (Object.keys({ name, email, password, role, companyName, isActive }).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (password) {
      if (typeof password === 'string' && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      } else {
        return NextResponse.json({ error: 'Password must be a string of at least 6 characters' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean<IUserLean>();

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user or user not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error in PATCH handler:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE handler to remove a user (Admins can only delete their own data)
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbConnected();

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();  // Extract id from URL

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Ensure admin can only delete their own data
    if (session.user.role === 'admin' && session.user.id !== id) {  // Use session.user.id instead of _id
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await User.findById(id).lean<IUserLean>();

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const deletedUser = await User.findByIdAndDelete(id).lean<IUserLean>();

    if (!deletedUser) {
      return NextResponse.json({ error: "Failed to delete user or user not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
