// import React, { useEffect, useState, useCallback } from 'react';
// import io from 'socket.io-client';
// import { useLocation } from 'react-router-dom';
// import { FaPaperPlane, FaRegSmile, FaTimes, FaEllipsisV } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import '../Chat.css';

// const socket = io('http://localhost:3000');

// const Chat = () => {
//   const { state } = useLocation();
//   const { userId } = state; // Retrieve userId from the state
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [matchedUser, setMatchedUser] = useState(null);
//   const [waiting, setWaiting] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false); // State to toggle dropdown visibility

//   useEffect(() => {
//     // Emit login event for the user
//     console.log(`Logging in user: ${userId}`);
//     socket.emit('login', userId);
  
//     // Fetch messages from the server when the chat starts
//     const fetchMessages = async () => {
//       try {
//         const response = await fetch(`http://localhost:3000/api/messages/${userId}`);
//         if (response.ok) {
//           const data = await response.json();
//           console.log('Fetched messages:', data); // Log fetched messages
//           setMessages(data.map(msg => ({
//             ...msg,
//             isSelf: msg.senderId === userId, // Flag for sent messages
//           })));
//         } else {
//           console.error('Failed to fetch messages');
//         }
//       } catch (error) {
//         console.error('Error fetching messages:', error);
//       }
//     };
  
//     fetchMessages(); // Fetch messages on mount
  
//     // Socket event listeners
//     socket.on('message', (message) => {
//       console.log('Message received:', message); // Log received messages
//       setMessages(prev => [...prev, { ...message, isSelf: message.from === userId }]);
//     });
  
//     socket.on('matchedUser', (user) => {
//       console.log('Matched user:', user); // Log matched user
//       setMatchedUser(user);
//       setWaiting(false);
//     });
  
//     socket.on('waiting', () => {
//       console.log('Waiting for a match...');
//       setWaiting(true);
//     });
  
//     socket.on('chatEnded', () => {
//       console.log('Chat ended');
//       resetChat();
//     });
  
//     socket.on('reconnect', () => {
//       console.log('Reconnected to the server');
//       fetchMessages(); // Fetch messages again on reconnection
//     });
  
//     return () => {
//       socket.off('message');
//       socket.off('matchedUser');
//       socket.off('waiting');
//       socket.off('chatEnded');
//       socket.off('reconnect');
//     };
//   }, [userId]);

//   const startChat = useCallback(() => {
//     resetChat();
//     socket.emit('startChat', userId);
//   }, [userId]);

//   const resetChat = useCallback(() => {
//     setMatchedUser(null);
//     setWaiting(false);
//     setShowDropdown(false); // Close dropdown when resetting
//   }, []);

//   const sendMessage = async (e) => {
//     e.preventDefault();
//     if (input && matchedUser) {
//       const message = { text: input, to: matchedUser.id, from: userId };

//       // Send the message to the server
//       try {
//         const response = await fetch('http://localhost:3000/api/messages', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             senderId: userId,
//             receiverId: matchedUser.id,
//             text: input,
//           }),
//         });
//         if (!response.ok) {
//           throw new Error('Failed to send message');
//         }
//       } catch (error) {
//         console.error('Error sending message to the server:', error);
//       }

//       // Emit message to the socket
//       socket.emit('message', message);
//       setMessages((prev) => [...prev, message]);
//       setInput(''); // Clear the input field
//     }
//   };

//   const onEmojiClick = (emojiData) => {
//     setInput((prev) => prev + emojiData.emoji);
//     setShowEmojiPicker(false);
//   };

//   const breakChat = async () => {
//     // Emit endChat event and handle message deletion in the server
//     socket.emit('endChat');
//     resetChat();
//   };

//   const toggleDropdown = () => {
//     setShowDropdown((prev) => !prev); // Toggle dropdown visibility
//   };

//   return (
//     <div className="chat-container">
//       <div className="header">Chat</div>
//       <div className="messages">
//         {messages.map((msg, index) => (
//           <div key={index} className={`message ${msg.from === userId ? 'self' : 'other'}`}>
//             {msg.text}
//           </div>
//         ))}
//         {waiting && <p>Waiting for a match...</p>}
//       </div>
//       {matchedUser ? (
//         <form className="input-container" onSubmit={sendMessage}>
//           <button
//             type="button"
//             className="emoji-button"
//             onClick={() => setShowEmojiPicker((prev) => !prev)}
//           >
//             <FaRegSmile />
//           </button>
//           {showEmojiPicker && (
//             <div className="emoji-picker">
//               <EmojiPicker onEmojiClick={onEmojiClick} />
//             </div>
//           )}
//           <input
//             className="input-message"
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type a message..."
//             required
//           />
//           <button type="submit">
//             <FaPaperPlane />
//           </button>
//           <button
//             type="button"
//             className="dropdown-toggle"
//             onClick={toggleDropdown}
//           >
//             <FaEllipsisV />
//           </button>
//           {showDropdown && (
//             <ul className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
//               <li>
//                 <button className="break-chat-button text-center" onClick={breakChat}>
//                   <span className='text-danger'>End Chat</span>
//                   <FaTimes className='text-danger' />
//                 </button>
//               </li>
//             </ul>
//           )}
//         </form>
//       ) : (
//         <button onClick={startChat}>Start Chat</button>
//       )}
//     </div>
//   );
// };

// export default Chat;

import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaRegSmile, FaTimes, FaEllipsisV } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios'; // Import Axios
import '../Chat.css';

const socket = io('http://localhost:3000');

const Chat = () => {
  const { state } = useLocation();
  const { userId } = state; // Retrieve userId from the state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [matchedUser, setMatchedUser] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // State to toggle dropdown visibility
  const navigate=useNavigate()
  useEffect(() => {
    // Emit login event for the user
    console.log(`Logging in user: ${userId}`);
    socket.emit('login', userId);

    // Fetch messages from the server when the chat starts
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/messages/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched messages:', data); // Log fetched messages
          setMessages(data.map(msg => ({
            ...msg,
            isSelf: msg.senderId === userId, // Flag for sent messages
          })));
        } else {
          console.error('Failed to fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages(); // Fetch messages on mount

    // Socket event listeners
    socket.on('message', (message) => {
      console.log('Message received:', message); // Log received messages
      setMessages(prev => [...prev, { ...message, isSelf: message.from === userId }]);
    });

    socket.on('matchedUser', (user) => {
      console.log('Matched user:', user); // Log matched user
      setMatchedUser(user);
      setWaiting(false);
    });

    socket.on('waiting', () => {
      console.log('Waiting for a match...');
      setWaiting(true);
    });

    socket.on('chatEnded', () => {
      console.log('Chat ended');
      resetChat();
    });

    socket.on('reconnect', () => {
      console.log('Reconnected to the server');
      fetchMessages(); // Fetch messages again on reconnection
    });

    return () => {
      socket.off('message');
      socket.off('matchedUser');
      socket.off('waiting');
      socket.off('chatEnded');
      socket.off('reconnect');
    };
  }, [userId]);

  const startChat = useCallback(() => {
    resetChat();
    socket.emit('startChat', userId);
  }, [userId]);

  const resetChat = useCallback(() => {
    setMatchedUser(null);
    setWaiting(false);
    setShowDropdown(false); // Close dropdown when resetting
  }, []);

  const [isSending, setIsSending] = useState(false);

const sendMessage = async (e) => {
  e.preventDefault();
  if (input && matchedUser && !isSending) {
    setIsSending(true); // Disable sending

    const message = { text: input, receiverId: matchedUser.id, senderId: userId };
    console.log(message)
    try {
      const response = await axios.post('http://localhost:3000/api/messages', {
        senderId: userId,
        receiverId: matchedUser.id,
        text: input,
      });

      if (response.status === 200 || response.status === 201) {
        console.log('Message sent:', response.data);
        socket.emit('message', message);
        setMessages(prev => [...prev, message]);
        setInput('');
      }
    } catch (error) {
      console.error('Error sending message to the server:', error.response ? error.response.data : error.message);
    } finally {
      setIsSending(false); // Re-enable sending
    }
  }
};



  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const breakChat = async () => {
    // Emit endChat event and handle message deletion in the server
    socket.emit('endChat');
    resetChat();
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev); // Toggle dropdown visibility
  };
  const handleLogout=()=>{
    localStorage.clear("token")
    navigate('/login')
  }
  return (
    <div className="chat-container">                         
      <div className='header px-2 py-1'>
        <div className='row align-items-center g-0'>
          <div className='nameApp col-md-6'>
            <span>Kết đôi - Hẹn Hò</span>
          </div>
          <div className='col-md-6 d-flex justify-content-end'>
              <div>
                  <button type="button" class="btn btn-tranparent text-white" data-bs-toggle="modal" data-bs-target="#exampleModal">
                    <i class="fa fa-sign-out" aria-hidden="true"></i>
                  </button>
                  <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                      <div class="modal-content">
                        <div className="modal-body text-dark text-center">                      
                          Are you sure to log out?
                        </div>
                        <div class="modal-footer">
                            <button type="button" className="btn border-0  text-white bg-black" onClick={handleLogout}>End Chat</button>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.senderId === userId ? 'self' : 'other'}`}>
            {msg.text}
          </div>
        ))}
        {waiting && <p>Waiting for a match...</p>}
      </div>
      {matchedUser ? (
        <form className="input-container" onSubmit={sendMessage}>
          <button
            type="button"
            className="emoji-button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <FaRegSmile />
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
          <input
            className="input-message"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            required
          />
          <button type="submit">
            <FaPaperPlane />
          </button>
          <button
            type="button"
            className="dropdown-toggle"
            onClick={toggleDropdown}
          >
            <FaEllipsisV />
          </button>
          {showDropdown && (
            <ul className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
              <li>
                <button className="break-chat-button text-center btn bg-dark" onClick={breakChat}>
                  <span className='text-danger'>End Chat</span>
                  <FaTimes className='text-danger' />
                </button>
              </li>
              
            </ul>
          )}
        </form>
      ) : (
        <button onClick={startChat} className='w-100 break-chat-button'>Start Chat</button>
      )}
      
    </div>
  );
};

export default Chat;
