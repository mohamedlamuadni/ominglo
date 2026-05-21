"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {

  const [darkMode, setDarkMode] = useState(false);

  const [inputValue, setInputValue] = useState("");

  const [tags, setTags] = useState([]);

  // LOAD THEME
  useEffect(() => {

    const savedTheme =
      localStorage.getItem("darkMode");

    if (savedTheme !== null) {

      setDarkMode(
        savedTheme === "true"
      );
    }

  }, []);

  // SAVE THEME
  useEffect(() => {

    localStorage.setItem(
      "darkMode",
      darkMode
    );

  }, [darkMode]);

  // ADD TAG
  const addTag = () => {

    const cleaned =
      inputValue
        .trim()
        .replace(/#/g, "");

    if (!cleaned) return;

    const lower =
      cleaned.toLowerCase();

    if (
      tags.includes(lower)
    ) return;

    setTags((prev) => [
      ...prev,
      lower,
    ]);

    setInputValue("");
  };

  // REMOVE TAG
  const removeTag = (tag) => {

    setTags(
      tags.filter(
        (t) => t !== tag
      )
    );
  };

  return (

    <main
      className={`min-h-screen transition-all duration-500 px-5 pb-6 ${
        darkMode
          ? "bg-black text-white"
          : "bg-[#f3f3f3] text-black"
      }`}
    >

      {/* HEADER */}
      <div className="flex items-start justify-between">

        {/* LOGO */}
        <div className="flex items-start">

          <Image
            src="/ominglo.png"
            alt="ominglo"
            width={285}
            height={57}
            priority
            draggable={false}
            className="w-[190px] sm:w-[240px] md:w-[285px] h-auto object-contain select-none"
          />

        </div>

        {/* DARK MODE */}
        <button
          type="button"
          onClick={() =>
            setDarkMode(
              (prev) => !prev
            )
          }
          className={`w-[66px] h-[36px] rounded-full relative transition-all duration-500 mt-2 ${
            darkMode
              ? "bg-purple-600"
              : "bg-gray-300"
          }`}
        >

          <div
            className={`absolute top-[3px] w-[30px] h-[30px] rounded-full bg-white transition-all duration-500 ${
              darkMode
                ? "left-[33px]"
                : "left-[3px]"
            }`}
          />

        </button>

      </div>

      {/* CARD */}
      <div className="flex justify-center -mt-1">

        <section
          className={`w-full max-w-4xl rounded-[32px] px-6 py-10 sm:px-12 sm:py-14 transition-all duration-500 ${
            darkMode
              ? "bg-[#0f0f10]"
              : "bg-white"
          }`}
        >

          {/* TITLE */}
          <h1 className="text-4xl sm:text-6xl font-bold text-center leading-tight">
            Chat with Strangers
          </h1>

          {/* DESC */}
          <p
            className={`text-center mt-7 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto ${
              darkMode
                ? "text-gray-300"
                : "text-gray-600"
            }`}
          >
            Ready to meet someone new? Ominglo makes it easy to
            chat with strangers in random video or text chats.
          </p>

          {/* START */}
          <div className="mt-12 text-center">

            <h2 className="text-3xl sm:text-4xl font-bold">
              Start chatting
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-8">

              {/* TEXT BUTTON */}
              <button className="w-[190px] h-[72px] rounded-[24px] text-3xl font-bold bg-gradient-to-b from-fuchsia-500 to-purple-700 hover:scale-105 transition-all duration-300">
                Text
              </button>

              <span
                className={`text-2xl ${
                  darkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                or
              </span>

              {/* VIDEO BUTTON */}
              <button
                onClick={() => {
                  window.location.href = "/video";
                }}
                className="w-[190px] h-[72px] rounded-[24px] text-3xl font-bold bg-gradient-to-b from-fuchsia-500 to-purple-700 hover:scale-105 transition-all duration-300"
              >
                Video
              </button>

            </div>

          </div>

          {/* HASHTAGS */}
          <div className="mt-14">

            <h3 className="text-center text-3xl sm:text-4xl font-bold">
              What do you want to talk about?
            </h3>

            <div
              className={`mt-7 rounded-[24px] border p-4 min-h-[82px] flex flex-wrap items-center gap-3 transition-all duration-300 ${
                darkMode
                  ? "border-purple-600 bg-[#161616]"
                  : "border-purple-300 bg-white"
              }`}
            >

              {/* TAGS */}
              {tags.map(
                (tag, index) => (

                  <div
                    key={index}
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-base flex items-center gap-2"
                  >

                    #{tag}

                    <button
                      type="button"
                      onClick={() =>
                        removeTag(tag)
                      }
                      className="font-bold"
                    >
                      ×
                    </button>

                  </div>
                )
              )}

              {/* INPUT */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) =>
                  setInputValue(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter"
                  ) {

                    e.preventDefault();

                    addTag();
                  }

                  if (
                    e.key ===
                      "Backspace" &&
                    inputValue === "" &&
                    tags.length > 0
                  ) {

                    setTags(
                      tags.slice(
                        0,
                        -1
                      )
                    );
                  }
                }}
                placeholder="Add interests..."
                className={`flex-1 min-w-[150px] bg-transparent outline-none text-lg ${
                  darkMode
                    ? "text-white placeholder:text-gray-500"
                    : "text-black placeholder:text-gray-400"
                }`}
              />

            </div>

          </div>

          {/* FOOTER */}
          <div className="mt-10 flex justify-center">

            <div className="bg-purple-100 text-purple-700 px-6 py-4 rounded-[22px] text-center text-lg max-w-lg">
              Chats are moderated. Please keep it respectful
            </div>

          </div>

        </section>

      </div>

    </main>
  );
}