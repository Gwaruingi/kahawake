import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/auth";

// Function to ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Get the current session using the auth() function
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    if (!type || !["profilePicture", "resume", "cv"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }
    
    // Validate file type based on the upload type
    if ((type === "resume" || type === "cv") && 
        !["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Only PDF, DOC, and DOCX files are allowed for resumes and CVs." },
        { status: 400 }
      );
    }
    
    if (type === "profilePicture" && 
        !["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Only JPEG, PNG, and GIF files are allowed for profile pictures." },
        { status: 400 }
      );
    }
    
    // Check file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit." },
        { status: 400 }
      );
    }
    
    // Create a unique filename
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.user.id}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Determine the upload directory based on file type
    let uploadDir: string;
    let fileType: string;
    
    if (type === "profilePicture") {
      uploadDir = join(process.cwd(), "public", "uploads", "profile-pictures");
      fileType = "profile-pictures";
    } else if (type === "resume") {
      uploadDir = join(process.cwd(), "public", "uploads", "resumes");
      fileType = "resumes";
    } else {
      // Default to cv type
      uploadDir = join(process.cwd(), "public", "uploads", "cvs");
      fileType = "cvs";
    }
    
    // Ensure the directory exists
    await ensureDir(uploadDir);
    
    // Write the file to the appropriate directory
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    
    // Return the relative path for storage in the database
    const relativePath = `/uploads/${fileType}/${filename}`;
    
    return NextResponse.json({
      message: "File uploaded successfully",
      filePath: relativePath
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
