import { TwitchBadge } from "../badge";
import { TwitchBadgesList } from "../badges";
import { parseIntThrowing } from "./common";
import { ParseError } from "./parse-error";

export function parseSingleBadge(badgeSrc: string): TwitchBadge {
  // src format: <badge>/<version>

  const [badgeName, badgeVersionSrc] = badgeSrc.split("/", 2);
  if (badgeName == null || badgeVersionSrc == null) {
    throw new ParseError(
      `Badge source "${badgeSrc}" did not contain '/' character`
    );
  }

  const badgeVersion = parseIntThrowing(badgeVersionSrc);

  return new TwitchBadge(badgeName, badgeVersion);
}

export function parseBadges(badgesSrc: string): TwitchBadgesList {
  // src format: <badge>/<version>,<badge>/<version>,<badge>/<version>

  if (badgesSrc.length <= 0) {
    return new TwitchBadgesList();
  }

  const badges = new TwitchBadgesList();
  for (const badgeSrc of badgesSrc.split(",")) {
    badges.push(parseSingleBadge(badgeSrc));
  }
  return badges;
}
