import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserCog,
  GraduationCap,
  ClipboardList,
  Upload,
  FileBarChart,
  Bell,
  Settings,
  DatabaseBackup,
  ShieldCheck
} from 'lucide-react';

export const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Guides', href: '/admin/guides', icon: UserCheck },
  { name: 'Reviewers', href: '/admin/reviewers', icon: UserCog },
  { name: 'Faculty', href: '/admin/faculty', icon: GraduationCap },
  { name: 'Submissions', href: '/admin/submissions', icon: ClipboardList },
  { name: 'Evaluation Center ⭐', href: '/admin/evaluation-center', icon: ShieldCheck },
  { name: 'CSV / Excel Sync', href: '/admin/sync', icon: Upload },
  { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Backup & Restore', href: '/admin/backup', icon: DatabaseBackup },
];

export const guideNavigation = [
  { name: 'Dashboard', href: '/guide/dashboard', icon: LayoutDashboard },
  { name: 'My Projects', href: '/guide/projects', icon: FileBarChart },
  { name: 'My Students', href: '/guide/students', icon: Users },
  { name: 'Guide Marks', href: '/guide/marks', icon: ClipboardList },
  { name: 'Review Remarks', href: '/guide/remarks', icon: ClipboardList },
  { name: 'Progress Tracking', href: '/guide/progress', icon: FileBarChart },
  { name: 'Meetings', href: '/guide/meetings', icon: Users },
  { name: 'Notifications', href: '/guide/notifications', icon: Bell },
  { name: 'Reports', href: '/guide/reports', icon: FileBarChart },
  { name: 'Downloads', href: '/guide/downloads', icon: Upload },
  { name: 'Help & Support', href: '/guide/help', icon: Settings },
];

export const reviewerNavigation = [
  { name: 'Dashboard', href: '/reviewer/dashboard', icon: LayoutDashboard },
  { name: 'My Batches', href: '/reviewer/batches', icon: Users },
  { name: 'Assigned Students', href: '/reviewer/students', icon: UserCheck },
  { name: 'Review 1 (External)', href: '/reviewer/review1', icon: ClipboardList },
  { name: 'Review 2 (External)', href: '/reviewer/review2', icon: ClipboardList },
  { name: 'Review 3 (External)', href: '/reviewer/review3', icon: ClipboardList },
  { name: 'View Submissions', href: '/reviewer/submissions', icon: FileBarChart },
  { name: 'Bulk Upload Marks', href: '/reviewer/upload-marks', icon: Upload },
  { name: 'My Reports', href: '/reviewer/reports', icon: FileBarChart },
  { name: 'Export Data', href: '/reviewer/export', icon: DatabaseBackup },
  { name: 'Profile & Settings', href: '/reviewer/profile', icon: UserCog },
  { name: 'Help & Support', href: '/reviewer/help', icon: Settings },
];

export const facultyNavigation = [
  { name: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { name: 'My Students', href: '/faculty/students', icon: Users },
  { name: 'Enter Marks', href: '/faculty/marks', icon: ClipboardList },
  { name: 'Bulk Upload Marks', href: '/faculty/upload', icon: Upload },
  { name: 'View Submissions', href: '/faculty/submissions', icon: FileBarChart },
  { name: 'Search Student', href: '/faculty/search', icon: UserCheck },
  { name: 'My Reports', href: '/faculty/reports', icon: FileBarChart },
  { name: 'Notifications', href: '/faculty/notifications', icon: Bell },
  { name: 'Profile & Settings', href: '/faculty/profile', icon: Settings },
];

export const studentNavigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', href: '/student/profile', icon: UserCog },
  { name: 'My Project', href: '/student/project', icon: FileBarChart },
  { name: 'My Guide', href: '/student/guide', icon: UserCheck },
  { name: 'My Marks', href: '/student/marks', icon: ClipboardList },
  { name: 'Review Remarks', href: '/student/remarks', icon: ClipboardList },
  { name: 'Progress Status', href: '/student/progress', icon: FileBarChart },
  { name: 'Downloads', href: '/student/downloads', icon: Upload },
  { name: 'Notifications', href: '/student/notifications', icon: Bell },
  { name: 'Help & Support', href: '/student/help', icon: Settings },
];
