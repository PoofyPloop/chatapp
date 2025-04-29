import { supabase } from './supabaseClient.js';

// Get IDs (example: ?myId=1&otherId=2)
const urlParams = new URLSearchParams(window.location.search);
const myUserId = urlParams.get('myId');
const otherUserId = urlParams.get('otherId');

// Update header with other user's name and age
async function updateChatUserInfo() {
  if (!otherUserId) return;

  // Set current open chat user ID in localStorage
  localStorage.setItem('currentOpenChatUserId', otherUserId);

  const { data, error } = await supabase
    .from('users')
    .select('username, age')
    .eq('id', otherUserId)
    .single();

  if (error) {
    console.error('Error fetching chat user info:', error.message);
    return;
  }

  const chatUserInfoDiv = document.getElementById('chat-user-info');
  chatUserInfoDiv.textContent = `${data.username}, ${data.age}`;
}

// Load existing messages between the two users
async function loadMessages() {
  if (!myUserId || !otherUserId) return;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myUserId})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading messages:', error.message);
    return;
  }

  data.forEach(msg => {
    const isMine = msg.sender_id === myUserId;
    displayMessage(msg.message, isMine);
  });
}

// Real-time subscription for new messages
function setupRealtimeMessages() {
  if (!myUserId || !otherUserId) return;

  supabase
  .channel('public:messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      // ❌ no filter here
    },
    (payload) => {
      console.log('Real-time message event received:', payload);
      const msg = payload.new;
      if (
        (msg.sender_id === myUserId && msg.receiver_id === otherUserId) ||
        (msg.sender_id === otherUserId && msg.receiver_id === myUserId)
      ) {
        const isMine = msg.sender_id === myUserId;
        displayMessage(msg.message, isMine);
      }
    }
  )
  .subscribe();

}

updateChatUserInfo();
loadMessages();
setupRealtimeMessages();

// Handle form submit
document.getElementById('chat-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const messageText = document.getElementById('chat-input').value.trim();
  
  if (messageText !== '') {
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: myUserId,
        receiver_id: otherUserId,
        message: messageText
      });

      if (error) {
        console.error('Error sending message:', error.message);
        return;
      }

      displayMessage(messageText, true);
      document.getElementById('chat-input').value = '';
    } catch (err) {
      console.error('Unexpected error sending message:', err);
    }
  }
});

// Display a message
function displayMessage(text, isMine) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isMine ? 'sent-message' : 'received-message';
  messageDiv.textContent = text;
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.appendChild(messageDiv);

  // Auto-scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Modify back button to go to chat.html
document.getElementById('back-button').addEventListener('click', () => {
  window.location.href = 'chat.html';
});
