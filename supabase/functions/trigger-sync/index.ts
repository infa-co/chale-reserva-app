import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

async function triggerScheduledSyncs(supabase: any) {
  console.log('Starting scheduled sync trigger');
  
  try {
    // Get all active syncs that need to be synced
    const now = new Date();
    const { data: syncs, error } = await supabase
      .from('ical_syncs')
      .select('id, sync_frequency_hours, last_sync_at')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching syncs:', error);
      throw error;
    }

    console.log(`Found ${syncs?.length || 0} active syncs`);

    const syncsToTrigger = syncs?.filter((sync: any) => {
      if (!sync.last_sync_at) {
        return true; // Never synced before
      }
      
      const lastSync = new Date(sync.last_sync_at);
      const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastSync >= sync.sync_frequency_hours;
    }) || [];

    console.log(`${syncsToTrigger.length} syncs need to be triggered`);

    // Trigger sync for each qualifying sync, a few at a time so one slow calendar
    // cannot make the whole run time out.
    const runSync = async (sync: any) => {
      try {
        console.log(`Triggering sync for sync_id: ${sync.id}`);
        
        const { error: syncError } = await supabase.functions.invoke('sync-ical', {
          body: { sync_id: sync.id }
        });

        if (syncError) {
          console.error(`Error triggering sync for ${sync.id}:`, syncError.message);
          return { sync_id: sync.id, success: false, error: syncError.message };
        }

        return { sync_id: sync.id, success: true };
      } catch (error) {
        console.error(`Exception triggering sync for ${sync.id}`);
        return { sync_id: sync.id, success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    const results: PromiseSettledResult<{ sync_id: string; success: boolean; error?: string }>[] = [];
    for (let i = 0; i < syncsToTrigger.length; i += 5) {
      results.push(...await Promise.allSettled(syncsToTrigger.slice(i, i + 5).map(runSync)));
    }
    
    const successCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;
    
    const failureCount = results.length - successCount;

    console.log(`Sync trigger completed. Success: ${successCount}, Failures: ${failureCount}`);

    return {
      success: true,
      total_syncs: syncsToTrigger.length,
      successful_syncs: successCount,
      failed_syncs: failureCount,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
    };

  } catch (error) {
    console.error('Trigger sync error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey
    );

    // Callers are either internal (service role key) or the database scheduler, which proves
    // itself with a secret that only exists inside the database (see verify_ical_cron_secret).
    let authorized = req.headers.get('Authorization') === `Bearer ${serviceKey}`;
    const cronSecret = req.headers.get('x-cron-secret');
    if (!authorized && cronSecret && /^[a-f0-9]{64}$/.test(cronSecret)) {
      const { data: valid, error: secretError } = await supabase.rpc('verify_ical_cron_secret', { _secret: cronSecret });
      authorized = !secretError && valid === true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await triggerScheduledSyncs(supabase);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});