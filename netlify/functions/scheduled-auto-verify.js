// netlify/functions/scheduled-auto-verify.js
// Netlify Scheduled Function for Auto-Verification

const { schedule } = require('@netlify/functions');

// This function runs every 15 minutes
const scheduledHandler = async (event, context) => {
  console.log('🔄 Netlify scheduled auto-verification starting...');
    
  try {
    // Get your site URL from environment or construct it
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;
        
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'CRON_SECRET not configured' })
      };
    }
        
    // Call your API route
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
    console.error('❌ Scheduled function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Scheduled function failed',
        details: error.message
      })
    };
  }
};

// Export the scheduled function
const handler = schedule('*/15 * * * *', scheduledHandler);

module.exports = { handler };