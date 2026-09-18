import { Tag } from "../types/models";

export const DEFAULT_TAGS: Array<Pick<Tag, "icon" | "label">> = [
  { icon: "restaurant-outline", label: "Home cooked" },
  { icon: "cafe-outline", label: "Coffee run" },
  { icon: "pizza-outline", label: "Takeout" },
  { icon: "nutrition-outline", label: "Plant-rich" },
  { icon: "ice-cream-outline", label: "Sweet treat" },
  { icon: "wine-outline", label: "Dining out" },
  { icon: "leaf-outline", label: "Hydration" },
  { icon: "time-outline", label: "Quick bite" },
  { icon: "walk-outline", label: "On the go" },
  { icon: "moon-outline", label: "Late night snack" },
];
