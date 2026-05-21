"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flag, Send } from "lucide-react";

const rules = [
  "No nudity, hate speech, or harassment",
  "Your webcam must show you, live",
  "Do not ask for gender. This is not a dating site",
  "Violators will be banned",
];

function readSavedDarkMode() {
  try {
    return window.localStorage?.getItem("darkMode") === "true";
  } catch {
    return false;
  }
}

function saveDarkModePreference(enabled) {
  try {
    window.localStorage?.setItem("darkMode", String(enabled));
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function setDocumentDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);
}

export default function VideoPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [chatState, setChatState] = useState("start");
  const [searchPhase, setSearchPhase] = useState("idle");
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [dots, setDots] = useState("");
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [isLocalVideoMirrored, setIsLocalVideoMirrored] = useState(false);

  const selfVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);
  const connectingTimerRef = useRef(null);
  const connectedTimerRef = useRef(null);
  const confirmTimerRef = useRef(null);

  useEffect(() => {
    const themeStartupTimer = window.setTimeout(() => {
      const savedDarkMode = readSavedDarkMode();
      setDarkMode(savedDarkMode);
      setThemeReady(true);
      setDocumentDarkMode(savedDarkMode);
    }, 0);

    return () => window.clearTimeout(themeStartupTimer);
  }, []);

  useEffect(() => {
    if (!themeReady) return;

    saveDarkModePreference(darkMode);
    setDocumentDarkMode(darkMode);
  }, [darkMode, themeReady]);

  const refreshMediaDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((device) => device.kind === "videoinput"));
      setAudioDevices(devices.filter((device) => device.kind === "audioinput"));
    } catch (error) {
      console.log("Device list error:", error);
    }
  }, []);

  const applyMediaStream = useCallback(
    async (videoDeviceId = "", audioDeviceId = "") => {
      if (!navigator.mediaDevices?.getUserMedia) return;

      const constraintsFor = (videoId, audioId) => ({
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      });

      try {
        let stream;

        try {
          stream = await navigator.mediaDevices.getUserMedia(
            constraintsFor(videoDeviceId, audioDeviceId)
          );
        } catch (error) {
          if (!videoDeviceId && !audioDeviceId) throw error;
          localStorage.removeItem("omingloVideoDeviceId");
          localStorage.removeItem("omingloAudioDeviceId");
          stream = await navigator.mediaDevices.getUserMedia(constraintsFor("", ""));
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;

        if (selfVideoRef.current) selfVideoRef.current.srcObject = stream;

        const actualVideoDeviceId =
          stream.getVideoTracks()[0]?.getSettings().deviceId || videoDeviceId || "";
        const actualAudioDeviceId =
          stream.getAudioTracks()[0]?.getSettings().deviceId || audioDeviceId || "";

        setSelectedVideoDeviceId(actualVideoDeviceId);
        setSelectedAudioDeviceId(actualAudioDeviceId);

        if (actualVideoDeviceId) {
          localStorage.setItem("omingloVideoDeviceId", actualVideoDeviceId);
        }

        if (actualAudioDeviceId) {
          localStorage.setItem("omingloAudioDeviceId", actualAudioDeviceId);
        }

        await refreshMediaDevices();
      } catch (error) {
        console.log("Camera error:", error);
        await refreshMediaDevices();
      }
    },
    [refreshMediaDevices]
  );

  useEffect(() => {
    const savedVideoDeviceId = localStorage.getItem("omingloVideoDeviceId") || "";
    const savedAudioDeviceId = localStorage.getItem("omingloAudioDeviceId") || "";
    const mediaStartupTimer = window.setTimeout(() => {
      applyMediaStream(savedVideoDeviceId, savedAudioDeviceId);
    }, 0);


    navigator.mediaDevices?.addEventListener?.("devicechange", refreshMediaDevices);

    return () => {
      window.clearTimeout(mediaStartupTimer);
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshMediaDevices);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [applyMediaStream, refreshMediaDevices]);

  useEffect(() => {
    if (!isSearching || isConnected) return;

    const id = setInterval(() => {
      setDots((current) =>
        current === "" ? "." : current === "." ? ".." : current === ".." ? "..." : ""
      );
    }, 450);

    return () => clearInterval(id);
  }, [isSearching, isConnected]);

  useEffect(() => {
    return () => clearChatTimers();
  }, []);

  const buttonText =
    chatState === "start" ? "Start" : chatState === "skip" ? "Skip" : "Really?";
  const renderedDarkMode = themeReady && darkMode;

  function clearChatTimers() {
    window.clearTimeout(connectingTimerRef.current);
    window.clearTimeout(connectedTimerRef.current);
    window.clearTimeout(confirmTimerRef.current);
  }

  function beginSearch() {
    clearChatTimers();
    setShowWelcome(false);
    setMessages([]);
    setInputValue("");
    setDots("");
    setSearchPhase("searching");
    setIsSearching(true);
    setIsConnected(false);
    setChatState("skip");

    connectingTimerRef.current = window.setTimeout(() => {
      setSearchPhase("connecting");
    }, 850);

    connectedTimerRef.current = window.setTimeout(() => {
      setSearchPhase("connected");
      setIsSearching(false);
      setIsConnected(true);
      setDots("");
    }, 3100);
  }

  function handleMainButton() {
    if (chatState === "start") {
      beginSearch();
      return;
    }

    if (chatState === "skip") {
      window.clearTimeout(confirmTimerRef.current);
      setChatState("confirm");
      confirmTimerRef.current = window.setTimeout(() => {
        setChatState((current) => (current === "confirm" ? "skip" : current));
      }, 1600);
      return;
    }

    beginSearch();
  }

  function handleStop() {
    clearChatTimers();
    setChatState("start");
    setSearchPhase("idle");
    setIsSearching(false);
    setIsConnected(false);
    setShowWelcome(true);
    setDots("");
    setMessages([]);
  }

  function handleVideoDeviceChange(deviceId) {
    setSelectedVideoDeviceId(deviceId);
    applyMediaStream(deviceId, selectedAudioDeviceId);
  }

  function handleAudioDeviceChange(deviceId) {
    setSelectedAudioDeviceId(deviceId);
    applyMediaStream(selectedVideoDeviceId, deviceId);
  }

  function handleFlipCamera() {
    setIsLocalVideoMirrored((value) => !value);
  }

  function sendMessage() {
    const text = inputValue.trim();
    if (!text || !isConnected) return;

    setMessages((current) => [...current, { sender: "You", text }]);
    setInputValue("");
  }

  return (
    <main
      className={`um-video-page ${
        renderedDarkMode ? "bg-black text-white" : "bg-[#f8f8f8] text-black"
      }`}
    >
      <UmingleZoomStyles />

      <div className="um-shell">
        <Header
          darkMode={renderedDarkMode}
          onToggleDark={() => {
            setThemeReady(true);
            setDarkMode((value) => !value);
          }}
        />

        <section className="um-main">
          <div className="um-video-grid">
            <VideoPane kind="remote" isLoading={isSearching && !isConnected} videoRef={remoteVideoRef} />
            <VideoPane
              audioDevices={audioDevices}
              isMirrored={isLocalVideoMirrored}
              kind="local"
              onAudioDeviceChange={handleAudioDeviceChange}
              onFlipCamera={handleFlipCamera}
              onVideoDeviceChange={handleVideoDeviceChange}
              selectedAudioDeviceId={selectedAudioDeviceId}
              selectedVideoDeviceId={selectedVideoDeviceId}
              videoDevices={videoDevices}
              videoRef={selfVideoRef}
            />
          </div>

          <div className="um-right-box">
            <ChatPanel
              darkMode={renderedDarkMode}
              dots={dots}
              isConnected={isConnected}
              isSearching={isSearching}
              messages={messages}
              searchPhase={searchPhase}
              showWelcome={showWelcome}
            />

            <BottomBar
              buttonText={buttonText}
              chatState={chatState}
              darkMode={renderedDarkMode}
              inputValue={inputValue}
              isConnected={isConnected}
              isSearching={isSearching}
              onInputChange={setInputValue}
              onMainButton={handleMainButton}
              onSend={sendMessage}
              onStop={handleStop}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Header({ darkMode, onToggleDark }) {
  return (
    <header className="um-header">
      <Link href="/" className="um-logo-link" aria-label="Ominglo home">
        <Image
          src="/ominglo.png"
          alt="Ominglo"
          width={280}
          height={86}
          priority
          className="um-logo"
        />
      </Link>

      <div className="um-header-right">
        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={onToggleDark}
          className={`um-toggle ${
            darkMode ? "bg-[#6d4cff]" : "bg-[#a8a8a8]"
          }`}
        >
          <span
            className={`um-toggle-dot ${
              darkMode ? "um-toggle-dot-on" : ""
            }`}
          />
        </button>

        <div className="um-user-count">
          <strong>13859+</strong>
          <span>online</span>
        </div>
      </div>
    </header>
  );
}

function VideoPane({
  audioDevices = [],
  isLoading = false,
  isMirrored = false,
  kind,
  onAudioDeviceChange,
  onFlipCamera,
  onVideoDeviceChange,
  selectedAudioDeviceId = "",
  selectedVideoDeviceId = "",
  videoDevices = [],
  videoRef,
}) {
  const isRemote = kind === "remote";

  return (
    <div
      className={`um-video-pane ${kind} ${
        isRemote ? "bg-[#4b4b4b]" : "bg-black"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={!isRemote}
        className={`um-video ${!isRemote && isMirrored ? "um-video-mirrored" : ""}`}
      />

      {isRemote ? (
        <>
          <div className={`um-loading ${isLoading ? "active" : ""}`} />
          <div className="um-watermark">
            <span>ominglo</span>
            <small>.com</small>
          </div>
          <button
            type="button"
            aria-label="Report"
            className="um-report-button"
          >
            <Flag size={34} strokeWidth={2.4} />
          </button>
        </>
      ) : (
        <>
          <div className="um-local-video-settings">
            <div className="um-inner-video-settings">
              <button
                type="button"
                className="um-flip-button"
                onClick={onFlipCamera}
              >
                Flip Camera
              </button>

              <div>
                <label htmlFor="webcamList" className="um-visually-hidden">
                  Select Webcam
                </label>
                <select
                  id="webcamList"
                  name="webcamList"
                  value={selectedVideoDeviceId}
                  onChange={(event) => onVideoDeviceChange(event.target.value)}
                >
                  <option value="">Default camera</option>
                  {videoDevices.map((device, index) => (
                    <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="micList" className="um-visually-hidden">
                  Select Microphone
                </label>
                <select
                  id="micList"
                  name="micList"
                  value={selectedAudioDeviceId}
                  onChange={(event) => onAudioDeviceChange(event.target.value)}
                >
                  <option value="">Default microphone</option>
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId || `microphone-${index}`} value={device.deviceId}>
                      {device.label || `Microphone ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}

function ChatPanel({ darkMode, dots, isConnected, isSearching, messages, searchPhase, showWelcome }) {
  const messagesEndRef = useRef(null);
  const isWaiting = isSearching && !isConnected;
  const statusText =
    searchPhase === "connecting"
      ? "Connecting to stranger"
      : "Looking for someone to chat with";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isConnected, isWaiting, messages, searchPhase]);

  return (
    <div
      className={`um-chat-panel ${
        darkMode ? "border-[#222] bg-[#050505]" : "border-[#d8d8d8] bg-white"
      }`}
    >
      {showWelcome && messages.length === 0 ? (
        <div className="um-welcome">
          <h1>
            Welcome to Ominglo.
          </h1>

          <div className="um-age-warning">
            <span>
              18
            </span>
            You must be 18+
          </div>

          {rules.map((rule) => (
            <p key={rule}>{rule}</p>
          ))}
        </div>
      ) : (
        <div className="um-messages">
          {isWaiting && (
            <p className="um-searching">
              {statusText}
              <span className="um-dots">{dots}</span>
            </p>
          )}

          {isConnected && messages.length === 0 && (
            <p className="um-connected-message">
              You are now chatting with a random stranger. Say hi!
            </p>
          )}

          {messages.map((message, index) => (
            <p key={`${message.sender}-${index}`}>
              <span className="font-bold text-[#704cff]">{message.sender}: </span>
              {message.text}
            </p>
          ))}

          <span ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

function BottomBar({
  buttonText,
  chatState,
  darkMode,
  inputValue,
  isConnected,
  isSearching,
  onInputChange,
  onMainButton,
  onSend,
  onStop,
}) {
  return (
    <div className="um-bottom-bar">
      <button
        type="button"
        onClick={onMainButton}
        className={`um-start-button ${
          chatState === "skip" ? "um-start-button-skip" : ""
        } ${chatState === "confirm" ? "um-start-button-confirm" : ""}`}
      >
        <div className="um-start-main">{buttonText}</div>
        <div className="um-start-sub">
          Esc
        </div>
      </button>

      {chatState !== "start" && (
        <button
          type="button"
          onClick={onStop}
          className={`um-stop-button ${
            darkMode ? "border-[#222] bg-[#080808]" : "border-[#d8d8d8] bg-white"
          }`}
        >
          Stop
        </button>
      )}

      <div
        className={`um-input-box ${
          darkMode ? "border-[#222] bg-[#050505]" : "border-[#d8d8d8] bg-white"
        }`}
      >
        <textarea
          aria-label="Send a message"
          enterKeyHint="send"
          rows={1}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={
            isConnected
              ? "Send a message..."
              : isSearching
                ? "Waiting for stranger..."
                : "Type a message..."
          }
          className={`um-message-input ${
            darkMode ? "text-white placeholder:text-gray-500" : "text-black placeholder:text-gray-400"
          }`}
        />

        <button
          type="button"
          aria-label="Send message"
          onClick={onSend}
          className={`um-send-button ${
            isConnected ? "cursor-pointer text-[#9ca3af]" : "cursor-default text-[#9ca3af]"
          }`}
        >
          <Send size={34} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

function UmingleZoomStyles() {
  const includeLegacyZoomStyles = false;

  return includeLegacyZoomStyles ? (
    <style jsx global>{`
      .um-video-page {
        --header-height: 73px;
        --page-gap: 10px;
        --page-pad: 10px;
        --top-pad: 4px;
        --video-height: calc(
          (100dvh - var(--header-height) - var(--top-pad) - (2 * var(--page-pad)) - var(--page-gap)) / 2
        );
        width: 100vw;
        height: 100dvh;
        overflow: hidden;
      }

      .um-shell {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .um-header {
        height: var(--header-height);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 8px;
      }

      .um-logo-link {
        display: flex;
        align-items: center;
        min-width: 0;
        height: 100%;
      }

      .um-logo {
        width: auto;
        height: 57px;
        object-fit: contain;
      }

      .um-header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .um-toggle {
        width: 64px;
        height: 31px;
        display: flex;
        align-items: center;
        padding: 3px;
        border-radius: 999px;
        transition: background 0.2s ease;
      }

      .um-toggle-dot {
        display: block;
        width: 25px;
        height: 25px;
        background: white;
        border-radius: 999px;
        transition: transform 0.2s ease;
      }

      .um-toggle-dot-on {
        transform: translateX(33px);
      }

      .um-user-count {
        display: flex;
        align-items: baseline;
        gap: 5px;
        color: #704cff;
        line-height: 1;
        white-space: nowrap;
      }

      .um-user-count strong {
        font-size: 34px;
        font-weight: 800;
      }

      .um-user-count span {
        font-size: 28px;
      }

      .um-main {
        flex-grow: 1;
        min-height: 0;
        display: flex;
        width: 100vw;
        padding: var(--top-pad) var(--page-pad) var(--page-pad);
        gap: var(--page-gap);
      }

      .um-video-grid {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--page-gap);
        flex-shrink: 0;
      }

      .um-video-pane {
        position: relative;
        width: calc(var(--video-height) * 4 / 3);
        height: var(--video-height);
        overflow: hidden;
        border-radius: 10px;
        flex-shrink: 0;
      }

      .um-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .um-watermark {
        position: absolute;
        left: 18px;
        bottom: 17px;
        color: #cdb6ff;
        font-weight: 800;
        line-height: 1;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
        user-select: none;
      }

      .um-watermark span {
        font-size: 31px;
      }

      .um-watermark small {
        font-size: 14px;
        margin-left: 2px;
      }

      .um-report-button {
        position: absolute;
        right: 14px;
        bottom: 14px;
        color: rgba(255, 255, 255, 0.55);
      }

      .um-right-box {
        min-width: 0;
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--page-gap);
      }

      .um-chat-panel {
        min-height: 0;
        flex: 1;
        overflow: hidden;
        border-width: 1px;
        border-style: solid;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        padding: 26px 20px;
      }

      .um-welcome {
        font-size: 30px;
        line-height: 1.42;
      }

      .um-welcome h1 {
        font-size: 36px;
        font-weight: 800;
        line-height: 1.15;
        margin-bottom: 12px;
      }

      .um-age-warning {
        color: #4b3fd6;
        font-weight: 800;
      }

      .um-age-warning span {
        display: inline-flex;
        width: 29px;
        height: 29px;
        align-items: center;
        justify-content: center;
        border: 2px solid #dc2626;
        border-radius: 999px;
        margin-right: 4px;
        color: #000;
        font-size: 15px;
        line-height: 1;
      }

      .um-messages {
        font-size: 18px;
        line-height: 1.5;
      }

      .um-searching {
        margin-top: 20px;
        color: #6b7280;
        font-size: 18px;
        font-weight: 600;
      }

      .um-bottom-bar {
        width: 100%;
        height: 85px;
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .um-start-button,
      .um-stop-button {
        height: 100%;
        border-radius: 10px;
        flex-shrink: 0;
      }

      .um-start-button {
        width: 160px;
        color: white;
        background: #6f3ff2;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .um-start-main {
        font-size: 28px;
        line-height: 1;
      }

      .um-start-sub {
        margin-top: 2px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 16px;
        font-weight: 800;
        line-height: 1;
      }

      .um-stop-button {
        width: 110px;
        border-width: 1px;
        border-style: solid;
        font-size: 20px;
        font-weight: 700;
      }

      .um-input-box {
        min-width: 0;
        flex: 1;
        display: flex;
        align-items: center;
        border-width: 1px;
        border-style: solid;
        border-radius: 10px;
        padding: 0 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .um-message-input {
        min-width: 0;
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 20px;
      }

      .um-send-button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 48px;
        height: 48px;
      }

      @media (max-width: 1200px) {
        .um-video-page {
          --header-height: 8vh;
          --page-pad: 1.5vh;
          --top-pad: 0.25vh;
          --page-gap: 1vh;
          --button-size: 11vh;
        }

        .um-header {
          max-width: calc((65vh * (4 / 3)) * 2 + 5px);
          margin: 0 auto;
          padding: 0.85vh;
        }

        .um-logo {
          height: 6.4vh;
          max-height: 57px;
        }

        .um-user-count strong {
          font-size: 3.6vh;
        }

        .um-user-count span {
          font-size: 3vh;
        }

        .um-toggle {
          width: 7vh;
          height: 3.4vh;
          padding: 0.35vh;
        }

        .um-toggle-dot {
          width: 2.7vh;
          height: 2.7vh;
        }

        .um-toggle-dot-on {
          transform: translateX(3.55vh);
        }

        .um-main {
          flex-direction: column;
          max-width: calc((65vh * (4 / 3)) * 2 + 5px);
          margin: 0 auto;
          padding: var(--top-pad) var(--page-pad) var(--page-pad);
          gap: var(--page-gap);
        }

        .um-video-grid {
          width: 100%;
          flex-direction: row;
          gap: 5px;
          justify-content: center;
          flex-shrink: 0;
        }

        .um-video-pane {
          width: 100%;
          max-width: calc((100% - 5px) / 2);
          height: auto;
          max-height: 65vh;
          aspect-ratio: 4 / 3;
        }

        .um-right-box {
          gap: var(--page-gap);
        }

        .um-chat-panel {
          padding: 1.3vh;
        }

        .um-welcome {
          font-size: 1.8vh;
        }

        .um-welcome h1 {
          font-size: 3vh;
          margin-bottom: 0.6vh;
        }

        .um-age-warning span {
          width: 2.8vh;
          height: 2.8vh;
          font-size: 1.3vh;
        }

        .um-bottom-bar {
          height: var(--button-size);
          gap: 1vh;
        }

        .um-start-button {
          width: calc(1.5 * var(--button-size));
          border-radius: 1vh;
        }

        .um-start-main {
          font-size: 3vh;
        }

        .um-start-sub {
          font-size: 2vh;
        }

        .um-stop-button {
          width: var(--button-size);
          border-radius: 1vh;
          font-size: 2vh;
        }

        .um-input-box {
          border-radius: 1vh;
          padding: 0 2vh;
        }

        .um-message-input {
          font-size: 2vh;
        }

        .um-watermark {
          left: 1.6vh;
          bottom: 1.5vh;
        }

        .um-watermark span {
          font-size: 3vh;
        }

        .um-watermark small {
          font-size: 1.3vh;
        }

        .um-report-button {
          right: 1.2vh;
          bottom: 1.2vh;
        }
      }

      @media (max-width: 600px) {
        .um-video-page {
          --header-height: 62px;
          --button-size: 80px;
        }

        .um-logo {
          height: 42px;
          max-width: calc(100vw - 140px);
        }

        .um-user-count span {
          display: none;
        }

        .um-video-grid {
          display: block;
          position: relative;
        }

        .um-video-pane.remote {
          width: 100%;
          max-width: none;
          aspect-ratio: 4 / 3;
        }

        .um-video-pane.local {
          position: absolute;
          z-index: 20;
          right: 5px;
          top: 5px;
          width: 80px;
          height: auto;
          aspect-ratio: 4 / 3;
          border-radius: 0.5em;
        }

        .um-welcome h1 {
          font-size: 24px;
        }

        .um-welcome {
          font-size: 18px;
        }

        .um-bottom-bar {
          height: var(--button-size);
        }

        .um-start-button {
          width: 106px;
        }

        .um-start-sub,
        .um-stop-button {
          display: none;
        }
      }
    `}</style>
  ) : null;
}
