import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User, IUserLean } from '@/models/User';
import { auth } from '@/auth';
import { ensureDbConnected } from '@/lib/mongoose';
import bcrypt from 'bcrypt';
import type { NextRequest } from 'next/server';

// GET handler to fetch a specific user
export async function GET(request: NextRequest) {
  const { id } = request.nextUrl.pathname.split('/').pop() || {};  // Extract id from URL

  try {
    await ensureDbConnected(); // Ensure DB connection

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findById(id)
      .select('name email role companyName isActive createdAt')
      .lean<IUserLean>();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH handler to update a user
export async function PATCH(request: NextRequest) {
  const { id } = request.nextUrl.pathname.split('/').pop() || {};  // Extract id from URL

  try {
    await ensureDbConnected();

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const targetUserDoc = await User.findById(id).lean() as IUserLean | null;

    if (!targetUserDoc) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (targetUserDoc.role === 'admin') {
      return NextResponse.json({ error: "Cannot modify admin users" }, { status: 403 });
    }

    const { name, email, password, role, companyName, isActive } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const updateData: any = { name, email, isActive };
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

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error in PATCH handler:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE handler to remove a user
export async function DELETE(request: NextRequest) {
  const { id } = request.nextUrl.pathname.split('/').pop() || {};  // Extract id from URL

  try {
    await ensureDbConnected();

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const targetUser = await User.findById(id).lean() as IUserLean | null;

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

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
