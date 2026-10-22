
console.log("Supabase library:", typeof window.supabase);

window.supabaseClient = window.supabase.createClient(
    "https://hkbcrmcwrwusbpwrtqym.supabase.co/rest/v1/",
    "sb_publishable_prYKpzVTuAh_WVNwpVNscw_pIR3NI7Y"
);

console.log("Client created:", typeof window.supabaseClient);