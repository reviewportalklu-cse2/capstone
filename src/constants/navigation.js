import { 
  LayoutDashboard, Users, FileText, ClipboardList, BookOpen, UserCheck, 
  Settings, UserCog, LogOut, FileBarChart, PieChart, ShieldCheck, Download, 
  Search, PlayCircle, BarChart3, DatabaseBackup, Upload, HelpCircle, Bell, Clock,
  RefreshCw, UserCircle, Shield, Award, Layers
} from 'lucide-react';

export const adminNavigation = [
  // Dashboard Section
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, section: 'Dashboard' },
  { name: 'Reports Hub', href: '/admin/reports', icon: PieChart, section: 'Dashboard' },

  // Data Management Section
  { name: 'Enterprise Bulk Upload Center', href: '/admin/sync', icon: RefreshCw, section: 'Data Management' },
  { name: 'Students', href: '/admin/students', icon: UserCheck, section: 'Data Management' },
  { name: 'Teams & Groups', href: '/admin/teams', icon: Users, section: 'Data Management' },
  { name: 'Projects', href: '/admin/projects', icon: FileText, section: 'Data Management' },
  { name: 'Guides', href: '/admin/guides', icon: UserCheck, section: 'Data Management' },
  { name: 'Classroom Faculty', href: '/admin/faculty', icon: BookOpen, section: 'Data Management' },
  { name: 'Reviewers', href: '/admin/reviewers', icon: UserCog, section: 'Data Management' },

  // Evaluation Section
  { name: 'Rubrics Engine', href: '/admin/rubrics', icon: ClipboardList, section: 'Evaluation' },
  { name: 'Review Cycles', href: '/admin/review-cycles', icon: Clock, section: 'Evaluation' },
  { name: 'Reviewer Assignments', href: '/admin/reviewer-assignments', icon: ShieldCheck, section: 'Evaluation' },
  { name: 'Evaluation Center', href: '/admin/evaluation-center', icon: Layers, section: 'Evaluation' },

  // Results Section
  { name: 'Semester Result Engine', href: '/admin/semester-results', icon: BarChart3, section: 'Results' },

  // Communication Section
  { name: 'Notifications', href: '/admin/notifications', icon: Bell, section: 'Communication' },

  // Administration Section
  { name: 'Security Settings', href: '/admin/security', icon: Shield, section: 'Administration' },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings, section: 'Administration' },
  { name: 'Backup & Restore', href: '/admin/backup', icon: DatabaseBackup, section: 'Administration' },
];

export const studentNavigation = [
  { name: 'Evaluation Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Team Progress', href: '/student/my-project', icon: BookOpen },
  { name: 'My Evaluations', href: '/student/evaluations', icon: ShieldCheck },
  { name: 'Timeline & History', href: '/student/timeline', icon: Clock },
  { name: 'Submission Portal', href: '/student/submissions', icon: Upload },
  { name: 'Marks & Results', href: '/student/results', icon: FileBarChart },
  { name: 'Notifications', href: '/student/notifications', icon: Bell },
  { name: 'Academic Profile', href: '/student/profile', icon: UserCog },
];

export const guideNavigation = [
  { name: 'Dashboard', href: '/guide/dashboard', icon: LayoutDashboard },
  { name: 'Team Supervision', href: '/guide/teams', icon: Users },
  { name: 'Evaluations', href: '/guide/marks', icon: ShieldCheck },
  { name: 'Meeting Schedules', href: '/guide/meetings', icon: PlayCircle },
  { name: 'Analytics & Reports', href: '/guide/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/guide/notifications', icon: Bell },
  { name: 'My Profile', href: '/guide/profile', icon: UserCircle },
];

export const reviewerNavigation = [
  { name: 'Dashboard', href: '/reviewer/dashboard', icon: LayoutDashboard },
  { name: 'Assigned Teams', href: '/reviewer/teams', icon: Users },
  { name: 'Evaluations', href: '/reviewer/evaluations', icon: ShieldCheck },
  { name: 'Reports', href: '/reviewer/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/reviewer/notifications', icon: Bell },
  { name: 'My Profile', href: '/reviewer/profile', icon: UserCircle },
];

export const facultyNavigation = [
  { name: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { name: 'Team Tracking', href: '/faculty/teams', icon: Users },
  { name: 'Evaluations', href: '/faculty/evaluations', icon: FileText },
  { name: 'Reports', href: '/faculty/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/faculty/notifications', icon: Bell },
  { name: 'My Profile', href: '/faculty/profile', icon: UserCircle },
];

export const userProfileNavigation = [
  { name: 'My Profile', href: '/profile', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Logout', href: '/logout', icon: LogOut },
];
