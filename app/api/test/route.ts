import supabase from "@/backend/supabaseClient";

export async function GET() {
  console.log("SUPABASE URL: ", process.env.SUPABASE_URL);
  console.log("SUPABASE URL: ", process.env.SUPABASE_ANON_KEY?.slice(0,8));

  // Example: fetch from a "test" table
  const { data, error } = await supabase.from("testTable").select("*");

  console.log("test GET sent");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}