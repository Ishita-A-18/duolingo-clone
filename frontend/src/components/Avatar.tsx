import { avatarColor } from "@/lib/theme";

export function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-black text-white"
      style={{ width: size, height: size, background: avatarColor(color), fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
