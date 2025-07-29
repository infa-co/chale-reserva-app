import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const syncsToTrigger = syncs?.filter(sync => {
      if (!sync.last_sync_at) {
        return true; // Never synced before
      }
      
      const lastSync = new Date(sync.last_sync_at);
      const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastSync >= sync.sync_frequency_hours;
    }) || [];

    console.log(`${syncsToTrigger.length} syncs need to be triggered`);

    // Trigger sync for each qualifying sync
    const syncPromises = syncsToTrigger.map(async (sync) => {
      try {
        console.log(`Triggering sync for sync_id: ${sync.id}`);
        
        const { error: syncError } = await supabase.functions.invoke('sync-ical', {
          body: { sync_id: sync.id }
        });

        if (syncError) {
          console.error(`Error triggering sync for ${sync.id}:`, syncError);
          return { sync_id: sync.id, success: false, error: syncError.message };
        }

        return { sync_id: sync.id, success: true };
      } catch (error) {
        console.error(`Exception triggering sync for ${sync.id}:`, error);
        return { sync_id: sync.id, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(syncPromises);
    
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});