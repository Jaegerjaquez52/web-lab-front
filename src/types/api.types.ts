export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: User['role'];
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  ownerId: number | null;
  owner: Pick<User, 'id' | 'name' | 'email'> | null;
  members: TeamMember[];
  _count?: { projects: number };
}

export interface ApiError {
  error: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number | null;
  teamId: number | null;
  createdAt: string;
  updatedAt: string;
  owner?: Pick<User, 'id' | 'name' | 'email'> | null;
  team?: Team | null;
  _count?: { tasks: number };
}

export interface TaskAssignment {
  taskId: number;
  userId: number;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface TaskProject {
  id: number;
  name: string;
  ownerId: number | null;
  teamId: number | null;
  team: Pick<Team, 'ownerId' | 'members'> | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string | null;
  projectId: number | null;
  project?: TaskProject | null;
  assignments?: TaskAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: number;
  text: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}