exports.handler = async (event, context) => {
  console.log('🔄 Auto-verification starting...');
    
  try {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;
        
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'CRON_SECRET not configured' })
      };
    }
        
    const response = await fetch(`${siteUrl}/api/cron/auto-verify-payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
        
    const result = await response.json();
        
    if (response.ok) {
      console.log('✅ Auto-verification completed:', result);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Auto-verification completed successfully',
          ...result
        })
      };
    } else {
      console.error('❌ Auto-verification failed:', result);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Auto-verification failed',
          details: result
        })
      };
    }
      
  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Function failed',
        details: error.message
      })
    };
  }
};