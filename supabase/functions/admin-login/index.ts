import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "admin@khkt.local";
const ADMIN_PASSWORD = "administrators2026@#";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Thiếu thông tin đăng nhập" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const inputLower = String(username).trim().toLowerCase();
    const isAdminUsername = inputLower === "admin" || inputLower === ADMIN_EMAIL;
    const isAdminPassword = password === ADMIN_PASSWORD;

    if (!isAdminUsername || !isAdminPassword) {
      return new Response(
        JSON.stringify({ error: "Thông tin đăng nhập không đúng" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY")!;

    // Step 1: Try to sign in directly — no user creation needed if the user already exists
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (!signInErr && signInData.session) {
      return new Response(
        JSON.stringify({
          success: true,
          session: signInData.session,
          user: signInData.user,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Sign-in failed — provision the admin user once, then retry sign-in
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up the admin user by email using the admin API (single-user lookup, not listUsers)
    const { data: profileRow } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .maybeSingle();

    let adminUserId = profileRow?.id;

    if (adminUserId) {
      // User exists in profiles but sign-in failed — update password
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(
        adminUserId,
        { password: ADMIN_PASSWORD, email_confirm: true },
      );
      if (updateErr) {
        return new Response(
          JSON.stringify({ error: `Không thể cập nhật admin: ${updateErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      // No profile row — create the auth user from scratch
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Administrator", username: "Admin" },
      });
      if (createErr) {
        return new Response(
          JSON.stringify({ error: `Không thể tạo admin: ${createErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      adminUserId = created.user.id;

      // Insert admin profile
      await adminClient.from("profiles").upsert({
        id: adminUserId,
        full_name: "Administrator",
        username: "Admin",
        email: ADMIN_EMAIL,
        role: "admin",
        province: "System",
        school: "Administration",
        class_name: "Admin",
      }, { onConflict: "id" });
    }

    // Step 3: Retry sign-in after provisioning
    const { data: retryData, error: retryErr } = await userClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (retryErr || !retryData.session) {
      return new Response(
        JSON.stringify({ error: `Đăng nhập admin thất bại: ${retryErr?.message || "no session"}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: retryData.session,
        user: retryData.user,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
