import React, { useEffect, useRef, useState } from "react";
import { connectWS } from "./ws";

const App = () => {
  // for store data
  const socket = useRef(null);
  const timer = useRef(null);

  const [userName, setUserName] = useState("");
  const [inputName, setInputName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [typers, setTypers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // this will run after rendering of the chat page
  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("connect", () => {
      socket.current.on("joinNotice", (userName) => {
        console.log(`${userName} joined the group`);
      });

      socket.current.on("chatMessage", (msg) => {
        //push to existing messages list
        setMessages((prev) => [...prev, msg]);
      });

      //for typing to listen
      socket.current.on("typing", (userName) => {
        setTypers((prev) => {
          const isExist = prev.find((typer) => typer === userName);
          if (!isExist) {
            return [...prev, userName];
          }

          return prev;
        });
      });

      //stop typing
      socket.current.on("stopTyping", (userName) => {
        setTypers((prev) => prev.filter((typer) => typer !== userName));
      });
    });

    return () => {
      socket.current.off("roomNotice");
      socket.current.off("chatMessage");
      socket.current.off("typing");
      socket.current.off("stopTyping");
    };
  }, []);

  //for typing name
  useEffect(() => {
    if (text) {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 1000);

    return () => clearTimeout(timer.current);
  }, [text, userName]);

  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    // user meassage
    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };

    setMessages((m) => [...m, msg]);

    //emit the message to server
    socket.current.emit("chatMessage", msg);

    setText("");
  }

  // handle enter key to send message
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }


  const handleNameSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    // join room
    socket.current.emit("joinRoom", trimmed);

    setUserName(trimmed);
    setShowNamePopup(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 ">
      {/*  enter name popup */}

      {showNamePopup && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Enter your name
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your name to start chatting. This will be used to identify
            you.
          </p>

          <form
            onSubmit={handleNameSubmit}
            className="mt-5 flex flex-col sm:flex-row gap-3"
          >
            <input
              autoFocus
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Your name (e.g. John Doe)"
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              type="submit"
              className="rounded-full px-6 py-2 text-sm font-medium text-white
                       bg-green-500 hover:bg-green-600 disabled:opacity-60
                         transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      )}

      {!showNamePopup && (
        <div className="w-full max-w-2xl h-[90vh] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
          {/* chat  header  */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center text-white font-semibold">
              P
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium text-[#303030]">
                Realtime group chat
              </div>
              {typers.length ? (
                <div className="text-xs text-gray-500">
                  {typers.join(", ")} is typing ...
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="text-sm text-gray-500 px-4 py-2">
              Signed in as{" "}
              <span className="font-medium text-[#303030] capitalize">
                {userName}
              </span>
            </div>
          </div>

          {/* chat message list  */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-100 flex flex-col">
            {messages.map((m) => {
              const mine = m.sender === userName;

              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-[18px] text-sm leading-5 shadow-sm ${
                      mine
                        ? "bg-[#DCF8C6] text-[#303030] rounded-br-2xl"
                        : "bg-white text-[#303030] rounded-bl-2xl"
                    }`}
                  >
                    <div className="break-words whitespace-pre-wrap">
                      {m.text}
                    </div>

                    <div className="flex justify-between items-center mt-1 gap-16">
                      <div className="text-[11px] font-bold">{m.sender}</div>
                      <div className="text-[11px] text-gray-500 text-right">
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* chat area  */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 border border-gray-200 rounded-full">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message ..."
                className="w-full resize-none px-4 py-3 text-sm outline-none rounded-full"
              />

              <button
                onClick={sendMessage}
                className="bg-green-500 text-white px-4 py-2 mr-2 rounded-full text-sm font-medium cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
