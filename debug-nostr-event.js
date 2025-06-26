// Debug Nostr data for specific project
const eventId = '56fce837c628728953138ca57895c7ef9533640a989934c432d1040808781b9f';

async function debugNostrData() {
  console.log(`🔍 Debugging Nostr event: ${eventId}`);
  
  // Test with Nostr relay - simplified version
  console.log('🌐 This project has a Nostr event ID but we need to check if metadata exists');
  console.log('📝 NostrEventId:', eventId);
  console.log('⚠️  The issue might be:');
  console.log('   1. Nostr event might not have metadata');
  console.log('   2. Relay might not have the event');
  console.log('   3. Event format might be different');
  console.log('   4. There might be an error in the Nostr service');
  
  // Check if this is a valid event ID format
  if (eventId && eventId.length === 64) {
    console.log('✅ Event ID format looks valid (64 characters)');
  } else {
    console.log('❌ Event ID format might be invalid');
  }
}

debugNostrData();
