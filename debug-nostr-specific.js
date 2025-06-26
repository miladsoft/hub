// Debug Nostr event for specific project
const projectId = 'angor1qyuj8z532tnhy7srutwecu3j789z22peu2t8c7v';
const nostrEventId = '56fce837c628728953138ca57895c7ef9533640a989934c432d1040808781b9f';

console.log(`🔍 Debugging Nostr event: ${nostrEventId} for project: ${projectId}`);

// Test if we can find this event in Nostr relays
const relays = [
  'wss://relay.damus.io',
  'wss://relay.primal.net', 
  'wss://nos.lol',
  'wss://relay.angor.io',
  'wss://relay2.angor.io'
];

async function testNostrEvent() {
  console.log('🔍 Testing Nostr relays for event...');
  
  for (const relay of relays) {
    try {
      console.log(`🔄 Testing relay: ${relay}`);
      
      const ws = new WebSocket(relay);
      
      ws.onopen = () => {
        console.log(`✅ Connected to ${relay}`);
        
        // Request the specific event
        const filter = {
          ids: [nostrEventId],
          limit: 1
        };
        
        const subscription = `test-${Date.now()}`;
        const request = ['REQ', subscription, filter];
        
        ws.send(JSON.stringify(request));
        
        // Close after 5 seconds
        setTimeout(() => {
          ws.close();
        }, 5000);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`📨 Message from ${relay}:`, data);
        
        if (data[0] === 'EVENT' && data[2]) {
          console.log(`🎯 Found event in ${relay}:`, data[2]);
        }
      };
      
      ws.onerror = (error) => {
        console.error(`❌ Error with ${relay}:`, error);
      };
      
      ws.onclose = () => {
        console.log(`🔌 Disconnected from ${relay}`);
      };
      
    } catch (error) {
      console.error(`❌ Failed to connect to ${relay}:`, error);
    }
  }
}

testNostrEvent();
