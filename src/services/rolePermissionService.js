/**
 * Enterprise Role-Based Access Control (RBAC) Permission Engine
 * Evaluates permissions dynamically based on activeRole
 */

export const rolePermissionService = {
  canEvaluate: (role) => ['guide', 'classroom_faculty', 'reviewer'].includes(role),
  
  canEditMarks: (role) => ['guide', 'classroom_faculty', 'reviewer', 'admin'].includes(role),

  canPublish: (role) => ['admin'].includes(role),

  canAssign: (role) => ['admin'].includes(role),

  canRotateReviewer: (role) => ['admin'].includes(role),

  canBroadcast: (role) => ['admin'].includes(role),

  canViewReports: (role) => ['admin', 'guide', 'classroom_faculty', 'reviewer'].includes(role),

  canManageUsers: (role) => ['admin'].includes(role),

  canManageRubrics: (role) => ['admin'].includes(role),

  canCloseSemester: (role) => ['admin'].includes(role),

  hasPermission: (role, permission) => {
    if (rolePermissionService[permission]) {
      return rolePermissionService[permission](role);
    }
    return false;
  }
};
