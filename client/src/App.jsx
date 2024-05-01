import { useEffect, useState, useRef } from "react";
import { joinRoom, sendSocketMessage, fetchREST } from "./network/chat.api.js";
import { socket } from "./network/chat.api.js";

import.meta.env;

function App() {
  const [messages, setMessages] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);
  const [ClearTypingTimeout, setClearTypingTimeout] = useState(null);
  const input = useRef();
  const currentRoom = useRef("general");

  useEffect(() => {
    // Listen for incoming data and log it in our textarea.
    socket.on("server-msg", (data) =>
      setMessages(
        (existingMessages) => existingMessages + `> ${data.message}\n`
      )
    );
  }, []);

  useEffect(() => {
    socket.on("typing", ({ id }) => {
      setTyping(true);
      setTypingUserId(id);
    });

    socket.on("stopped-typing", ({ id }) => {
      if (id === typingUserId) {
        setTyping(false);
        setTypingUserId(null);
      }
    });
  }, [typing]);

  // test

  // Function for typing user
  const showWhosTyping = () => {
    if (!typing) {
      setTyping(true);
      setTypingUserId(socket.id);
      socket.emit("typing", {
        id: socket.id,
        room: currentRoom.current,
      });
    }
    clearTimeout(ClearTypingTimeout);
    const timeout = setTimeout(() => {
      setTyping(false);
      setTypingUserId(null);
      socket.emit("stopped-typing", {
        id: socket.id,
        room: currentRoom.current,
      });
    }, 2000);

    setClearTypingTimeout(timeout);
  };

  // Listens for form submits
  const onsubmit = async (event) => {
    event.preventDefault();
    console.log("onsubmit");
    // console.log('onsubmit',socket);

    // await fetchREST();

    // sends the message to the server.
    sendSocketMessage(input.current.value, currentRoom.current);
    input.current.value = "";
  };

  const onChannelsClick = (event) => {
    console.log(event.target.textContent, "clicked");
    console.log("dataset.room: ", event.target.dataset.room);

    //set the client room...
    currentRoom.current = event.target.dataset.room;
    // Send request to join the news room
    joinRoom(event.target.dataset.room);
  };

  return (
    <>
      {typing && (
        <div className="show-typing">{`User ${typingUserId.slice(
          0,
          5
        )} is typing...`}</div>
      )}
      <div className="main">
        <form className="write-form" onSubmit={onsubmit}>
          <textarea className="output" readOnly value={messages}></textarea>
          <div className="bottom-box">
            <input
              ref={input}
              placeholder="write a message..."
              className="input"
              onKeyUp={showWhosTyping}
            />
            <button type="submit">Send</button>
          </div>
        </form>
        <div className="channels" onClick={onChannelsClick}>
          <button className="channel" data-room="news">
            News
          </button>
          <button className="channel" data-room="random">
            Random
          </button>
          <button className="channel" data-room="tech">
            Tech
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
