import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_SESSION_KEY = "khkt-admin-session";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const [{ data: profiles }, { data: sessions }, { data: roadmap }] = await Promise.all([
          adminClient.from("profiles").select("*").order("created_at", { ascending: false }),
          adminClient.from("experiment_sessions").select("*").order("created_at", { ascending: false }),
          adminClient.from("roadmap_progress").select("*").order("day", { ascending: true }),
        ]);
        return new Response(
          JSON.stringify({ profiles, sessions, roadmap }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "reset_progress": {
        const { userId } = body;
        const { error: delErr } = await adminClient
          .from("roadmap_progress")
          .delete()
          .eq("user_id", userId);
        if (delErr) throw new Error(delErr.message);
        const { error: updErr } = await adminClient
          .from("profiles")
          .update({ roadmap_day: 1, rank_points: 0, streak_days: 0 })
          .eq("id", userId);
        if (updErr) throw new Error(updErr.message);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "unlock_day": {
        const { userId, day } = body;
        const { error } = await adminClient
          .from("roadmap_progress")
          .upsert({
            user_id: userId,
            day,
            status: "available",
            completed_at: null,
          }, { onConflict: "user_id,day" });
        if (error) throw new Error(error.message);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "delete_session": {
        const { sessionId } = body;
        const { error } = await adminClient
          .from("experiment_sessions")
          .delete()
          .eq("id", sessionId);
        if (error) throw new Error(error.message);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
