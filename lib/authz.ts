import { Session } from "next-auth";
import prisma from "./prisma";
import { sha256 } from "./crypto";
import { NextRequest } from "next/server";

/**
 * Extended user type with role and displayId properties
 */
interface ExtendedUser {
  role: string;
  displayId: string;
}

/**
 * Extended session type with our custom user properties
 */
interface ExtendedSession extends Session {
  user: ExtendedUser;
}

/**
 * Checks if the current user is an admin or the owner of the resource
 * @param session - The user session
 * @param displayId - The displayId of the resource owner
 * @returns True if the user is an admin or the owner
 */
const isAdminOrOwner = (session: Session, displayId: string): boolean => {
  const extendedSession = session as ExtendedSession;
  if (extendedSession.user.role === "admin") return true;
  return extendedSession.user.displayId === displayId;
};

/**
 * Checks if the current user is an admin
 * @param session - The user session
 * @returns True if the user is an admin
 */
const isAdmin = (session: Session): boolean => {
  return (session as ExtendedSession).user.role === "admin";
};

/**
 * Checks if the current user is an admin or a member
 * @param session - The user session
 * @returns True if the user is an admin or a member
 */
const isAdminOrMember = (session: Session): boolean => {
  const extendedSession = session as ExtendedSession;
  return extendedSession.user.role === "member" || extendedSession.user.role === "admin";
};

/**
 * Validates a request using Basic authentication
 * @param request - The incoming request
 * @returns The authenticated user or false if authentication fails
 */
const checkBasicToken = async (request: NextRequest) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  
  const token = authHeader.replace("Basic ", "");
  const hashedToken = sha256(token);
  
  if (process.env.ALLOW_ADMIN_API_CALL === "true") {
    const user = await prisma.user.findUnique({
      where: {
        password: hashedToken
      }
    });
    return user || false;
  }
  
  // Admin accounts are not allowed for authentication in this context
  const user = await prisma.user.findUnique({
    where: {
      password: hashedToken,
      roleId: "member"
    }
  });
  
  return user || false;
};

export { isAdminOrOwner, isAdminOrMember, isAdmin, checkBasicToken };
