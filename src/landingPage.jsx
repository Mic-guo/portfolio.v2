import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useTheme } from "./context/ThemeContext";

gsap.registerPlugin(TextPlugin);

const LandingPage = () => {
  const theme = useTheme();
  const textRef = useRef(null);
  const cursorRef = useRef(null);
  const initialViewRef = useRef(null);
  const stickyHeaderRef = useRef(null);

  useEffect(() => {
    const texts = ["Software Engineer", "Web Developer", "Photographer"];

    const createTypeSequence = (textArray) => {
      const timeline = gsap.timeline({ repeat: -1 });

      textArray.forEach((text) => {
        timeline
          .to(textRef.current, {
            duration: 1.5,
            text: text,
            ease: "none",
          })
          .to(textRef.current, {
            duration: 1,
            text: {
              value: "",
              rtl: true,
            },
            ease: "none",
            delay: 1,
          });
      });

      return timeline;
    };

    // Create sequence from texts array
    const sequence = createTypeSequence(texts);

    // Simple cursor blink
    gsap.to(cursorRef.current, {
      opacity: 0,
      repeat: -1,
      yoyo: true,
      duration: 0.6,
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (stickyHeaderRef.current) {
          stickyHeaderRef.current.style.opacity = entry.isIntersecting
            ? "0"
            : "1";
        }
      },
      { threshold: 0.1 }
    );

    if (initialViewRef.current) {
      observer.observe(initialViewRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className={`w-full ${theme.background} bg-stone-50 flex-col relative select-none`}
      >
        {/* Initial centered view */}
        <div
          ref={initialViewRef}
          className="h-screen flex flex-col items-center justify-center"
        >
          <div className="flex flex-col gap-2 items-center z-10">
            <h1 className={`text-6xl ${theme.textPrimary} font-leiko`}>
              Michael Guo
            </h1>
            <div className={`flex text-6xl ${theme.textSecondary} font-leiko`}>
              <h1 ref={textRef}></h1>
              <span ref={cursorRef}>|</span>
            </div>

            {/* Social links */}
            <div className="flex justify-between items-center gap-8 mt-6">
              <a
                href="https://github.com/Mic-Guo"
                className={`${theme.iconDefault} text-2xl ${theme.iconHover} transition-colors duration-300`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub />
              </a>
              <a
                href="https://www.linkedin.com/in/Mic-guo/"
                className={`${theme.iconDefault} text-2xl ${theme.iconHover} transition-colors duration-300`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://www.instagram.com/michael.goop/"
                className={`${theme.iconDefault} text-2xl ${theme.iconHover} transition-colors duration-300`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
              <a
                href="mailto:mickeyg@umich.edu"
                className={`${theme.iconDefault} text-2xl ${theme.iconHover} transition-colors duration-300`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MdEmail />
              </a>
            </div>
          </div>
        </div>
        {/* Content after scroll */}
        <div className="min-h-screen">
          <h1
            ref={stickyHeaderRef}
            className={`text-6xl ${theme.textPrimary} font-leiko fixed bottom-0 py-4 ${theme.background} opacity-0 transition-opacity duration-300`}
          >
            Michael Guo
          </h1>
          {/* Your actual content will go here */}
        </div>
      </div>
    </>
  );
};

export default LandingPage;
