import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TasksService, TaskItem } from '../../../shared/services/tasks.service';

@Component({
  selector: 'saas-tasks-accordion',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './saas-tasks-accordion.component.html',
  styleUrl: './saas-tasks-accordion.component.css'
})
export class SaasTasksAccordionComponent {
  constructor(public tasks: TasksService) {}

  open(): boolean {
    return this.tasks.accordionOpen();
  }

  toggle(): void {
    this.tasks.toggleAccordion();
  }

  get list(): TaskItem[] {
    return this.tasks.getTasks();
  }

  get processingCount(): number {
    return this.tasks.getProcessingCount();
  }

  get processedCount(): number {
    return this.tasks.getProcessedCount();
  }

  get totalCount(): number {
    return this.tasks.getTotalCount();
  }

  get hasTasks(): boolean {
    return this.totalCount > 0;
  }
}
