export function adaptFriendInviteMoveAfterAcceptance(text: string, isFriendInvite: boolean): string {
  if (!isFriendInvite) return text;
  return text.replace(/^邀请时说[:：]?\s*/, "接下来可以说：");
}
