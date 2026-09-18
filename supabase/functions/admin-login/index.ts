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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if admin auth user exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const adminUser = (existingUsers?.users || []).find(
      (u) => u.email === ADMIN_EMAIL,
    );

    let adminUserId: string;

    if (adminUser) {
      // Update password and confirm email
      const { data: updated, error: updateErr } = await adminClient.auth.admin.updateUserById(
        adminUser.id,
        {
          password: ADMIN_PASSWORD,
          email_confirm: true,
        },
      );
      if (updateErr) {
        return new Response(
          JSON.stringify({ error: `Không thể cập nhật admin: ${updateErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      adminUserId = updated.user.id;
    } else {
      // Create admin auth user
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: "Administrator",
          username: "Admin",
        },
      });
      if (createErr) {
        return new Response(
          JSON.stringify({ error: `Không thể tạo admin: ${createErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      adminUserId = created.user.id;
    }

    // Ensure profile row exists with admin role
    await adminClient
      .from("profiles")
      .upsert({
        id: adminUserId,
        full_name: "Administrator",
        username: "Admin",
        email: ADMIN_EMAIL,
        role: "admin",
        province: "System",
        school: "Administration",
        class_name: "Admin",
      }, { onConflict: "id" });

    // Now sign in with the anon-key client to get a proper session
    const anonKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (signInErr) {
      return new Response(
        JSON.stringify({ error: `Đăng nhập admin thất bại: ${signInErr.message}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: signInData.session,
        user: signInData.user,
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
