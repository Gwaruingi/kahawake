import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Notification } from "@/models/Notification";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongoose";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to fetch user's notifications
export async function GET(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get query parameters
    const url = new URL(request.url);
    const read = url.searchParams.get('read');
    const limit = url.searchParams.get('limit') || '10';
    
    // Build query
    const query: any = { userId: session.user.id };
    
    if (read === 'true') {
      query.read = true;
    } else if (read === 'false') {
      query.read = false;
    }
    
    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false
    });
    
    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH handler to mark notifications as read
export async function PATCH(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Parse the request body
    const data = await request.json();
    
    // Check if we're marking a single notification or all notifications as read
    if (data.id) {
      // Mark a single notification as read
      await Notification.findOneAndUpdate(
        { _id: data.id, userId: session.user.id },
        { read: true }
      );
    } else if (data.markAllAsRead) {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { read: true }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid request. Specify id or markAllAsRead" },
        { status: 400 }
      );
    }
    
    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false
    });
    
    return NextResponse.json({
      message: "Notifications updated successfully",
      unreadCount
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
