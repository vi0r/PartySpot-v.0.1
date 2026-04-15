import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { JWT } from "npm:google-auth-library@9.6.3"

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    sender_id: string
    receiver_id: string
    content: string
  }
}

serve(async (req) => {
  try {
    // 1. Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Parse Webhook Payload
    const payload: WebhookPayload = await req.json()
    console.log('Received payload:', JSON.stringify(payload))

    if (payload.type !== 'INSERT' || payload.table !== 'messages') {
      return new Response(JSON.stringify({ message: 'Skipped' }), { status: 200 })
    }

    const { sender_id, receiver_id, content } = payload.record

    // 3. Get Sender Info (username)
    const { data: sender } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', sender_id)
      .single()

    const senderName = sender?.username || 'Somebody'

    // 4. Get Receiver FCM Tokens
    console.log('Fetching tokens for receiver_id:', receiver_id)
    const { data: tokens, error: tokenError } = await supabase
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', receiver_id)

    if (tokenError) {
      console.error('Error fetching tokens:', tokenError)
      return new Response(JSON.stringify({ error: 'DB Error' }), { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      console.log('No tokens found for user:', receiver_id)
      return new Response(JSON.stringify({ message: 'No tokens found in user_fcm_tokens table' }), { status: 200 })
    }

    console.log(`Found ${tokens.length} tokens for user ${receiver_id}`)

    // 5. Get Google OAuth2 Token
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      console.error('FIREBASE_SERVICE_ACCOUNT secret is missing!')
      return new Response(JSON.stringify({ error: 'FCM Secret missing' }), { status: 500 })
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson)
    const jwtClient = new JWT(
      serviceAccount.client_email,
      undefined,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/firebase.messaging']
    )

    const tokenResponse = await jwtClient.authorize()
    const accessToken = tokenResponse.access_token

    // 6. Send Push Notification to each token
    const projectId = serviceAccount.project_id
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

    console.log(`Starting delivery to ${tokens.length} tokens...`)

    const results = await Promise.all(tokens.map(async ({ token }) => {
      try {
        const payload = {
          message: {
            token: token,
            notification: {
              title: `Message from @${senderName}`,
              body: content,
            },
            data: {
              sender_id: sender_id,
              type: 'chat_message',
              // Use absolute path for click_action/url
              url: `/messages/${sender_id}`
            },
            android: {
              priority: 'high',
              notification: {
                channel_id: 'messages',
                click_action: 'TOP_STORY_ACTIVITY',
              },
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  alert: {
                    title: `Message from @${senderName}`,
                    body: content,
                  },
                  sound: 'default',
                  badge: 1,
                  category: 'NEW_MESSAGE_CATEGORY',
                  'mutable-content': 1
                },
              },
            },
          },
        }

        const response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        
        if (!response.ok) {
          console.error(`FCM Error for token ${token.substring(0, 10)}... :`, JSON.stringify(data))
        } else {
          console.log(`FCM Success for token ${token.substring(0, 10)}... :`, data.name)
        }
        
        // Cleanup expired tokens
        if (response.status === 404 || response.status === 410) {
          console.log('Token is no longer valid, deleting from DB:', token.substring(0, 10))
          await supabase.from('user_fcm_tokens').delete().eq('token', token)
        }

        return { token: token.substring(0, 10), status: response.status, data }
      } catch (err) {
        console.error('Fetch error for token:', err)
        return { error: err.message }
      }
    }))

    return new Response(JSON.stringify({ success: true, results }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    })
  }
})
