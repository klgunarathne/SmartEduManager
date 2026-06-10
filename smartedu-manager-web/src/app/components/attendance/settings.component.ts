import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Settings } from '../../services/attendance.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  settings = signal<Settings>({
    minimumAttendancePercentage: 75,
    presentColor: '#22c55e',
    absentColor: '#ef4444',
    noClassColor: '#9ca3af',
    workingDays: [1, 2, 3, 4, 5, 6]
  });

  dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor(private attendanceService: AttendanceService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.attendanceService.getSettings().subscribe({
      next: (data) => this.settings.set(data),
      error: () => {}
    });
  }

  saveSettings(): void {
    this.attendanceService.updateSettings(this.settings()).subscribe({
      error: (err) => console.error('Error saving settings:', err)
    });
  }

  toggleWorkingDay(day: number): void {
    const current = this.settings().workingDays;
    if (current.includes(day)) {
      this.settings.set({ ...this.settings(), workingDays: current.filter(d => d !== day) });
    } else {
      this.settings.set({ ...this.settings(), workingDays: [...current, day].sort() });
    }
  }

  isWorkingDay(day: number): boolean {
    return this.settings().workingDays.includes(day);
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading();
  }
}