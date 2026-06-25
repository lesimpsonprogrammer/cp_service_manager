(function initializeCpsmSupabaseClient() {
  const config = {
    url: 'https://zkydfxtmzomypkaykhod.supabase.co',
    publishableKey: 'sb_publishable_rxpLTspJiIIYFhkK0uET_A_fP0IAFYn',
  };

  window.CPSM_SUPABASE_CONFIG = config;

  window.getCpsmSupabaseClient = function getCpsmSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return null;
    }

    if (!window.CPSM_SUPABASE_CLIENT) {
      window.CPSM_SUPABASE_CLIENT = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }

    return window.CPSM_SUPABASE_CLIENT;
  };
})();
