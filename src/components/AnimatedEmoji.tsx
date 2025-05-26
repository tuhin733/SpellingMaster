import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import Tooltip from "./Tooltip";

export interface AnimatedEmojiProps {
  emojiName: string;
  size?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  tooltipContent?: string;
}

/**
 * A component that displays animated emojis using Noto Emoji Animation
 * Uses Google's Noto Emoji Animation: https://googlefonts.github.io/noto-emoji-animation/
 */
const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  emojiName,
  size = "32px",
  className = "",
  loop = true,
  autoplay = true,
  tooltipContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Common emoji mappings
  const emojiMap: Record<string, string> = {
    party: "1f389", // 🎉
    trophy: "1f3c6", // 🏆
    thumbsup: "1f44d", // 👍
    smile: "1f642", // 🙂
    thinking: "1f914", // 🤔
    partying: "1f973", // 🥳
    fire: "1f525", // 🔥
    star: "2b50", // ⭐
    heart: "2764", // ❤️
    clap: "1f44f", // 👏
    rocket: "1f680", // 🚀
    sparkles: "2728", // ✨
    checkmark: "2705", // ✅
    xmark: "274c", // ❌
    tada: "1f389", // 🎉 (same as party)
    fireworks: "1f386", // 🎆
    confetti: "1f38a", // 🎊
    medal: "1f3c5", // 🏅
    lightbulb: "1f4a1", // 💡
    muscle: "1f4aa", // 💪
    nerd: "1f913", // 🤓
    books: "1f4da", // 📚
    hundred: "1f4af", // 💯

    // Additional face emojis
    grinning: "1f600", // 😀 Grinning face
    star_struck: "1f929", // 🤩 Star-struck face
    smiling_face_with_hearts: "1f970", // 🥰 Smiling face with hearts
    grinning_with_sweat: "1f605", // 😅 Grinning face with sweat
    face_with_raised_eyebrow: "1f928", // 🤨 Face with raised eyebrow
    face_with_monocle: "1f9d0", // 🧐 Face with monocle
    face_with_open_mouth: "1f62e", // 😮 Face with open mouth
    wink: "1f609", // 😉 Winking face
    relieved: "1f60c", // 😌 Relieved face
    slightly_frowning: "1f641", // 🙁 Slightly frowning face
    worried: "1f61f", // 😟 Worried face
    persevere: "1f623", // 😣 Persevering face
    triumph: "1f624", // 😤 Face with steam from nose
    tired: "1f62b", // 😫 Tired face
  };

  // Get the emoji code from the mapping or use the provided code directly
  const getEmojiPath = () => {
    const emojiCode = emojiMap[emojiName.toLowerCase()] || emojiName;
    return `https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiCode}/lottie.json`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop,
      autoplay,
      path: getEmojiPath(),
    });

    return () => {
      animation.destroy();
    };
  }, [emojiName, loop, autoplay]);

  const emojiComponent = (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size, display: "inline-block" }}
      aria-label={`${emojiName} emoji`}
    />
  );

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {emojiComponent}
      </Tooltip>
    );
  }

  return emojiComponent;
};

export default AnimatedEmoji;
