import { img, type ImageKey } from "@/lib/images";

// Portrait photo per mock actor id. Used anywhere an avatar is displayed.
const AVATAR_KEYS: Record<string, ImageKey> = {
  "prod-1": "portraitMan1",
  "prod-2": "portraitMan2",
  "prod-3": "portraitWoman1",
  "prod-4": "portraitPerson",
  "buyer-1": "portraitWoman2",
  "buyer-2": "portraitMan3",
  "buyer-3": "portraitWoman1",
  "trans-1": "portraitMan2",
  "trans-2": "portraitPerson",
  "trans-3": "portraitMan1",
};

export function avatarUrl(actorId: string, width = 160): string | undefined {
  const key = AVATAR_KEYS[actorId];
  return key ? img(key, width) : undefined;
}
