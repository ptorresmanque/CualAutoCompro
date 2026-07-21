import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiService } from '../../core/api.service';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | string;
  createdAt: string;
}

@Component({
  selector: 'app-users-admin',
  imports: [MatButtonModule],
  templateUrl: './users-admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersAdminComponent {
  private readonly api = inject(ApiService);
  private readonly feedback = inject(AdminFeedbackService);
  readonly items = signal<UserRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly workingId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: UserRow[] }>('/admin/users');
      this.items.set(res.data);
    } catch {
      this.error.set('No se pudieron cargar los usuarios.');
    } finally {
      this.loading.set(false);
    }
  }

  async changeRole(user: UserRow): Promise<void> {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    this.workingId.set(user.id);
    try {
      await this.api.post(`/admin/users/${user.id}/${nextRole === 'ADMIN' ? 'promote' : 'demote'}`, {});
      this.feedback.success(`${user.name} ahora tiene rol ${nextRole}`);
      await this.load();
    } catch (error) {
      this.feedback.error((error as Error).message);
    } finally {
      this.workingId.set(null);
    }
  }
}
