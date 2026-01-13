import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ad0d9519/health", (c) => {
  return c.json({ status: "ok" });
});

// Save saju record endpoint
app.post("/make-server-ad0d9519/saju_records", async (c) => {
  try {
    const body = await c.req.json();
    const {
      productId,
      name,
      gender,
      birthDate,
      birthTime,
      unknownTime,
    } = body;

    if (!name || !gender || !birthDate) {
      return c.json(
        {
          error:
            "Missing required fields: name, gender, birthDate",
        },
        400,
      );
    }

    // Insert into saju_records table
    const { data, error } = await supabase
      .from("saju_records")
      .insert({
        full_name: name,
        gender: gender,
        birth_date: birthDate,
        birth_time: unknownTime ? "모르겠어요" : birthTime,
        notes: `Product ID: ${productId}`,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Database error saving saju record:",
        error,
      );
      return c.json(
        {
          error: `Failed to save saju record: ${error.message}`,
        },
        500,
      );
    }

    console.log(`Saju record saved successfully: ${data.id}`);
    return c.json({ success: true, recordId: data.id });
  } catch (error) {
    console.error("Error saving saju record:", error);
    return c.json(
      { error: `Failed to save saju record: ${error.message}` },
      500,
    );
  }
});

// Get saju record endpoint
app.get("/make-server-ad0d9519/saju_records/:id", async (c) => {
  try {
    const recordId = c.req.param("id");

    const { data, error } = await supabase
      .from("saju_records")
      .select("*")
      .eq("id", recordId)
      .single();

    if (error || !data) {
      console.error(
        "Database error fetching saju record:",
        error,
      );
      return c.json({ error: "Record not found" }, 404);
    }

    return c.json({ success: true, record: data });
  } catch (error) {
    console.error("Error fetching saju record:", error);
    return c.json(
      {
        error: `Failed to fetch saju record: ${error.message}`,
      },
      500,
    );
  }
});

Deno.serve(app.fetch);