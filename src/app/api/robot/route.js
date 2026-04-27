import { NextResponse } from 'next/server';

// This variable sits OUTSIDE the functions so it stays alive 
// while the server is running.
let robotDatabase = {
  github_url: "",
  trigger_update: false,
  status: "idle",
  version: "1.0.0",
  target_version: ""
};

// GET: The Client page calls this to see the current link/status
export async function GET() {
  // Ensure trigger_update is returned as a string "true" or "false"
  const isTriggered = robotDatabase.trigger_update === true || robotDatabase.trigger_update === "true";
  
  return NextResponse.json({
    ...robotDatabase,
    trigger_update: isTriggered ? "true" : "false"
  });
}

// POST: The Admin page calls this to save the new link
export async function POST(request) {
  const body = await request.json();
  
  if (body.github_url !== undefined) {
    robotDatabase.github_url = body.github_url;
    // Reset trigger when admin pushes a new update
    if (body.github_url !== "") {
      robotDatabase.trigger_update = false;
    }
  }
  if (body.target_version !== undefined) robotDatabase.target_version = body.target_version;
  
  if (body.apply_update) {
    robotDatabase.version = robotDatabase.target_version || robotDatabase.version;
    // We NO LONGER clear github_url or target_version so external scripts can always fetch them!
    // Notice we REMOVED `robotDatabase.trigger_update = false;` so it stays true forever
    robotDatabase.status = "success";
    // After a few seconds, go back to idle state
    setTimeout(() => { robotDatabase.status = "idle"; }, 5000);
  } else if (body.trigger_update !== undefined) {
    // Force conversion to pure Boolean just in case incoming requests send a string
    const isTriggered = body.trigger_update === true || body.trigger_update === "true";
    robotDatabase.trigger_update = isTriggered;
    
    if (isTriggered) {
      robotDatabase.status = "updating";
    }
  }
  
  console.log("Database Updated:", robotDatabase); // You will see this in your Laptop terminal
  
  return NextResponse.json({ message: "Success", data: robotDatabase });
}
