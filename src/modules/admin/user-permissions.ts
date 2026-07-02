export function canManageUserStatus(permissions: string[]) {
  return (
    permissions.includes("platform.users.manage") || permissions.includes("platform.users.status")
  );
}

export function canManageUsersFully(permissions: string[]) {
  return permissions.includes("platform.users.manage");
}
